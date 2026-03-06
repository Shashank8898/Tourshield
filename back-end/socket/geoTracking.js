const Member = require('../models/Member');
const Room = require('../models/Room');
const LocationHistory = require('../models/LocationHistory');

// Store active connections
const activeConnections = new Map();

// Calculate distance between two points
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

// Check geo-fence breach
async function checkGeoFence(memberId, location) {
  try {
    const member = await Member.findOne({ id: memberId });
    if (!member) return null;

    const room = await Room.findOne({ id: member.roomId, isActive: true });
    if (!room) return null;

    const distance = calculateDistance(
      location.lat,
      location.lng,
      room.geoFence.center.lat,
      room.geoFence.center.lng
    );

    const isWithinFence = distance <= room.geoFence.radius;
    
    return {
      isWithinFence,
      distance: Math.round(distance),
      fenceRadius: room.geoFence.radius,
      breach: !isWithinFence
    };
  } catch (error) {
    console.error('Error checking geo-fence:', error);
    return null;
  }
}

// Initialize Socket.io handlers
function initializeGeoTracking(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room
    socket.on('join_room', async (data) => {
      try {
        const { roomId, memberId, memberName } = data;

        if (!roomId || !memberId) {
          socket.emit('error', { message: 'Room ID and Member ID required' });
          return;
        }

        // Verify member exists
        const member = await Member.findOne({ id: memberId, roomId });
        if (!member) {
          socket.emit('error', { message: 'Member not found in room' });
          return;
        }

        // Join room
        socket.join(`room_${roomId}`);
        
        // Store connection info
        activeConnections.set(socket.id, {
          memberId,
          memberName: memberName || member.name,
          roomId,
          joinedAt: new Date()
        });

        // Update member status
        await Member.findOneAndUpdate(
          { id: memberId },
          { 
            status: 'active',
            lastSeen: new Date()
          }
        );

        // Notify room of member joining
        socket.to(`room_${roomId}`).emit('member_joined', {
          memberId,
          memberName: memberName || member.name,
          timestamp: new Date()
        });

        // Send current room members to the joining member
        const roomMembers = await Member.findRoomMembers(roomId);
        socket.emit('room_members', {
          members: roomMembers.map(m => ({
            id: m.id,
            name: m.name,
            location: m.location,
            status: m.status,
            isAdmin: m.isAdmin,
            battery: m.battery,
            lastSeen: m.lastSeen
          }))
        });

        console.log(`Member ${memberName} joined room ${roomId}`);

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Real-time location update
    socket.on('location_update', async (data) => {
      try {
        const connection = activeConnections.get(socket.id);
        if (!connection) {
          socket.emit('error', { message: 'Not connected to any room' });
          return;
        }

        const { location, battery, accuracy } = data;
        const { memberId, memberName, roomId } = connection;

        if (!location || !location.lat || !location.lng) {
          socket.emit('error', { message: 'Invalid location data' });
          return;
        }

        // Update member location
        const updateData = {
          location: {
            lat: location.lat,
            lng: location.lng,
            accuracy: accuracy || location.accuracy,
            timestamp: new Date()
          },
          lastSeen: new Date()
        };

        if (battery !== undefined) {
          updateData.battery = battery;
        }

        await Member.findOneAndUpdate({ id: memberId }, updateData);

        // Save to location history
        const locationHistory = new LocationHistory({
          memberId,
          roomId,
          location: updateData.location,
          timestamp: updateData.location.timestamp,
          battery: battery,
          speed: data.speed,
          heading: data.heading,
          altitude: data.altitude
        });
        await locationHistory.save();

        // Check geo-fence
        const fenceCheck = await checkGeoFence(memberId, location);
        
        // Broadcast location to room members
        const locationData = {
          memberId,
          memberName,
          location: updateData.location,
          battery: battery,
          timestamp: updateData.location.timestamp,
          fenceStatus: fenceCheck
        };

        socket.to(`room_${roomId}`).emit('location_update', locationData);

        // Send fence breach alert if necessary
        if (fenceCheck && fenceCheck.breach) {
          const alertData = {
            type: 'warning',
            message: `${memberName} is outside the safe zone! Distance: ${fenceCheck.distance}m`,
            memberId,
            memberName,
            location: updateData.location,
            distance: fenceCheck.distance,
            timestamp: new Date(),
            priority: 'high'
          };

          io.to(`room_${roomId}`).emit('fence_breach_alert', alertData);
          io.to(`room_${roomId}`).emit('alert', alertData);
        }

        // Low battery alert
        if (battery !== undefined && battery <= 20) {
          const batteryAlert = {
            type: 'warning',
            message: `${memberName}'s device battery is low (${battery}%)`,
            memberId,
            memberName,
            battery,
            timestamp: new Date()
          };

          io.to(`room_${roomId}`).emit('battery_alert', batteryAlert);
        }

      } catch (error) {
        console.error('Error updating location:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Manual check-in
    socket.on('checkin', async (data) => {
      try {
        const connection = activeConnections.get(socket.id);
        if (!connection) {
          socket.emit('error', { message: 'Not connected to any room' });
          return;
        }

        const { location } = data;
        const { memberId, memberName, roomId } = connection;

        const checkInTime = new Date();
        
        const updateData = {
          lastCheckIn: checkInTime,
          lastSeen: checkInTime
        };

        if (location) {
          updateData.location = {
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
            timestamp: checkInTime
          };
        }

        await Member.findOneAndUpdate({ id: memberId }, updateData);

        // Notify room
        const checkInData = {
          memberId,
          memberName,
          checkInTime,
          location: updateData.location
        };

        io.to(`room_${roomId}`).emit('member_checkin', checkInData);
        
        socket.emit('checkin_success', { 
          message: 'Check-in successful',
          timestamp: checkInTime 
        });

      } catch (error) {
        console.error('Error during check-in:', error);
        socket.emit('error', { message: 'Check-in failed' });
      }
    });

    // Emergency SOS
    socket.on('emergency_sos', async (data) => {
      try {
        const connection = activeConnections.get(socket.id);
        if (!connection) {
          socket.emit('error', { message: 'Not connected to any room' });
          return;
        }

        const { location, message = 'Emergency SOS activated' } = data;
        const { memberId, memberName, roomId } = connection;

        // Update member status to emergency
        await Member.findOneAndUpdate(
          { id: memberId },
          { 
            status: 'emergency',
            lastSeen: new Date(),
            ...(location && { location: {
              lat: location.lat,
              lng: location.lng,
              accuracy: location.accuracy,
              timestamp: new Date()
            }})
          }
        );

        const emergencyData = {
          memberId,
          memberName,
          location: location,
          message,
          timestamp: new Date(),
          type: 'emergency'
        };

        // Broadcast emergency to entire room
        io.to(`room_${roomId}`).emit('emergency_alert', emergencyData);
        
        // High priority alert
        io.to(`room_${roomId}`).emit('alert', {
          type: 'danger',
          message: `🚨 EMERGENCY: ${memberName} has activated SOS`,
          memberId,
          memberName,
          location,
          timestamp: new Date(),
          priority: 'critical'
        });

        socket.emit('emergency_sent', { 
          message: 'Emergency alert sent to all members',
          timestamp: new Date()
        });

        console.log(`Emergency SOS triggered by ${memberName} in room ${roomId}`);

      } catch (error) {
        console.error('Error sending emergency SOS:', error);
        socket.emit('error', { message: 'Failed to send emergency alert' });
      }
    });

    // Cancel emergency
    socket.on('cancel_emergency', async () => {
      try {
        const connection = activeConnections.get(socket.id);
        if (!connection) {
          socket.emit('error', { message: 'Not connected to any room' });
          return;
        }

        const { memberId, memberName, roomId } = connection;

        // Update member status back to active
        await Member.findOneAndUpdate(
          { id: memberId },
          { 
            status: 'active',
            lastSeen: new Date()
          }
        );

        // Notify room
        io.to(`room_${roomId}`).emit('emergency_cancelled', {
          memberId,
          memberName,
          timestamp: new Date()
        });

        io.to(`room_${roomId}`).emit('alert', {
          type: 'success',
          message: `${memberName} has cancelled the emergency alert`,
          memberId,
          memberName,
          timestamp: new Date()
        });

        socket.emit('emergency_cancelled_success', {
          message: 'Emergency alert cancelled'
        });

      } catch (error) {
        console.error('Error cancelling emergency:', error);
        socket.emit('error', { message: 'Failed to cancel emergency' });
      }
    });

    // Update member status
    socket.on('status_update', async (data) => {
      try {
        const connection = activeConnections.get(socket.id);
        if (!connection) return;

        const { status } = data;
        const { memberId, memberName, roomId } = connection;

        if (!['active', 'away', 'offline'].includes(status)) {
          socket.emit('error', { message: 'Invalid status' });
          return;
        }

        await Member.findOneAndUpdate(
          { id: memberId },
          { 
            status,
            lastSeen: new Date()
          }
        );

        // Notify room
        socket.to(`room_${roomId}`).emit('status_update', {
          memberId,
          memberName,
          status,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Error updating status:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Set meeting point (admin only)
    socket.on('set_meeting_point', async (data) => {
      try {
        const connection = activeConnections.get(socket.id);
        if (!connection) return;

        const { location, name } = data;
        const { memberId, memberName, roomId } = connection;

        // Check if user is admin
        const member = await Member.findOne({ id: memberId, isAdmin: true });
        if (!member) {
          socket.emit('error', { message: 'Only admin can set meeting point' });
          return;
        }

        // Update room meeting point
        await Room.findOneAndUpdate(
          { id: roomId },
          {
            meetingPoint: {
              lat: location.lat,
              lng: location.lng,
              name: name || 'Meeting Point',
              setBy: memberName,
              setAt: new Date()
            }
          }
        );

        // Notify all room members
        io.to(`room_${roomId}`).emit('meeting_point_set', {
          location,
          name: name || 'Meeting Point',
          setBy: memberName,
          setAt: new Date()
        });

        socket.emit('meeting_point_success', {
          message: 'Meeting point set successfully'
        });

      } catch (error) {
        console.error('Error setting meeting point:', error);
        socket.emit('error', { message: 'Failed to set meeting point' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        const connection = activeConnections.get(socket.id);
        if (connection) {
          const { memberId, memberName, roomId } = connection;

          // Update member status to offline
          await Member.findOneAndUpdate(
            { id: memberId },
            { 
              status: 'offline',
              lastSeen: new Date()
            }
          );

          // Notify room
          socket.to(`room_${roomId}`).emit('member_disconnected', {
            memberId,
            memberName,
            timestamp: new Date()
          });

          activeConnections.delete(socket.id);
          console.log(`Member ${memberName} disconnected from room ${roomId}`);
        }

      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Heartbeat to keep connection alive
    socket.on('heartbeat', async () => {
      try {
        const connection = activeConnections.get(socket.id);
        if (connection) {
          await Member.findOneAndUpdate(
            { id: connection.memberId },
            { lastSeen: new Date() }
          );
        }
        socket.emit('heartbeat_ack');
      } catch (error) {
        console.error('Error handling heartbeat:', error);
      }
    });
  });

      // Cleanup inactive connections periodically
    setInterval(async () => {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        // Find members who haven't been seen in 5 minutes
        await Member.updateMany(
          { 
            lastSeen: { $lt: fiveMinutesAgo },
            status: { $nin: ['offline', 'left'] }
          },
          { status: 'away' }
        );

        // Find members who haven't been seen in 30 minutes
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        await Member.updateMany(
          { 
            lastSeen: { $lt: thirtyMinutesAgo },
            status: 'away'
          },
          { status: 'offline' }
        );

      } catch (error) {
        console.error('Error in cleanup:', error);
      }
    }, 60000); // Run every minute
      return io;
  };


module.exports = { initializeGeoTracking, activeConnections };