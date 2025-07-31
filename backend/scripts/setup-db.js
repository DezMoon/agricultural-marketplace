// Database connection test and setup script
require('dotenv').config({ path: '../.env' });
const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to AWS RDS database!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database query successful. Current time:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    console.log('✅ Database schema setup successful!');
    
  } catch (error) {
    console.error('❌ Database schema setup failed:', error.message);
    
    // If tables already exist, that's okay
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist, skipping schema setup');
    }
  }
}

async function main() {
  const isConnected = await testConnection();
  
  if (isConnected) {
    await setupDatabase();
  }
  
  process.exit(0);
}

main();
