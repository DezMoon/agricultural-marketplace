"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/users.ts - User routes with TypeScript
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("@/config/database"));
const jwt_1 = require("@/config/jwt");
const authMiddleware_1 = require("@/middleware/authMiddleware");
const validation_1 = require("@/middleware/validation");
const security_1 = require("@/middleware/security");
const refreshToken_1 = __importDefault(require("@/models/refreshToken"));
const router = express_1.default.Router();
// Middleware to parse JSON request bodies
router.use(express_1.default.json());
// POST /api/users/register - Register a new user
router.post('/register', security_1.generalLimiter, ...validation_1.userValidation.register, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Check if user already exists
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existingUser.rows.length > 0) {
            res.status(400).json({ error: 'User with this username or email already exists' });
            return;
        }
        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Insert the new user
        const result = await database_1.default.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at', [username, email, hashedPassword]);
        const newUser = result.rows[0];
        const response = {
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
// POST /api/users/login - Login a user
router.post('/login', security_1.authLimiter, ...validation_1.userValidation.login, async (req, res) => {
    try {
        const { identifier, password } = req.body;
        // Check if identifier is email or username by checking if it contains '@'
        const isEmail = identifier.includes('@');
        const query = isEmail
            ? 'SELECT * FROM users WHERE email = $1'
            : 'SELECT * FROM users WHERE username = $1';
        // Find the user by email or username
        const userResult = await database_1.default.query(query, [identifier]);
        if (userResult.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const user = userResult.rows[0];
        // Check the password
        const validPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Generate token pair
        const payload = {
            userId: user.id,
            username: user.username,
            email: user.email,
        };
        const { accessToken, refreshToken } = jwt_1.jwtService.generateTokenPair(payload);
        // Try to store refresh token, but don't fail if table doesn't exist yet
        try {
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            await refreshToken_1.default.store(user.id, refreshToken, expiresAt);
        }
        catch (error) {
            console.warn('⚠️  Refresh token storage failed - table may not exist yet:', error instanceof Error ? error.message : error);
            // Continue without refresh token for now
        }
        const response = {
            accessToken,
            refreshToken: refreshToken || '', // Provide refresh token if available
            expiresIn: '15m',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});
// POST /api/users/refresh - Refresh access token
router.post('/refresh', security_1.authLimiter, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({
                error: 'Refresh token required',
                code: 'NO_REFRESH_TOKEN'
            });
            return;
        }
        // Verify refresh token
        let decoded;
        try {
            decoded = jwt_1.jwtService.verifyRefreshToken(refreshToken);
        }
        catch (error) {
            res.status(401).json({
                error: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
            return;
        }
        // Check if token exists in database and is valid
        const tokenRecord = await refreshToken_1.default.findByToken(refreshToken);
        if (!tokenRecord) {
            res.status(401).json({
                error: 'Refresh token not found or expired',
                code: 'REFRESH_TOKEN_NOT_FOUND'
            });
            return;
        }
        // Check if we have user data from the JOIN
        if (!tokenRecord.username || !tokenRecord.email) {
            res.status(500).json({ error: 'Invalid token data' });
            return;
        }
        // Mark old refresh token as used
        await refreshToken_1.default.markAsUsed(refreshToken);
        // Generate new token pair
        const payload = {
            userId: tokenRecord.user_id,
            username: tokenRecord.username,
            email: tokenRecord.email,
        };
        const { accessToken, refreshToken: newRefreshToken } = jwt_1.jwtService.generateTokenPair(payload);
        // Store new refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await refreshToken_1.default.store(tokenRecord.user_id, newRefreshToken, expiresAt);
        const response = {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: '15m',
            user: {
                id: tokenRecord.user_id,
                username: tokenRecord.username,
                email: tokenRecord.email
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});
// POST /api/users/logout - Logout user (revoke refresh token)
router.post('/logout', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        console.log('Logout request body:', req.body);
        console.log('Request content-type:', req.get('Content-Type'));
        const refreshToken = req.body?.refreshToken;
        const userId = req.user.userId;
        if (refreshToken) {
            // Mark specific refresh token as used
            await refreshToken_1.default.markAsUsed(refreshToken);
            console.log('Marked refresh token as used');
        }
        else {
            console.log('No refresh token provided');
        }
        // Optionally revoke all tokens for the user (for "logout from all devices")
        if (req.body?.logoutAll) {
            await refreshToken_1.default.revokeAllForUser(userId);
            console.log('Revoked all tokens for user');
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});
// GET /api/users/me - Get current user info
router.get('/me', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userQuery = await database_1.default.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [userId]);
        if (userQuery.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const user = userQuery.rows[0];
        const activeTokensCount = await refreshToken_1.default.getActiveTokensCount(userId);
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at,
                activeTokens: activeTokensCount
            }
        });
    }
    catch (error) {
        console.error('Error getting user info:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map