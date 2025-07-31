// src/services/socketService.js - Socket.IO service
const { Server } = require('socket.io');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 User connected:', socket.id);

      // Allow a user to join a specific room identified by their userId
      socket.on('joinRoom', (userId) => {
        // Leave any previously joined rooms to avoid multiple room issues
        socket.rooms.forEach((room) => {
          if (room.startsWith('user-') && room !== `user-${userId}`) {
            socket.leave(room);
          }
        });
        
        socket.join(`user-${userId}`);
        console.log(`👤 User ${userId} joined room user-${userId} via socket ${socket.id}`);
      });

      socket.on('refreshUnread', (userId) => {
        this.io.to(`user-${userId}`).emit('refreshUnread');
      });

      socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
      });
    });
  }

  getIO() {
    return this.io;
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    this.io.to(`user-${userId}`).emit(event, data);
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = SocketService;
