const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const colors = require('colors');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/db');
const setupSocket = require('./config/socket');
const NotificationScheduler = require('./utils/notificationScheduler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Import error middleware
const { errorHandler } = require('./middleware/errorMiddleware');

// Import cache middleware
const cacheMiddleware = require('./middleware/cacheMiddleware');

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = setupSocket(server);

// Make io available globally for notifications
global.io = io;

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Real-Time Task Manager API',
    version: '1.0.0',
    status: 'Active',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/activities', activityRoutes);

// Cache statistics endpoint
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cacheMiddleware.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats'
    });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Get port from environment
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
  
  // Initialize user management system
  try {
    const { initializeUserManagement } = require('./utils/initUserManagement');
    await initializeUserManagement();
    console.log('✅ User management system initialized'.green);
  } catch (error) {
    console.error('❌ Failed to initialize user management system:'.red, error.message);
  }
  
  // Initialize notification scheduler
  NotificationScheduler.init();
  
  // Cache warmup
  try {
    const warmupFunctions = {
      'system:roles': async () => {
        const { Role } = require('./models/UserManagement');
        return await Role.find({ isSystemRole: true }).select('name level permissions');
      },
      'system:users:count': async () => {
        const User = require('./models/User');
        return await User.countDocuments();
      }
    };
    
    await cacheMiddleware.warmup(warmupFunctions);
    console.log('✅ Cache warmed up'.green);
  } catch (error) {
    console.error('❌ Cache warmup failed:'.red, error.message);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;