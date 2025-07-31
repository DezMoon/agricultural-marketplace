// src/app.js - Main Express application setup
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import security middleware
const { 
  securityHeaders, 
  generalLimiter, 
  sanitizeRequest, 
  corsOptions 
} = require('./middleware/security');

// Import routes
const produceRoutes = require('./routes/produce');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

const app = express();

// Trust proxy for rate limiting (if behind a proxy/load balancer)
app.set('trust proxy', 1);

// Security middleware (must be early in the middleware stack)
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(sanitizeRequest);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Socket.IO middleware to make io instance available to routes
app.use((req, res, next) => {
  req.io = req.app.get('io'); // Get io instance from app
  next();
});

// API Routes
app.use('/api/produce', produceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Agricultural Marketplace API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'Agricultural Marketplace API',
    version: '1.0.0',
    description: 'API for connecting farmers with buyers',
    endpoints: {
      auth: '/api/users',
      produce: '/api/produce',
      messages: '/api/messages'
    },
    docs: '/api/docs' // Future: API documentation
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

module.exports = app;
