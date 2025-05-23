const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

router.use(express.json());

// POST endpoint to create a new produce listing (PROTECTED)
router.post('/listings', authMiddleware, async (req, res) => {
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

    const newListing = await pool.query(
      'INSERT INTO produce_listings (farmer_name, produce_type, quantity, unit, price_per_unit, location, description, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        farmer_name,
        produce_type,
        quantity,
        unit,
        price_per_unit,
        location,
        description,
        user_id,
      ]
    );
    const createdListing = newListing.rows[0];
    res.status(201).json(createdListing);

    req.io.emit('newListing', createdListing);
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

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

module.exports = router;
