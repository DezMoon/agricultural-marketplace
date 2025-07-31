"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/produce.ts - Produce routes with TypeScript
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("@/config/database"));
const authMiddleware_1 = require("@/middleware/authMiddleware");
const validation_1 = require("@/middleware/validation");
const security_1 = require("@/middleware/security");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
// GET /api/produce/listings - Get all produce listings with optional filters
router.get('/listings', ...validation_1.queryValidation.pagination, ...validation_1.queryValidation.produceSearch, async (req, res) => {
    try {
        const { category, location, minPrice, maxPrice, status = 'available', search, page = 1, limit = 20 } = req.query;
        let query = `
      SELECT 
        pl.*,
        u.username as farmer_username,
        u.email as farmer_email
      FROM produce_listings pl
      JOIN users u ON pl.user_id = u.id
      WHERE TRUE
    `;
        const queryParams = [];
        let paramIndex = 1;
        // Add filters
        if (category) {
            query += ` AND pl.category = $${paramIndex}`;
            queryParams.push(category);
            paramIndex++;
        }
        if (location) {
            query += ` AND pl.location ILIKE $${paramIndex}`;
            queryParams.push(`%${location}%`);
            paramIndex++;
        }
        if (minPrice !== undefined) {
            query += ` AND pl.price_per_unit >= $${paramIndex}`;
            queryParams.push(minPrice);
            paramIndex++;
        }
        if (maxPrice !== undefined) {
            query += ` AND pl.price_per_unit <= $${paramIndex}`;
            queryParams.push(maxPrice);
            paramIndex++;
        }
        if (status) {
            query += ` AND pl.availability_status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }
        if (search) {
            query += ` AND (pl.title ILIKE $${paramIndex} OR pl.description ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }
        // Count total results
        const countQuery = query.replace(/SELECT[\s\S]*?FROM/i, 'SELECT COUNT(*) FROM');
        const countResult = await database_1.default.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0]?.count || '0');
        // Add pagination
        const offset = (page - 1) * limit;
        query += ` ORDER BY pl.listing_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);
        console.log('Executing Listings Query:', query, 'Values:', queryParams);
        const result = await database_1.default.query(query, queryParams);
        const listings = result.rows;
        const totalPages = Math.ceil(total / limit);
        const response = {
            success: true,
            data: listings,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch listings'
        });
    }
});
// GET /api/produce/listings/:id - Get a specific listing
router.get('/listings/:id', async (req, res) => {
    try {
        const listingId = parseInt(req.params.id || '');
        if (isNaN(listingId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid listing ID'
            });
            return;
        }
        const query = `
      SELECT 
        pl.*,
        u.username as farmer_username,
        u.email as farmer_email
      FROM produce_listings pl
      JOIN users u ON pl.user_id = u.id
      WHERE pl.id = $1
    `;
        const result = await database_1.default.query(query, [listingId]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Listing not found'
            });
            return;
        }
        const listing = result.rows[0];
        const response = {
            success: true,
            data: listing
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch listing'
        });
    }
});
// GET /api/produce/my-listings - Get current user's listings
router.get('/my-listings', authMiddleware_1.authMiddleware, ...validation_1.queryValidation.pagination, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20 } = req.query;
        const pageNum = typeof page === 'string' ? parseInt(page) : page;
        const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
        const offset = (pageNum - 1) * limitNum;
        // Count total user listings
        const countResult = await database_1.default.query('SELECT COUNT(*) FROM produce_listings WHERE user_id = $1', [userId]);
        const total = parseInt(countResult.rows[0].count);
        // Get user listings
        const query = `
      SELECT * FROM produce_listings 
      WHERE user_id = $1 
      ORDER BY listing_date DESC 
      LIMIT $2 OFFSET $3
    `;
        const result = await database_1.default.query(query, [userId, limitNum, offset]);
        const listings = result.rows;
        const totalPages = Math.ceil(total / limitNum);
        const response = {
            success: true,
            data: listings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching user listings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch your listings'
        });
    }
});
// POST /api/produce/listings - Create a new listing
router.post('/listings', authMiddleware_1.authMiddleware, security_1.listingLimiter, security_1.uploadLimiter, upload.single('image'), ...validation_1.produceValidation.create, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { title, description, category, quantity, unit, price_per_unit, location, harvest_date } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        const query = `
        INSERT INTO produce_listings (
          user_id, title, description, category, quantity, unit, 
          price_per_unit, location, harvest_date, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
        const values = [
            userId, title, description, category, quantity, unit,
            price_per_unit, location, harvest_date, image_url
        ];
        const result = await database_1.default.query(query, values);
        const newListing = result.rows[0];
        const response = {
            success: true,
            data: newListing,
            message: 'Listing created successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create listing'
        });
    }
});
// PUT /api/produce/listings/:id - Update a listing
router.put('/listings/:id', authMiddleware_1.authMiddleware, security_1.listingLimiter, upload.single('image'), ...validation_1.produceValidation.update, async (req, res) => {
    try {
        const userId = req.user.userId;
        const listingId = parseInt(req.params.id || '');
        if (isNaN(listingId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid listing ID'
            });
            return;
        }
        // Check if listing exists and belongs to user
        const existingListing = await database_1.default.query('SELECT * FROM produce_listings WHERE id = $1 AND user_id = $2', [listingId, userId]);
        if (existingListing.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Listing not found or you do not have permission to edit it'
            });
            return;
        }
        const updateData = req.body;
        // Handle image upload
        if (req.file) {
            updateData.image_url = `/uploads/${req.file.filename}`;
        }
        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined && key !== 'image_url') {
                updateFields.push(`${key} = $${paramIndex}`);
                updateValues.push(value);
                paramIndex++;
            }
        });
        if (updateData.image_url) {
            updateFields.push(`image_url = $${paramIndex}`);
            updateValues.push(updateData.image_url);
            paramIndex++;
        }
        if (updateFields.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
            return;
        }
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(listingId);
        const query = `
        UPDATE produce_listings 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
        const result = await database_1.default.query(query, updateValues);
        const updatedListing = result.rows[0];
        const response = {
            success: true,
            data: updatedListing,
            message: 'Listing updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update listing'
        });
    }
});
// DELETE /api/produce/listings/:id - Delete a listing
router.delete('/listings/:id', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const listingId = parseInt(req.params.id || '');
        if (isNaN(listingId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid listing ID'
            });
            return;
        }
        const result = await database_1.default.query('DELETE FROM produce_listings WHERE id = $1 AND user_id = $2 RETURNING *', [listingId, userId]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Listing not found or you do not have permission to delete it'
            });
            return;
        }
        const response = {
            success: true,
            message: 'Listing deleted successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete listing'
        });
    }
});
exports.default = router;
//# sourceMappingURL=produce.js.map