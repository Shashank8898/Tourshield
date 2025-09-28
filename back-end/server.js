const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')
require('dotenv').config()

const app = express()
const server = http.createServer(app)

// Enhanced CORS configuration for Clerk and Socket.IO
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization']
}

app.use(cors(corsOptions))

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: corsOptions
})

// Middleware
app.use(helmet())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
})
app.use(limiter)

// In-memory storage for geo-fencing (use Redis or MongoDB in production)
const rooms = new Map()
const userSessions = new Map()

// Room model class
class SafetyRoom {
  constructor(name, creatorId, creatorName, geoFence) {
    this.id = this.generateRoomCode()
    this.name = name
    this.creatorId = creatorId
    this.creatorName = creatorName
    this.members = new Map()
    this.geoFence = geoFence
    this.createdAt = new Date()
    this.isActive = true
    
    // Add creator as first member
    this.members.set(creatorId, {
      id: creatorId,
      name: creatorName,
      isCreator: true,
      joinedAt: new Date(),
      lastLocation: geoFence.center,
      isOnline: true,
      socketId: null
    })
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'ROOM'
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  addMember(userId, userName, socketId) {
    this.members.set(userId, {
      id: userId,
      name: userName,
      isCreator: false,
      joinedAt: new Date(),
      lastLocation: null,
      isOnline: true,
      socketId: socketId
    })
  }

  removeMember(userId) {
    this.members.delete(userId)
  }

  updateMemberLocation(userId, location) {
    const member = this.members.get(userId)
    if (member) {
      member.lastLocation = location
      member.lastUpdate = new Date()
      
      // Check geo-fence breach
      const distance = this.calculateDistance(location, this.geoFence.center)
      if (distance > this.geoFence.radius) {
        return {
          breach: true,
          distance: Math.round(distance),
          member: member
        }
      }
    }
    return { breach: false }
  }

  calculateDistance(pos1, pos2) {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = pos1.lat * Math.PI / 180
    const φ2 = pos2.lat * Math.PI / 180
    const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180
    const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      creatorName: this.creatorName,
      memberCount: this.members.size,
      geoFence: this.geoFence,
      createdAt: this.createdAt,
      isActive: this.isActive,
      members: Array.from(this.members.values()).map(member => ({
        id: member.id,
        name: member.name,
        isCreator: member.isCreator,
        isOnline: member.isOnline,
        lastLocation: member.lastLocation,
        joinedAt: member.joinedAt
      }))
    }
  }
}

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join room
  socket.on('join-room', (data) => {
    const { roomId, userId, userName } = data
    const room = rooms.get(roomId)
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' })
      return
    }

    // Add user to room
    room.addMember(userId, userName, socket.id)
    socket.join(roomId)
    
    // Update user session
    userSessions.set(socket.id, { userId, roomId, userName })
    
    // Notify room members
    io.to(roomId).emit('member-joined', {
      member: {
        id: userId,
        name: userName,
        isCreator: false,
        isOnline: true,
        joinedAt: new Date()
      },
      room: room.toJSON()
    })

    console.log(`${userName} joined room ${roomId}`)
  })

  // Leave room
  socket.on('leave-room', () => {
    const session = userSessions.get(socket.id)
    if (session) {
      const { roomId, userId, userName } = session
      const room = rooms.get(roomId)
      
      if (room) {
        room.removeMember(userId)
        socket.leave(roomId)
        
        // Notify remaining members
        io.to(roomId).emit('member-left', {
          userId,
          userName,
          room: room.toJSON()
        })

        // Delete room if no members left
        if (room.members.size === 0) {
          rooms.delete(roomId)
          console.log(`Room ${roomId} deleted - no members remaining`)
        }
      }
      
      userSessions.delete(socket.id)
      console.log(`${userName} left room ${roomId}`)
    }
  })

  // Location update
  socket.on('location-update', (data) => {
    const session = userSessions.get(socket.id)
    if (session) {
      const { roomId, userId } = session
      const room = rooms.get(roomId)
      
      if (room) {
        const result = room.updateMemberLocation(userId, data.location)
        
        // Broadcast location to room members
        socket.to(roomId).emit('location-update', {
          userId,
          location: data.location,
          timestamp: new Date()
        })

        // Check for geo-fence breach
        if (result.breach) {
          const alert = {
            id: uuidv4(),
            type: 'geo-fence-breach',
            userId: userId,
            userName: result.member.name,
            message: `${result.member.name} moved outside the safe zone! Distance: ${result.distance}m`,
            location: data.location,
            distance: result.distance,
            timestamp: new Date(),
            severity: result.distance > room.geoFence.radius * 1.5 ? 'critical' : 'high'
          }

          // Send alert to all room members
          io.to(roomId).emit('geo-fence-alert', alert)
          
          // Log for safety monitoring
          console.log(`GEO-FENCE BREACH: ${result.member.name} in room ${roomId} - Distance: ${result.distance}m`)
        }
      }
    }
  })

  // Emergency SOS
  socket.on('emergency-sos', (data) => {
    const session = userSessions.get(socket.id)
    if (session) {
      const { roomId, userId, userName } = session
      const room = rooms.get(roomId)
      
      if (room) {
        const emergencyAlert = {
          id: uuidv4(),
          type: 'emergency-sos',
          userId,
          userName,
          message: `🚨 EMERGENCY SOS from ${userName}!`,
          location: data.location,
          timestamp: new Date(),
          severity: 'critical',
          additionalInfo: data.message || 'Emergency assistance needed'
        }

        // Broadcast to all room members
        io.to(roomId).emit('emergency-alert', emergencyAlert)
        
        console.log(`EMERGENCY SOS: ${userName} in room ${roomId}`)
      }
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    const session = userSessions.get(socket.id)
    if (session) {
      const { roomId, userId, userName } = session
      const room = rooms.get(roomId)
      
      if (room) {
        const member = room.members.get(userId)
        if (member) {
          member.isOnline = false
          member.socketId = null
        }
        
        // Notify room members about offline status
        io.to(roomId).emit('member-offline', {
          userId,
          userName
        })
      }
      
      userSessions.delete(socket.id)
    }
    
    console.log('User disconnected:', socket.id)
  })
})

