"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/messages.ts - Messages routes with TypeScript
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("@/config/database"));
const authMiddleware_1 = require("@/middleware/authMiddleware");
const validation_1 = require("@/middleware/validation");
const security_1 = require("@/middleware/security");
const router = express_1.default.Router();
// GET /api/messages - Get user's messages/conversations
router.get('/', authMiddleware_1.authMiddleware, ...validation_1.queryValidation.pagination, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20 } = req.query;
        const pageNum = typeof page === 'string' ? parseInt(page) : page;
        const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
        const offset = (pageNum - 1) * limitNum;
        // Get conversations (grouped messages)
        const query = `
      WITH latest_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END
        )
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END as other_user_id,
        message_text as latest_message,
        timestamp as latest_message_date,
        sender_id,
        receiver_id
        FROM messages 
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY 
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END,
          timestamp DESC
      ),
      unread_counts AS (
        SELECT 
          sender_id as other_user_id,
          COUNT(*) as unread_count
        FROM messages 
        WHERE receiver_id = $1 AND read_status = false
        GROUP BY sender_id
      )
      SELECT 
        lm.other_user_id,
        u.username as other_user_username,
        lm.latest_message,
        lm.latest_message_date,
        COALESCE(uc.unread_count, 0) as unread_count
      FROM latest_messages lm
      JOIN users u ON lm.other_user_id = u.id
      LEFT JOIN unread_counts uc ON lm.other_user_id = uc.other_user_id
      ORDER BY lm.latest_message_date DESC
      LIMIT $2 OFFSET $3
    `;
        // Count total conversations
        const countQuery = `
      SELECT COUNT(DISTINCT 
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END
      ) as count
      FROM messages 
      WHERE sender_id = $1 OR receiver_id = $1
    `;
        const [result, countResult] = await Promise.all([
            database_1.default.query(query, [userId, limitNum, offset]),
            database_1.default.query(countQuery, [userId]),
        ]);
        const conversations = result.rows;
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limitNum);
        const response = {
            success: true,
            data: conversations,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch conversations',
        });
    }
});
// GET /api/messages/inbox - Get user's inbox (conversations list)
router.get('/inbox', authMiddleware_1.authMiddleware, ...validation_1.queryValidation.pagination, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20 } = req.query;
        const pageNum = typeof page === 'string' ? parseInt(page) : page;
        const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
        const offset = (pageNum - 1) * limitNum;
        // Get conversations (grouped messages)
        const query = `
      WITH latest_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END,
          listing_id
        )
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END as other_user_id,
        listing_id,
        message_text as latest_message,
        timestamp as latest_message_date,
        sender_id,
        receiver_id
        FROM messages 
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY 
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END,
          listing_id,
          timestamp DESC
      ),
      unread_counts AS (
        SELECT 
          sender_id as other_user_id,
          listing_id,
          COUNT(*) as unread_count
        FROM messages 
        WHERE receiver_id = $1 AND read_status = false
        GROUP BY sender_id, listing_id
      )
      SELECT 
        lm.other_user_id,
        lm.listing_id,
        u.username as other_user_username,
        pl.title,
        lm.latest_message,
        lm.latest_message_date,
        lm.sender_id,
        COALESCE(uc.unread_count, 0) as unread_count
      FROM latest_messages lm
      JOIN users u ON lm.other_user_id = u.id
      LEFT JOIN produce_listings pl ON lm.listing_id = pl.id
      LEFT JOIN unread_counts uc ON lm.other_user_id = uc.other_user_id AND lm.listing_id = uc.listing_id
      ORDER BY lm.latest_message_date DESC
      LIMIT $2 OFFSET $3
    `;
        // Count total conversations
        const countQuery = `
      SELECT COUNT(*) as count
      FROM (
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END as other_user_id,
          listing_id
        FROM messages 
        WHERE sender_id = $1 OR receiver_id = $1
      ) as unique_conversations
    `;
        const [result, countResult] = await Promise.all([
            database_1.default.query(query, [userId, limitNum, offset]),
            database_1.default.query(countQuery, [userId]),
        ]);
        const conversations = result.rows;
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limitNum);
        const response = {
            success: true,
            data: conversations,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching inbox:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inbox',
        });
    }
});
// GET /api/messages/unread/count - Get unread message count
router.get('/unread/count', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await database_1.default.query('SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND read_status = false', [userId]);
        const unreadCount = parseInt(result.rows[0].count);
        const response = {
            success: true,
            data: { count: unreadCount },
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get unread count',
        });
    }
});
// GET /api/messages/conversation/:listingId/:otherUserId - Get messages for a specific conversation (listing + users)
router.get('/conversation/:listingId/:otherUserId', authMiddleware_1.authMiddleware, ...validation_1.queryValidation.pagination, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const listingId = parseInt(req.params.listingId || '');
        const otherUserId = parseInt(req.params.otherUserId || '');
        const { page = 1, limit = 50 } = req.query;
        if (isNaN(listingId) || isNaN(otherUserId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid listing ID or user ID',
            });
            return;
        }
        const pageNum = typeof page === 'string' ? parseInt(page) : page;
        const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
        const offset = (pageNum - 1) * limitNum;
        // Get messages between users for this specific listing
        const query = `
      SELECT 
        m.*,
        s.username as sender_username,
        r.username as recipient_username,
        pl.title as listing_title
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      LEFT JOIN produce_listings pl ON m.listing_id = pl.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      AND (m.listing_id = $3 OR m.listing_id IS NULL)
      ORDER BY m.timestamp ASC
      LIMIT $4 OFFSET $5
    `;
        // Count total messages
        const countQuery = `
      SELECT COUNT(*) as count
      FROM messages 
      WHERE ((sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1))
      AND (listing_id = $3 OR listing_id IS NULL)
    `;
        const [result, countResult] = await Promise.all([
            database_1.default.query(query, [
                currentUserId,
                otherUserId,
                listingId,
                limitNum,
                offset,
            ]),
            database_1.default.query(countQuery, [currentUserId, otherUserId, listingId]),
        ]);
        const messages = result.rows;
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limitNum);
        // Mark messages as read
        await database_1.default.query('UPDATE messages SET read_status = true WHERE sender_id = $1 AND receiver_id = $2 AND read_status = false', [otherUserId, currentUserId]);
        const response = {
            success: true,
            data: messages,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch conversation',
        });
    }
});
// GET /api/messages/:userId - Get messages with a specific user
router.get('/:userId', authMiddleware_1.authMiddleware, ...validation_1.queryValidation.pagination, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const otherUserId = parseInt(req.params.userId || '');
        const { page = 1, limit = 50 } = req.query;
        if (isNaN(otherUserId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid user ID',
            });
            return;
        }
        const pageNum = typeof page === 'string' ? parseInt(page) : page;
        const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
        const offset = (pageNum - 1) * limitNum;
        // Get messages between users
        const query = `
      SELECT 
        m.*,
        s.username as sender_username,
        r.username as recipient_username,
        pl.title as listing_title
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      LEFT JOIN produce_listings pl ON m.listing_id = pl.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.timestamp DESC
      LIMIT $3 OFFSET $4
    `;
        // Count total messages
        const countQuery = `
      SELECT COUNT(*) as count
      FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
    `;
        const [result, countResult] = await Promise.all([
            database_1.default.query(query, [currentUserId, otherUserId, limitNum, offset]),
            database_1.default.query(countQuery, [currentUserId, otherUserId]),
        ]);
        const messages = result.rows;
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limitNum);
        // Mark messages as read
        await database_1.default.query('UPDATE messages SET read_status = true WHERE sender_id = $1 AND receiver_id = $2 AND read_status = false', [otherUserId, currentUserId]);
        const response = {
            success: true,
            data: messages,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages',
        });
    }
});
// POST /api/messages - Send a new message
router.post('/', authMiddleware_1.authMiddleware, security_1.messageLimiter, ...validation_1.messageValidation.send, async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiver_id, message_text, listing_id } = req.body;
        // Check if recipient exists
        const recipientCheck = await database_1.default.query('SELECT id FROM users WHERE id = $1', [receiver_id]);
        if (recipientCheck.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Recipient not found',
            });
            return;
        }
        // Check if listing exists (if provided)
        if (listing_id) {
            const listingCheck = await database_1.default.query('SELECT id FROM produce_listings WHERE id = $1', [listing_id]);
            if (listingCheck.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    error: 'Listing not found',
                });
                return;
            }
        }
        // Insert message
        const query = `
      INSERT INTO messages (sender_id, receiver_id, message_text, listing_id, read_status)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *
    `;
        const result = await database_1.default.query(query, [
            senderId,
            receiver_id,
            message_text,
            listing_id || null,
        ]);
        const message = result.rows[0];
        // Get message with user details
        const detailQuery = `
      SELECT 
        m.*,
        s.username as sender_username,
        r.username as recipient_username,
        pl.title as listing_title
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      LEFT JOIN produce_listings pl ON m.listing_id = pl.id
      WHERE m.id = $1
    `;
        const detailResult = await database_1.default.query(detailQuery, [message.id]);
        const messageWithDetails = detailResult.rows[0];
        // Emit Socket.IO event (if io is available)
        const io = req.app.get('io');
        if (io) {
            // Emit to recipient
            io.to(`user_${receiver_id}`).emit('newMessage', messageWithDetails);
            // Also emit to sender for real-time UI updates
            io.to(`user_${senderId}`).emit('newMessage', messageWithDetails);
        }
        const response = {
            success: true,
            data: messageWithDetails,
            message: 'Message sent successfully',
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message',
        });
    }
});
// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const messageId = parseInt(req.params.id || '');
        if (isNaN(messageId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid message ID',
            });
            return;
        }
        const result = await database_1.default.query('UPDATE messages SET read_status = true WHERE id = $1 AND receiver_id = $2 AND read_status = false RETURNING *', [messageId, userId]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Message not found or already read',
            });
            return;
        }
        const response = {
            success: true,
            message: 'Message marked as read',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark message as read',
        });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map