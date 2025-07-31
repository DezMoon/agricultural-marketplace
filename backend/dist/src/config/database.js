"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
// src/config/database.ts - Database configuration with TypeScript
const pg_1 = require("pg");
// Load environment variables with validation
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }, // Always use SSL for RDS connections
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
    connectionTimeoutMillis: 30000, // Return an error after 30 seconds if connection could not be established
};
// Create and export the pool
exports.pool = new pg_1.Pool(dbConfig);
// Test database connection
exports.pool.on('connect', () => {
    console.log('🔗 Connected to PostgreSQL database');
});
exports.pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
    process.exit(-1);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔄 Closing database pool...');
    await exports.pool.end();
    console.log('✅ Database pool closed');
    process.exit(0);
});
exports.default = exports.pool;
//# sourceMappingURL=database.js.map