// Geo-fencing REST API Routes

// Get all public rooms
app.get('/api/geofencing/rooms', (req, res) => {
  try {
    const publicRooms = Array.from(rooms.values())
      .filter(room => room.isActive)
      .map(room => ({
        id: room.id,
        name: room.name,
        creatorName: room.creatorName,
        memberCount: room.members.size,
        radius: room.geoFence.radius,
        createdAt: room.createdAt,
        location: room.geoFence.center
      }))
    
    res.json({
      success: true,
      rooms: publicRooms
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message
    })
  }
})

// Create new room
app.post('/api/geofencing/rooms', (req, res) => {
  try {
    const { name, creatorId, creatorName, geoFence } = req.body
    
    // Validate required fields
    if (!name || !creatorId || !creatorName || !geoFence) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, creatorId, creatorName, geoFence'
      })
    }

    // Validate geo-fence
    if (!geoFence.center || !geoFence.radius || 
        typeof geoFence.center.lat !== 'number' || 
        typeof geoFence.center.lng !== 'number' ||
        geoFence.radius < 50 || geoFence.radius > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid geo-fence data. Radius must be between 50-5000 meters.'
      })
    }

    const room = new SafetyRoom(name, creatorId, creatorName, geoFence)
    rooms.set(room.id, room)
    
    console.log(`Room created: ${room.id} by ${creatorName}`)
    
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: room.toJSON()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    })
  }
})

// Get specific room details
app.get('/api/geofencing/rooms/:roomId', (req, res) => {
  try {
    const { roomId } = req.params
    const room = rooms.get(roomId)
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      })
    }
    
    res.json({
      success: true,
      room: room.toJSON()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room details',
      error: error.message
    })
  }
})

