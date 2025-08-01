"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts - Main application file with TypeScript
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables first
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
// Import middleware
const security_1 = require("@/middleware/security");
// Import routes
const users_1 = __importDefault(require("@/routes/users"));
const produce_1 = __importDefault(require("@/routes/produce"));
const messages_1 = __importDefault(require("@/routes/messages"));
// Create Express application
const app = (0, express_1.default)();
// Apply security middleware
app.use(security_1.securityHeaders);
app.use(security_1.generalLimiter);
app.use((0, cors_1.default)(security_1.corsOptions));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3001');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}, express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        typescript: true
    });
});
// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Agricultural Marketplace API',
        version: '1.0.0',
        typescript: true,
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            users: '/api/users',
            produce: '/api/produce',
            messages: '/api/messages'
        }
    });
});
// Routes
app.use('/api/users', users_1.default);
app.use('/api/produce', produce_1.default);
app.use('/api/messages', messages_1.default);
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
exports.default = app;
//# sourceMappingURL=app.js.map