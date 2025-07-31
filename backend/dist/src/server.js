"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts - TypeScript server entry point
require("module-alias/register");
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
// Load environment variables first
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const initDatabase_1 = require("./config/initDatabase");
const PORT = process.env.PORT || 3000;
// Create HTTP server
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true
    }
});
// Make io accessible to the app
app_1.default.set('io', io);
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    // Handle user joining their own room for private messages
    socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} joined their room`);
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
        await (0, initDatabase_1.initializeDatabase)();
        // Start HTTP server
        server.listen(PORT, () => {
            console.log(`🚀 TypeScript Server listening on port ${PORT}`);
            console.log(`📊 Health check available at http://localhost:${PORT}/health`);
            console.log(`🔧 Running in TypeScript mode with hot reload`);
            console.log(`🔌 Socket.IO server initialized`);
        });
    }
    catch (error) {
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
//# sourceMappingURL=server.js.map