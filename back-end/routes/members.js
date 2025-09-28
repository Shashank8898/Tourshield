const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Room = require('../models/Room');
const LocationHistory = require('../models/LocationHistory');

// POST /api/members/:memberId/location - Update member location
router.post('/:memberId/location', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { location, battery } = req.body;

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid location coordinates required' 
      });
    }

    const member = await Member.findOne({ id: memberId });
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found' 
      });
    }

    // Update member location
    const updateData = {
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || null,
        timestamp: new Date()
      },
      lastSeen: new Date()
    };

    if (battery !== undefined) {
      updateData.battery = battery;
    }

    await Member.findOneAndUpdate({ id: memberId }, updateData);

    // Save location history
    const locationHistory = new LocationHistory({
      memberId,
      roomId: member.roomId,
      location: updateData.location,
      timestamp: updateData.location.timestamp,
      battery: battery || member.battery
    });
    await locationHistory.save();

    // Emit location update to room via Socket.io
    if (req.io) {
      req.io.to(`room_${member.roomId}`).emit('location_update', {
        memberId,
        memberName: member.name,
        location: updateData.location,
        battery: battery || member.battery,
        timestamp: updateData.location.timestamp
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: updateData.location
    });

  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update location' 
    });
  }
});

// POST /api/members/:memberId/checkin - Member check-in
router.post('/:memberId/checkin', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { location } = req.body;

    const member = await Member.findOne({ id: memberId });
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found' 
      });
    }

    const checkInTime = new Date();
    
    const updateData = {
      lastCheckIn: checkInTime,
      lastSeen: checkInTime
    };

    if (location) {
      updateData.location = {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || null,
        timestamp: checkInTime
      };
    }

    await Member.findOneAndUpdate({ id: memberId }, updateData);

    // Emit check-in notification to room
    if (req.io) {
      req.io.to(`room_${member.roomId}`).emit('member_checkin', {
        memberId,
        memberName: member.name,
        checkInTime,
        location: updateData.location
      });
    }

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      checkInTime
    });

  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check-in' 
    });
  }
});

// PUT /api/members/:memberId/battery - Update battery status
router.put('/:memberId/battery', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { battery } = req.body;

    if (battery === undefined || battery < 0 || battery > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid battery level (0-100) required' 
      });
    }

    const member = await Member.findOneAndUpdate(
      { id: memberId },
      { 
        battery,
        lastSeen: new Date()
      },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found' 
      });
    }

    // Emit battery update to room
    if (req.io) {
      req.io.to(`room_${member.roomId}`).emit('battery_update', {
        memberId,
        memberName: member.name,
        battery,
        isLow: battery <= 20
      });

      // Send low battery alert if needed
      if (battery <= 20) {
        req.io.to(`room_${member.roomId}`).emit('alert', {
          type: 'warning',
          message: `${member.name}'s device battery is low (${battery}%)`,
          memberId,
          timestamp: new Date()
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Battery status updated',
      battery
    });

  } catch (error) {
    console.error('Error updating battery:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update battery status' 
    });
  }
});

// PUT /api/members/:memberId/status - Update member status
router.put('/:memberId/status', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status } = req.body;

    if (!['active', 'away', 'offline'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status required (active, away, offline)' 
      });
    }

    const member = await Member.findOneAndUpdate(
      { id: memberId },
      { 
        status,
        lastSeen: new Date()
      },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found' 
      });
    }

    // Emit status update to room
    if (req.io) {
      req.io.to(`room_${member.roomId}`).emit('status_update', {
        memberId,
        memberName: member.name,
        status,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated',
      status
    });

  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status' 
    });
  }
});

// GET /api/members/:memberId/history - Get member location history
router.get('/:memberId/history', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { limit = 50, hours = 24 } = req.query;

    const member = await Member.findOne({ id: memberId });
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found' 
      });
    }

    const timeLimit = new Date(Date.now() - (hours * 60 * 60 * 1000));

    const history = await LocationHistory.find({
      memberId,
      timestamp: { $gte: timeLimit }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      history: history.map(h => ({
        location: h.location,
        timestamp: h.timestamp,
        battery: h.battery
      }))
    });

  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch location history' 
    });
  }
});

// POST /api/members/:memberId/emergency - Trigger emergency alert
router.post('/:memberId/emergency', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { location, message = 'Emergency SOS activated' } = req.body;

    const member = await Member.findOne({ id: memberId });
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found' 
      });
    }

    const emergencyData = {
      memberId,
      memberName: member.name,
      location: location || member.location,
      message,
      timestamp: new Date(),
      type: 'emergency'
    };

    // Update member status to emergency
    await Member.findOneAndUpdate(
      { id: memberId },
      { 
        status: 'emergency',
        lastSeen: new Date(),
        ...(location && { location })
      }
    );

    // Emit emergency alert to entire room
    if (req.io) {
      req.io.to(`room_${member.roomId}`).emit('emergency_alert', emergencyData);
      
      req.io.to(`room_${member.roomId}`).emit('alert', {
        type: 'danger',
        message: `🚨 EMERGENCY: ${member.name} has activated SOS`,
        memberId,
        timestamp: new Date(),
        priority: 'high'
      });
    }

    // In production, you might want to:
    // - Send SMS/email notifications to emergency contacts
    // - Log emergency event to database
    // - Trigger external emergency services API

    res.status(200).json({
      success: true,
      message: 'Emergency alert sent',
      emergencyId: emergencyData.timestamp.getTime()
    });

  } catch (error) {
    console.error('Error triggering emergency alert:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send emergency alert' 
    });
  }
});

// DELETE /api/members/:memberId/emergency - Cancel emergency
router.delete('/:memberId/emergency', async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findOneAndUpdate(
      { id: memberId },
      { 
        status: 'active',
        lastSeen: new Date()
      },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found' 
      });
    }

    // Emit emergency cancellation to room
    if (req.io) {
      req.io.to(`room_${member.roomId}`).emit('emergency_cancelled', {
        memberId,
        memberName: member.name,
        timestamp: new Date()
      });

      req.io.to(`room_${member.roomId}`).emit('alert', {
        type: 'success',
        message: `${member.name} has cancelled the emergency alert`,
        memberId,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency alert cancelled'
    });

  } catch (error) {
    console.error('Error cancelling emergency:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel emergency alert' 
    });
  }
});

// GET /api/members/:memberId - Get member details
router.get('/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findOne({ id: memberId });
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found' 
      });
    }

    res.status(200).json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        roomId: member.roomId,
        location: member.location,
        status: member.status,
        isAdmin: member.isAdmin,
        battery: member.battery,
        lastSeen: member.lastSeen,
        lastCheckIn: member.lastCheckIn
      }
    });

  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch member details' 
    });
  }
});

module.exports = router;