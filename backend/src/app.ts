// src/app.ts - Main application file with TypeScript
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

// Import middleware
import { securityHeaders, generalLimiter, corsOptions } from '@/middleware/security';

// Import routes
import usersRoutes from '@/routes/users';
import produceRoutes from '@/routes/produce';
import messagesRoutes from '@/routes/messages';

// Create Express application
const app: Application = express();

// Apply security middleware
app.use(securityHeaders);
app.use(generalLimiter);
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3001');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    typescript: true
  });
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
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
app.use('/api/users', usersRoutes);
app.use('/api/produce', produceRoutes);
app.use('/api/messages', messagesRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
