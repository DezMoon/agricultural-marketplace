// backend/routes/produce.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/authMiddleware'); // Import the middleware
const { produceValidation, queryValidation } = require('../middleware/validation');
const { listingLimiter, uploadLimiter } = require('../middleware/security');
const multer = require('multer');
const path = require('path');

// Middleware to parse JSON request bodies
router.use(express.json());

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    // Use Date.now() for unique file names
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// POST endpoint to create a new produce listing (PROTECTED, with image upload)
router.post(
  '/listings',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
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
      const user_id = req.user.userId;

      // If an image was uploaded, set image_url to its path
      let image_url = null;
      if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
      }

      const newListing = await pool.query(
        'INSERT INTO produce_listings (farmer_name, produce_type, quantity, unit, price_per_unit, location, description, image_url, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          farmer_name,
          produce_type,
          quantity,
          unit,
          price_per_unit,
          location,
          description,
          image_url,
          user_id,
        ]
      );
      const createdListing = newListing.rows[0];
      res.status(201).json(createdListing);
    } catch (error) {
      console.error('Error creating listing:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  }
);

// GET endpoint to retrieve all produce listings (with filtering, searching, pagination, and sorting)
router.get('/listings', async (req, res) => {
  try {
    const {
      produce_type,
      location,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = req.query;

    let queryConditions = 'WHERE TRUE';
    const queryValues = [];
    let valueIndex = 1;

    if (produce_type) {
      queryConditions += ` AND produce_type ILIKE $${valueIndex++}`;
      queryValues.push(`%${produce_type}%`);
    }

    if (location) {
      queryConditions += ` AND location ILIKE $${valueIndex++}`;
      queryValues.push(`%${location}%`);
    }

    if (search) {
      queryConditions += ` AND (produce_type ILIKE $${valueIndex} OR location ILIKE $${valueIndex} OR description ILIKE $${valueIndex})`;
      queryValues.push(`%${search}%`);
    }

    // --- Get total count first ---
    const countQuery = `SELECT COUNT(*) FROM produce_listings ${queryConditions}`;
    const totalCountResult = await pool.query(countQuery, queryValues);
    const totalListings = parseInt(totalCountResult.rows[0].count, 10);

    // --- Get paginated listings ---
    let listingsQuery = `SELECT * FROM produce_listings ${queryConditions}`;

    // Add sorting
    if (sortBy) {
      const allowedSortColumns = [
        'farmer_name',
        'produce_type',
        'quantity',
        'price_per_unit',
        'location',
        'listing_date',
      ];
      if (allowedSortColumns.includes(sortBy)) {
        const sortDirection =
          sortOrder && sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        listingsQuery += ` ORDER BY "${sortBy}" ${sortDirection}`;
      }
    } else {
      listingsQuery += ` ORDER BY listing_date DESC`; // Default sort
    }

    // Add pagination
    let limitClause = '';
    let offsetClause = '';
    const parsedPage = parseInt(page, 10);
    const parsedPageSize = parseInt(pageSize, 10);

    if (
      !isNaN(parsedPage) &&
      !isNaN(parsedPageSize) &&
      parsedPage > 0 &&
      parsedPageSize > 0
    ) {
      limitClause = ` LIMIT $${valueIndex++}`;
      offsetClause = ` OFFSET $${valueIndex++}`;
      queryValues.push(parsedPageSize, (parsedPage - 1) * parsedPageSize);
    }

    listingsQuery += limitClause + offsetClause;

    console.log(
      'Executing Listings Query:',
      listingsQuery,
      'Values:',
      queryValues
    );

    const allListings = await pool.query(listingsQuery, queryValues);

    // Send both listings and total count
    res.json({
      listings: allListings.rows,
      total_count: totalListings,
      page: parsedPage,
      pageSize: parsedPageSize,
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// NEW: GET endpoint to retrieve produce listings for the authenticated user (PROTECTED)
router.get('/my-listings', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.userId; // Get user ID from authenticated token
    const mylistings = await pool.query(
      'SELECT * FROM produce_listings WHERE user_id = $1 ORDER BY listing_date DESC',
      [user_id]
    );
    res.json(mylistings.rows);
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ error: 'Failed to fetch user listings' });
  }
});

// NEW: PUT endpoint to update a specific produce listing (PROTECTED, with ownership check)
router.put('/listings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // Listing ID from URL parameter
    const user_id = req.user.userId; // User ID from authenticated token
    const {
      farmer_name,
      produce_type,
      quantity,
      unit,
      price_per_unit,
      location,
      description,
    } = req.body;

    // First, check if the listing belongs to the authenticated user
    const existingListing = await pool.query(
      'SELECT user_id FROM produce_listings WHERE id = $1',
      [id]
    );

    if (existingListing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (existingListing.rows[0].user_id !== user_id) {
      return res
        .status(403)
        .json({ error: 'You are not authorized to update this listing' });
    }

    // Update the listing
    const updatedListing = await pool.query(
      'UPDATE produce_listings SET farmer_name = $1, produce_type = $2, quantity = $3, unit = $4, price_per_unit = $5, location = $6, description = $7 WHERE id = $8 RETURNING *',
      [
        farmer_name,
        produce_type,
        quantity,
        unit,
        price_per_unit,
        location,
        description,
        id,
      ]
    );

    if (updatedListing.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Listing not found after update attempt' });
    }

    res.json(updatedListing.rows[0]);
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// NEW: DELETE endpoint to delete a specific produce listing (PROTECTED, with ownership check)
router.delete('/listings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // Listing ID from URL parameter
    const user_id = req.user.userId; // User ID from authenticated token

    // First, check if the listing belongs to the authenticated user
    const existingListing = await pool.query(
      'SELECT user_id FROM produce_listings WHERE id = $1',
      [id]
    );

    if (existingListing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (existingListing.rows[0].user_id !== user_id) {
      return res
        .status(403)
        .json({ error: 'You are not authorized to delete this listing' });
    }

    // Delete messages referencing this listing
    await pool.query('DELETE FROM messages WHERE listing_id = $1', [id]);

    // Now delete the listing
    const deletedListing = await pool.query(
      'DELETE FROM produce_listings WHERE id = $1 RETURNING id',
      [id]
    );

    if (deletedListing.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Listing not found after delete attempt' });
    }

    res.json({
      message: 'Listing deleted successfully',
      id: deletedListing.rows[0].id,
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// GET a single produce listing by ID
router.get('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM produce_listings WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

module.exports = router;
