const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware to parse JSON request bodies
router.use(express.json());

// POST endpoint to create a new produce listing
router.post('/listings', async (req, res) => {
  try {
    const {
      farmer_name,
      produce_type,
      quantity,
      unit,
      price_per_unit,
      location,
      description,
    } = req.body;
    const newListing = await pool.query(
      'INSERT INTO produce_listings (farmer_name, produce_type, quantity, unit, price_per_unit, location, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        farmer_name,
        produce_type,
        quantity,
        unit,
        price_per_unit,
        location,
        description,
      ]
    );
    const createdListing = newListing.rows[0];
    res.status(201).json(createdListing);

    // Emit the Socket.IO event using the io object from the request
    req.io.emit('newListing', createdListing);
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// GET endpoint to retrieve all produce listings (with filtering, searching, and pagination)
router.get('/listings', async (req, res) => {
  try {
    const { produce_type, location, search, page, pageSize } = req.query;
    let query = 'SELECT * FROM produce_listings WHERE TRUE';
    const values = [];
    let valueIndex = 1;

    if (produce_type) {
      query += ` AND produce_type ILIKE $${valueIndex++}`;
      values.push(`%${produce_type}%`);
    }

    if (location) {
      query += ` AND location ILIKE $${valueIndex++}`;
      values.push(`%${location}%`);
    }

    if (search) {
      query += ` AND (produce_type ILIKE $${valueIndex} OR location ILIKE $${valueIndex} OR description ILIKE $${valueIndex})`;
      values.push(`%${search}%`);
    }

    let offset = 0;
    if (page && pageSize) {
      const parsedPage = parseInt(page, 10);
      const parsedPageSize = parseInt(pageSize, 10);
      if (
        !isNaN(parsedPage) &&
        !isNaN(parsedPageSize) &&
        parsedPage > 0 &&
        parsedPageSize > 0
      ) {
        offset = (parsedPage - 1) * parsedPageSize;
        query += ` LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
        values.push(parsedPageSize, offset);
      }
    }

    const allListings = await pool.query(query, values);
    res.json(allListings.rows);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

module.exports = router;
