// backend/routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwtService = require('../config/jwt');
const { authMiddleware } = require('../middleware/authMiddleware');
const { userValidation } = require('../middleware/validation');
const { authLimiter, generalLimiter } = require('../middleware/security');
const RefreshTokenModel = require('../models/refreshToken');

// Middleware to parse JSON request bodies
router.use(express.json());

// POST /api/users/register - Register a new user
router.post('/register', generalLimiter, userValidation.register, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'Username or email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create the new user
    // Make sure 'username' and 'email' columns exist in your 'users' table
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password_hash]
    );

    res
      .status(201)
      .json({ message: 'User registered successfully', user: newUser.rows[0] });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/users/login - Login a user
router.post('/login', authLimiter, userValidation.login, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0]; // Get the found user

    // Check the password
    const validPassword = await bcrypt.compare(
      password,
      user.password_hash // Use user.password_hash
    );
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token pair
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };

    const { accessToken, refreshToken } = jwtService.generateTokenPair(payload);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshTokenModel.store(user.id, refreshToken, expiresAt);

    res.json({ 
      message: 'Logged in successfully', 
      accessToken,
      refreshToken,
      expiresIn: '15m', // Access token expiry
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/users/refresh - Refresh access token
router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwtService.verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if token exists in database and is valid
    const tokenRecord = await RefreshTokenModel.findByToken(refreshToken);
    if (!tokenRecord) {
      return res.status(401).json({ 
        error: 'Refresh token not found or expired',
        code: 'REFRESH_TOKEN_NOT_FOUND'
      });
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

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: '15m',
      user: {
        id: tokenRecord.user_id,
        username: tokenRecord.username,
        email: tokenRecord.email
      }
    });

  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// POST /api/users/logout - Logout user (revoke refresh token)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    console.log('Logout request body:', req.body);
    console.log('Request content-type:', req.get('Content-Type'));
    
    const refreshToken = req.body?.refreshToken;
    const userId = req.user.userId;

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
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const userQuery = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
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

module.exports = router;