// Join room (REST endpoint)
app.post('/api/geofencing/rooms/:roomId/join', (req, res) => {
  try {
    const { roomId } = req.params
    const { userId, userName } = req.body
    
    if (!userId || !userName) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or userName'
      })
    }

    const room = rooms.get(roomId)
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      })
    }

    // Check if user already in room
    if (room.members.has(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User already in room'
      })
    }

    room.addMember(userId, userName, null)
    
    res.json({
      success: true,
      message: 'Successfully joined room',
      room: room.toJSON()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join room',
      error: error.message
    })
  }
})

// Update room settings (only creator can update)
app.put('/api/geofencing/rooms/:roomId/settings', (req, res) => {
  try {
    const { roomId } = req.params
    const { userId, geoFence, name } = req.body
    
    const room = rooms.get(roomId)
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      })
    }

    // Check if user is creator
    if (room.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only room creator can update settings'
      })
    }

    // Update settings
    if (name) room.name = name
    if (geoFence) {
      if (geoFence.radius && geoFence.radius >= 50 && geoFence.radius <= 5000) {
        room.geoFence.radius = geoFence.radius
      }
      if (geoFence.center && geoFence.center.lat && geoFence.center.lng) {
        room.geoFence.center = geoFence.center
      }
    }
    
    res.json({
      success: true,
      message: 'Room settings updated',
      room: room.toJSON()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update room settings',
      error: error.message
    })
  }
})

// Emergency SOS endpoint
app.post('/api/emergency/sos', (req, res) => {
  try {
    const { userId, location, message, roomId } = req.body
    
    // Log emergency for authorities
    const emergencyLog = {
      id: uuidv4(),
      userId,
      location,
      message,
      roomId,
      timestamp: new Date(),
      status: 'active'
    }
    
    console.log('EMERGENCY SOS RECEIVED:', emergencyLog)
    
    // In production, integrate with:
    // - Police dispatch systems
    // - Medical services  
    // - Tourist helpline
    // - SMS/Email alerts to emergency contacts
    
    res.json({
      success: true,
      message: 'Emergency SOS received. Help is on the way!',
      emergencyId: emergencyLog.id,
      estimatedResponseTime: '5-10 minutes'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process emergency SOS',
      error: error.message
    })
  }
})

// Existing routes
app.use('/api/routes', require('./routes/routeRoutes'))

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TourShield Backend is running!',
    activeRooms: rooms.size,
    totalUsers: userSessions.size,
    timestamp: new Date().toISOString()
  })
})

app.get('/api/geofencing/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    activeRooms: rooms.size,
    totalUsers: userSessions.size,
    features: {
      realTimeLocationSharing: true,
      geoFencing: true,
      emergencySOS: true,
      roomManagement: true
    }
  })
})

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working!', timestamp: new Date().toISOString() })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack)
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

const PORT = process.env.PORT || 8000

// // Connect to MongoDB and start server
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourshield')
//   .then(() => {
//     console.log('✅ Connected to MongoDB')
//     server.listen(PORT, () => {
//       console.log(`🚀 Server running on http://localhost:${PORT}`)
//       console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`)
//       console.log(`🏥 Health check: http://localhost:${PORT}/health`)
//       console.log(`🛡️ Geo-fencing API: http://localhost:${PORT}/api/geofencing`)
//       console.log(`📡 Socket.IO server ready for real-time connections`)
//       console.log(`🗺️ Active rooms: ${rooms.size}`)
//     })
//   })
//   .catch(err => console.error('❌ MongoDB connection error:', err))

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
  console.log(`🛡️ Geo-fencing API: http://localhost:${PORT}/api/geofencing`)
  console.log(`📡 Socket.IO server ready for real-time connections`)
  console.log(`🗺️ Active rooms: ${rooms.size}`)
})