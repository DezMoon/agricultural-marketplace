// src/models/refreshToken.ts - RefreshToken model with TypeScript
import pool from '../config/database';
import { QueryResult } from 'pg';

interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  used_at?: Date;
  is_revoked: boolean;
  // User data when joined
  username?: string;
  email?: string;
}

interface CreateRefreshTokenData {
  user_id: number;
  token: string;
  expires_at: Date;
}

class RefreshTokenModel {
  // Store a new refresh token
  static async store(userId: number, token: string, expiresAt: Date): Promise<RefreshToken> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at, created_at, is_revoked)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, false)
      RETURNING *
    `;
    
    const result: QueryResult<RefreshToken> = await pool.query(query, [userId, token, expiresAt]);
    if (!result.rows[0]) {
      throw new Error('Failed to create refresh token');
    }
    return result.rows[0];
  }

  // Find a refresh token by token string
  static async findByToken(token: string): Promise<RefreshToken | null> {
    const query = `
      SELECT rt.*, u.username, u.email 
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token = $1 AND rt.is_revoked = false AND rt.expires_at > CURRENT_TIMESTAMP
    `;
    
    const result: QueryResult<RefreshToken> = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  // Mark a refresh token as used
  static async markAsUsed(token: string): Promise<void> {
    const query = `
      UPDATE refresh_tokens 
      SET used_at = CURRENT_TIMESTAMP 
      WHERE token = $1
    `;
    
    await pool.query(query, [token]);
  }

  // Revoke a refresh token
  static async revoke(token: string): Promise<void> {
    const query = `
      UPDATE refresh_tokens 
      SET is_revoked = true 
      WHERE token = $1
    `;
    
    await pool.query(query, [token]);
  }

  // Clean up expired tokens
  static async cleanupExpired(): Promise<void> {
    const query = `
      DELETE FROM refresh_tokens 
      WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = true
    `;
    
    await pool.query(query);
  }

  // Revoke all tokens for a user
  static async revokeAllForUser(userId: number): Promise<void> {
    const query = `
      UPDATE refresh_tokens 
      SET is_revoked = true 
      WHERE user_id = $1 AND is_revoked = false
    `;
    
    await pool.query(query, [userId]);
  }

  // Get active tokens count for a user
  static async getActiveTokensCount(userId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM refresh_tokens 
      WHERE user_id = $1 AND is_revoked = false AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

export default RefreshTokenModel;
export { RefreshToken, CreateRefreshTokenData };
