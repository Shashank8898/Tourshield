const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes and middleware
const roomRoutes = require('./routes/rooms');
const memberRoutes = require('./routes/members');
const { initializeGeoTracking } = require('./socket/geoTracking');
const { 
  socketMiddleware, 
  createRateLimit, 
  errorHandler, 
  corsOptions 
} = require('./middleware/socketMiddleware');

// Database connection
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/geotracking', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize geo-tracking server
const initializeGeoTrackingServer = (existingApp = null) => {
  const app = existingApp || express();
  const server = http.createServer(app);
  
  // Socket.io setup with CORS
  const io = socketIo(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Initialize database connection
  connectDatabase();

  // Middleware
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use('/api/rooms', createRateLimit(15 * 60 * 1000, 50)); // 50 requests per 15 minutes for room operations
  app.use('/api/members', createRateLimit(60 * 1000, 100)); // 100 requests per minute for member operations

  // Attach Socket.io to requests
  app.use(socketMiddleware(io));

  // Routes
  app.use('/api/rooms', roomRoutes);
  app.use('/api/members', memberRoutes);

  // Health check endpoint
  app.get('/api/geo-tracking/health', (req, res) => {
    res.json({
      success: true,
      message: 'Geo-tracking server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      connections: io.engine.clientsCount
    });
  });

  // Get server statistics
  app.get('/api/geo-tracking/stats', async (req, res) => {
    try {
      const Room = require('./models/Room');
      const Member = require('./models/Member');

      const [totalRooms, activeRooms, totalMembers, activeMembers] = await Promise.all([
        Room.countDocuments(),
        Room.countDocuments({ isActive: true }),
        Member.countDocuments(),
        Member.countDocuments({ status: { $in: ['active', 'away'] } })
      ]);

      res.json({
        success: true,
        stats: {
          totalRooms,
          activeRooms,
          totalMembers,
          activeMembers,
          connectedClients: io.engine.clientsCount,
          uptime: process.uptime()
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }
  });

  // Initialize Socket.io handlers
  initializeGeoTracking(io);

  // Error handling middleware
  app.use(errorHandler);

  // Handle 404 for geo-tracking routes
  app.use('/api/rooms/', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Room endpoint not found'
    });
  });

  app.use('/api/members/', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Member endpoint not found'
    });
  });

  return { app, server, io };
};

// Graceful shutdown
const gracefulShutdown = (server) => {
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
};

// Export for integration with existing server
module.exports = {
  initializeGeoTrackingServer,
  gracefulShutdown,
  connectDatabase
};

// If running as standalone server
if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  
  const { server } = initializeGeoTrackingServer();
  
  server.listen(PORT, () => {
    console.log(`Geo-tracking server running on port ${PORT}`);
  });

  gracefulShutdown(server);
}