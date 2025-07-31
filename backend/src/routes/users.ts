// src/routes/users.ts - User routes with TypeScript
import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '@/config/database';
import { jwtService } from '@/config/jwt';
import { authMiddleware, AuthRequest } from '@/middleware/authMiddleware';
import { userValidation } from '@/middleware/validation';
import { authLimiter, generalLimiter } from '@/middleware/security';
import { 
  User, 
  UserRegistrationData, 
  UserLoginData, 
  LoginResponse, 
  RegisterResponse 
} from '@/types/auth';
import RefreshTokenModel from '@/models/refreshToken';

const router: Router = express.Router();

// Middleware to parse JSON request bodies
router.use(express.json());

// POST /api/users/register - Register a new user
router.post('/register', generalLimiter, ...userValidation.register, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password }: UserRegistrationData = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'User with this username or email already exists' });
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );

    const newUser = result.rows[0];

    const response: RegisterResponse = {
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/users/login - Login a user
router.post('/login', authLimiter, ...userValidation.login, async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password }: UserLoginData = req.body;

    // Check if identifier is email or username by checking if it contains '@'
    const isEmail = identifier.includes('@');
    const query = isEmail 
      ? 'SELECT * FROM users WHERE email = $1'
      : 'SELECT * FROM users WHERE username = $1';

    // Find the user by email or username
    const userResult = await pool.query(query, [identifier]);

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user: User = userResult.rows[0];

    // Check the password
    const validPassword = await bcrypt.compare(password, user.password_hash);
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

    const { accessToken, refreshToken } = jwtService.generateTokenPair(payload);

    // Try to store refresh token, but don't fail if table doesn't exist yet
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await RefreshTokenModel.store(user.id, refreshToken, expiresAt);
    } catch (error) {
      console.warn('⚠️  Refresh token storage failed - table may not exist yet:', error instanceof Error ? error.message : error);
      // Continue without refresh token for now
    }

    const response: LoginResponse = {
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
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/users/refresh - Refresh access token
router.post('/refresh', authLimiter, async (req: Request, res: Response): Promise<void> => {
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
      decoded = jwtService.verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({ 
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
      return;
    }

    // Check if token exists in database and is valid
    const tokenRecord = await RefreshTokenModel.findByToken(refreshToken);
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
    await RefreshTokenModel.markAsUsed(refreshToken);

    // Generate new token pair
    const payload = {
      userId: tokenRecord.user_id,
      username: tokenRecord.username,
      email: tokenRecord.email,
    };

    const { accessToken, refreshToken: newRefreshToken } = jwtService.generateTokenPair(payload);

    // Store new refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshTokenModel.store(tokenRecord.user_id, newRefreshToken, expiresAt);

    const response: LoginResponse = {
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
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// POST /api/users/logout - Logout user (revoke refresh token)
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Logout request body:', req.body);
    console.log('Request content-type:', req.get('Content-Type'));
    
    const refreshToken = req.body?.refreshToken;
    const userId = req.user!.userId;

    if (refreshToken) {
      // Mark specific refresh token as used
      await RefreshTokenModel.markAsUsed(refreshToken);
      console.log('Marked refresh token as used');
    } else {
      console.log('No refresh token provided');
    }

    // Optionally revoke all tokens for the user (for "logout from all devices")
    if (req.body?.logoutAll) {
      await RefreshTokenModel.revokeAllForUser(userId);
      console.log('Revoked all tokens for user');
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// GET /api/users/me - Get current user info
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    
    const userQuery = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userQuery.rows[0];
    const activeTokensCount = await RefreshTokenModel.getActiveTokensCount(userId);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        activeTokens: activeTokensCount
      }
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
