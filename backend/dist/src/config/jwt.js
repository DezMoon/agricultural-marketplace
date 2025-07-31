"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtService = void 0;
// src/config/jwt.ts - JWT service with TypeScript
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTService {
    constructor() {
        // Validate required environment variables
        const requiredEnvVars = [
            'JWT_ACCESS_SECRET',
            'JWT_REFRESH_SECRET'
        ];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }
        this.accessTokenSecret = process.env.JWT_ACCESS_SECRET;
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
        this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    }
    /**
     * Generate both access and refresh tokens
     */
    generateTokenPair(payload) {
        const accessToken = jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
            expiresIn: this.accessTokenExpiry
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, this.refreshTokenSecret, {
            expiresIn: this.refreshTokenExpiry
        });
        return { accessToken, refreshToken };
    }
    /**
     * Generate access token only
     */
    generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
            expiresIn: this.accessTokenExpiry
        });
    }
    /**
     * Generate refresh token only
     */
    generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.refreshTokenSecret, {
            expiresIn: this.refreshTokenExpiry
        });
    }
    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.accessTokenSecret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid or expired access token');
            }
            throw error;
        }
    }
    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.refreshTokenSecret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid or expired refresh token');
            }
            throw error;
        }
    }
    /**
     * Extract token from Authorization header
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch {
            return null;
        }
    }
}
// Export singleton instance
exports.jwtService = new JWTService();
exports.default = exports.jwtService;
//# sourceMappingURL=jwt.js.map