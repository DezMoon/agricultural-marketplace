// scripts/setup-refresh-tokens.js - Initialize refresh tokens table
const RefreshTokenModel = require('../src/models/refreshToken');

async function setupRefreshTokens() {
  console.log('Setting up refresh tokens table...');
  
  try {
    await RefreshTokenModel.createTable();
    console.log('✅ Refresh tokens table created successfully');
    
    // Clean up any existing expired tokens
    const cleanedCount = await RefreshTokenModel.cleanupExpired();
    console.log(`✅ Cleaned up ${cleanedCount} expired tokens`);
    
    console.log('🎉 Refresh tokens setup complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error setting up refresh tokens:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupRefreshTokens();
}

module.exports = setupRefreshTokens;
