// scripts/server-dev.js - Development server with relaxed rate limits for testing
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import routes
const usersRoutes = require('../src/routes/users');
const produceRoutes = require('../src/routes/produce');
const messagesRoutes = require('../src/routes/messages');

// Import development middleware with relaxed limits
const { 
  securityHeaders, 
  generalLimiter, 
  authLimiter, 
  uploadLimiter, 
  messageLimiter, 
  corsOptions 
} = require('../src/middleware/security-dev');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions
});

// Apply security middleware
app.use(securityHeaders);
app.use(generalLimiter);
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Agricultural Marketplace API',
    version: '1.0.0',
    environment: 'development',
    endpoints: {
      users: '/api/users',
      produce: '/api/produce',
      messages: '/api/messages'
    }
  });
});

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/produce', produceRoutes);
app.use('/api/messages', messagesRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', (messageData) => {
    io.to(messageData.roomId).emit('receive_message', messageData);
  });

  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Development server listening on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`⚠️  Using relaxed rate limits for testing`);
});

module.exports = app;
