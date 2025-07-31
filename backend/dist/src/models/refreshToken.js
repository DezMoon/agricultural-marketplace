"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/refreshToken.ts - RefreshToken model with TypeScript
const database_1 = __importDefault(require("../config/database"));
class RefreshTokenModel {
    // Store a new refresh token
    static async store(userId, token, expiresAt) {
        const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at, created_at, is_revoked)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, false)
      RETURNING *
    `;
        const result = await database_1.default.query(query, [userId, token, expiresAt]);
        if (!result.rows[0]) {
            throw new Error('Failed to create refresh token');
        }
        return result.rows[0];
    }
    // Find a refresh token by token string
    static async findByToken(token) {
        const query = `
      SELECT rt.*, u.username, u.email 
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token = $1 AND rt.is_revoked = false AND rt.expires_at > CURRENT_TIMESTAMP
    `;
        const result = await database_1.default.query(query, [token]);
        return result.rows[0] || null;
    }
    // Mark a refresh token as used
    static async markAsUsed(token) {
        const query = `
      UPDATE refresh_tokens 
      SET used_at = CURRENT_TIMESTAMP 
      WHERE token = $1
    `;
        await database_1.default.query(query, [token]);
    }
    // Revoke a refresh token
    static async revoke(token) {
        const query = `
      UPDATE refresh_tokens 
      SET is_revoked = true 
      WHERE token = $1
    `;
        await database_1.default.query(query, [token]);
    }
    // Clean up expired tokens
    static async cleanupExpired() {
        const query = `
      DELETE FROM refresh_tokens 
      WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = true
    `;
        await database_1.default.query(query);
    }
    // Revoke all tokens for a user
    static async revokeAllForUser(userId) {
        const query = `
      UPDATE refresh_tokens 
      SET is_revoked = true 
      WHERE user_id = $1 AND is_revoked = false
    `;
        await database_1.default.query(query, [userId]);
    }
    // Get active tokens count for a user
    static async getActiveTokensCount(userId) {
        const query = `
      SELECT COUNT(*) as count
      FROM refresh_tokens 
      WHERE user_id = $1 AND is_revoked = false AND expires_at > CURRENT_TIMESTAMP
    `;
        const result = await database_1.default.query(query, [userId]);
        return parseInt(result.rows[0].count);
    }
}
exports.default = RefreshTokenModel;
//# sourceMappingURL=refreshToken.js.map