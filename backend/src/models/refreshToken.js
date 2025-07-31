// src/models/refreshToken.js - Refresh token database operations
const pool = require('../config/database');

class RefreshTokenModel {
  // Create refresh tokens table if it doesn't exist
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP NULL,
        revoked_at TIMESTAMP NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
    `;
    
    await pool.query(query);
  }

  // Store refresh token
  static async store(userId, token, expiresAt) {
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, created_at
    `;
    
    const result = await pool.query(query, [userId, token, expiresAt]);
    return result.rows[0];
  }

  // Find refresh token
  static async findByToken(token) {
    const query = `
      SELECT rt.*, u.id as user_id, u.username, u.email
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token = $1 
        AND rt.expires_at > NOW()
        AND rt.used_at IS NULL
        AND rt.revoked_at IS NULL
    `;
    
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  // Mark token as used
  static async markAsUsed(token) {
    const query = `
      UPDATE refresh_tokens 
      SET used_at = NOW()
      WHERE token = $1
    `;
    
    await pool.query(query, [token]);
  }

  // Revoke all tokens for a user
  static async revokeAllForUser(userId) {
    const query = `
      UPDATE refresh_tokens 
      SET revoked_at = NOW()
      WHERE user_id = $1 AND revoked_at IS NULL
    `;
    
    await pool.query(query, [userId]);
  }

  // Clean up expired tokens
  static async cleanupExpired() {
    const query = `
      DELETE FROM refresh_tokens 
      WHERE expires_at < NOW() OR used_at IS NOT NULL
    `;
    
    const result = await pool.query(query);
    return result.rowCount;
  }

  // Get user's active tokens count
  static async getActiveTokensCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM refresh_tokens 
      WHERE user_id = $1 
        AND expires_at > NOW()
        AND used_at IS NULL
        AND revoked_at IS NULL
    `;
    
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = RefreshTokenModel;
