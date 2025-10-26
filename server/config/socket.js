const jwt = require('jsonwebtoken');
const User = require('../models/User');

const setupSocket = (server) => {
  // Get allowed origins from environment
  const allowedOrigins = process.env.CLIENT_URL 
    ? process.env.CLIENT_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

  const io = require('socket.io')(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Authorization"]
    },
    transports: ['websocket', 'polling']
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Store active users per project
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.name} (${user._id}) - Socket: ${socket.id}`.green);

    // Join project room
    socket.on('join-project', (projectId, userId) => {
      // Verify user can join this project (basic check)
      if (userId !== user._id.toString()) {
        socket.emit('error', 'Unauthorized: Cannot join project for another user');
        return;
      }

      socket.join(projectId);
      
      // Track active users in this project
      if (!activeUsers.has(projectId)) {
        activeUsers.set(projectId, new Set());
      }
      activeUsers.get(projectId).add(userId);
      
      // Notify others in the room about new user
      socket.to(projectId).emit('user-online', {
        userId,
        userName: user.name,
        userEmail: user.email
      });
      
      // Send current active users to the newly joined user
      socket.emit('active-users', Array.from(activeUsers.get(projectId)));
      
      console.log(`User ${user.name} joined project ${projectId}`.blue);
    });

    // Leave project room
    socket.on('leave-project', (projectId, userId) => {
      // Verify user can leave this project
      if (userId !== user._id.toString()) {
        socket.emit('error', 'Unauthorized: Cannot leave project for another user');
        return;
      }

      socket.leave(projectId);
      
      if (activeUsers.has(projectId)) {
        activeUsers.get(projectId).delete(userId);
        if (activeUsers.get(projectId).size === 0) {
          activeUsers.delete(projectId);
        }
      }
      
      socket.to(projectId).emit('user-offline', {
        userId,
        userName: user.name
      });
      console.log(`User ${user.name} left project ${projectId}`.yellow);
    });

    // Task created
    socket.on('task-created', (data) => {
      socket.to(data.projectId).emit('task-created', data.task);
    });

    // Task updated
    socket.on('task-updated', (data) => {
      socket.to(data.projectId).emit('task-updated', data.task);
    });

    // Task deleted
    socket.on('task-deleted', (data) => {
      socket.to(data.projectId).emit('task-deleted', data.taskId);
    });

    // Task moved (status changed)
    socket.on('task-moved', (data) => {
      socket.to(data.projectId).emit('task-moved', {
        taskId: data.taskId,
        newStatus: data.newStatus,
        task: data.task
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.name} (${user._id}) - Socket: ${socket.id}`.red);
      
      // Remove user from all projects they were in
      for (const [projectId, users] of activeUsers.entries()) {
        if (users.has(user._id.toString())) {
          users.delete(user._id.toString());
          // Notify others in the project
          socket.to(projectId).emit('user-offline', {
            userId: user._id.toString(),
            userName: user.name
          });
          
          // Clean up empty project rooms
          if (users.size === 0) {
            activeUsers.delete(projectId);
          }
        }
      }
    });
  });

  return io;
};

module.exports = setupSocket;