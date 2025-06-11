// backend/index.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Ensure this is correctly configured for your database
const produceRoutes = require('./routes/produce');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages'); // NEW: Import message routes
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3001', // Or your frontend's origin
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Socket.IO middleware to make io instance available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/produce', produceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes); // NEW: Use the new message routes

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Allow a user to join a specific room identified by their userId
  socket.on('joinRoom', (userId) => {
    // Leave any previously joined rooms to avoid multiple room issues
    // if a user logs in/out multiple times without full page refresh
    socket.rooms.forEach((room) => {
      if (room.startsWith('user-') && room !== `user-${userId}`) {
        socket.leave(room);
      }
    });
    socket.join(`user-${userId}`);
    console.log(
      `User ${userId} joined room user-${userId} via socket ${socket.id}`
    );
  });

  socket.on('refreshUnread', (userId) => {
    io.to(`user-${userId}`).emit('refreshUnread');
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
