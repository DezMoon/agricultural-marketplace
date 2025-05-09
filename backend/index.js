require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const produceRoutes = require('./routes/produce');
const userRoutes = require('./routes/users'); // New user routes
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
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

// Routes
app.use('/api/produce', produceRoutes);
app.use('/api/users', userRoutes); // Use the new user routes

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
