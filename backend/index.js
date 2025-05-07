const express = require('express');
const app = express();
const port = 3000;
const produceRoutes = require('./routes/produce'); // Don't import io here anymore
const cors = require('cors');
const { Server } = require('socket.io');

// Middleware
app.use(cors());
app.use(express.json());

// Start the server
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`A user disconnected: ${socket.id}`);
  });
});

// Mount the routes, passing the io object
app.use(
  '/api/produce',
  (req, res, next) => {
    req.io = io; // Make io available in the request object
    next();
  },
  produceRoutes
);

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});
