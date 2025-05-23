// backend/routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware to parse JSON request bodies
router.use(express.json());

// POST /api/users/register - Register a new user
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username or email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1', // Try matching both
      [username]
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

    // Create and assign a token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username, // Include username
        email: user.email, // Include email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Logged in successfully', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

module.exports = router;
