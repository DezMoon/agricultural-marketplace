// backend/index.js - Server entry point
const http = require('http');
const app = require('./src/app');
const SocketService = require('./src/services/socketService');

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO service
const socketService = new SocketService(server);

// Make io instance available to the app
app.set('io', socketService.getIO());

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});
