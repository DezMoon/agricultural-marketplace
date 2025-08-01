// src/server.ts - TypeScript server entry point
import 'module-alias/register';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables first
dotenv.config();

import app from './app';
import { initializeDatabase } from './config/initDatabase';

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to the app
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Handle user joining their own room for private messages (frontend uses 'joinRoom')
  socket.on('joinRoom', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their room (user_${userId})`);
  });

  // Also handle the previous version for compatibility
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their room (user_${userId})`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Start server with database initialization
async function startServer() {
  try {
    // Initialize database schema
    await initializeDatabase();

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 TypeScript Server listening on port ${PORT}`);
      console.log(
        `📊 Health check available at http://localhost:${PORT}/health`
      );
      console.log(`🔧 Running in TypeScript mode with hot reload`);
      console.log(`🔌 Socket.IO server initialized`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
