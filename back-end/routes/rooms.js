const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Member = require('../models/Member');
const { v4: uuidv4 } = require('uuid');

// Generate unique room ID
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) id += '-';
    else id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Calculate distance between two coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// POST /api/rooms/create - Create a new room
router.post('/create', async (req, res) => {
  try {
    const { userName, fenceRadius = 500, checkInInterval = 30, location } = req.body;

    if (!userName || !location) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and location are required' 
      });
    }

    const roomId = generateRoomId();
    const memberId = uuidv4();

    // Create room
    const room = new Room({
      id: roomId,
      admin: userName,
      createdAt: new Date(),
      geoFence: {
        center: location,
        radius: fenceRadius,
        type: 'circular'
      },
      settings: {
        checkInInterval,
        alertsEnabled: true,
        trackingMode: 'realtime'
      },
      isActive: true
    });

    // Create admin member
    const adminMember = new Member({
      id: memberId,
      name: userName,
      roomId: roomId,
      location: location,
      status: 'active',
      isAdmin: true,
      battery: 100,
      lastSeen: new Date(),
      lastCheckIn: new Date()
    });

    await room.save();
    await adminMember.save();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: {
        id: roomId,
        admin: userName,
        createdAt: room.createdAt,
        geoFence: room.geoFence,
        settings: room.settings
      },
      member: {
        id: memberId,
        name: userName,
        isAdmin: true
      }
    });

  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create room' 
    });
  }
});

// POST /api/rooms/join - Join an existing room
router.post('/join', async (req, res) => {
  try {
    const { roomId, userName, location } = req.body;

    if (!roomId || !userName || !location) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room ID, username, and location are required' 
      });
    }

    // Check if room exists and is active
    const room = await Room.findOne({ id: roomId, isActive: true });
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found or inactive' 
      });
    }

    // Check if username is already taken in this room
    const existingMember = await Member.findOne({ roomId, name: userName });
    if (existingMember) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already taken in this room' 
      });
    }

    const memberId = uuidv4();

    // Create new member
    const member = new Member({
      id: memberId,
      name: userName,
      roomId: roomId,
      location: location,
      status: 'active',
      isAdmin: false,
      battery: 100,
      lastSeen: new Date(),
      lastCheckIn: new Date()
    });

    await member.save();

    // Get all room members
    const allMembers = await Member.find({ roomId, status: { $ne: 'left' } });

    res.status(200).json({
      success: true,
      message: 'Successfully joined room',
      room: {
        id: room.id,
        admin: room.admin,
        createdAt: room.createdAt,
        geoFence: room.geoFence,
        settings: room.settings
      },
      member: {
        id: memberId,
        name: userName,
        isAdmin: false
      },
      members: allMembers.map(m => ({
        id: m.id,
        name: m.name,
        location: m.location,
        status: m.status,
        isAdmin: m.isAdmin,
        battery: m.battery,
        lastSeen: m.lastSeen
      }))
    });

  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to join room' 
    });
  }
});

// GET /api/rooms/:roomId - Get room details
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ id: roomId, isActive: true });
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    const members = await Member.find({ roomId, status: { $ne: 'left' } });

    res.status(200).json({
      success: true,
      room: {
        id: room.id,
        admin: room.admin,
        createdAt: room.createdAt,
        geoFence: room.geoFence,
        settings: room.settings
      },
      members: members.map(m => ({
        id: m.id,
        name: m.name,
        location: m.location,
        status: m.status,
        isAdmin: m.isAdmin,
        battery: m.battery,
        lastSeen: m.lastSeen
      }))
    });

  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch room details' 
    });
  }
});

// PUT /api/rooms/:roomId/settings - Update room settings (admin only)
router.put('/:roomId/settings', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { memberId, fenceRadius, checkInInterval } = req.body;

    // Verify member is admin
    const member = await Member.findOne({ id: memberId, roomId, isAdmin: true });
    if (!member) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admin can update room settings' 
      });
    }

    const updateData = {};
    if (fenceRadius !== undefined) {
      updateData['geoFence.radius'] = fenceRadius;
    }
    if (checkInInterval !== undefined) {
      updateData['settings.checkInInterval'] = checkInInterval;
    }

    const room = await Room.findOneAndUpdate(
      { id: roomId },
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Room settings updated',
      settings: room.settings,
      geoFence: room.geoFence
    });

  } catch (error) {
    console.error('Error updating room settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update room settings' 
    });
  }
});

// POST /api/rooms/:roomId/leave - Leave room
router.post('/:roomId/leave', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { memberId } = req.body;

    const member = await Member.findOne({ id: memberId, roomId });
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found in room' 
      });
    }

    // Update member status to 'left'
    member.status = 'left';
    member.lastSeen = new Date();
    await member.save();

    // If admin is leaving, transfer admin to another member or deactivate room
    if (member.isAdmin) {
      const otherMembers = await Member.find({ 
        roomId, 
        status: { $ne: 'left' },
        id: { $ne: memberId }
      });

      if (otherMembers.length > 0) {
        // Transfer admin to the first available member
        const newAdmin = otherMembers[0];
        newAdmin.isAdmin = true;
        await newAdmin.save();

        // Update room admin
        await Room.findOneAndUpdate(
          { id: roomId },
          { admin: newAdmin.name }
        );
      } else {
        // No other members, deactivate room
        await Room.findOneAndUpdate(
          { id: roomId },
          { isActive: false }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Successfully left room'
    });

  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to leave room' 
    });
  }
});

// POST /api/rooms/:roomId/check-fence - Check if location is within geo-fence
router.post('/:roomId/check-fence', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { location } = req.body;

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid location coordinates required' 
      });
    }

    const room = await Room.findOne({ id: roomId, isActive: true });
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    const distance = calculateDistance(
      location.lat,
      location.lng,
      room.geoFence.center.lat,
      room.geoFence.center.lng
    );

    const isWithinFence = distance <= room.geoFence.radius;

    res.status(200).json({
      success: true,
      isWithinFence,
      distance: Math.round(distance),
      fenceRadius: room.geoFence.radius
    });

  } catch (error) {
    console.error('Error checking geo-fence:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check geo-fence' 
    });
  }
});

module.exports = router;