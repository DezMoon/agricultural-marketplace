// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/authMiddleware'); // For protecting message routes
const { messageValidation } = require('../middleware/validation');
const { messageLimiter } = require('../middleware/security');

// Middleware to parse JSON request bodies
router.use(express.json());

// POST /api/messages - Send a new message (PROTECTED)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiver_id, listing_id, message_text } = req.body;
    const sender_id = req.user.userId; // Sender is the authenticated user

    // Basic validation
    if (!receiver_id || !message_text || !listing_id) {
      return res.status(400).json({
        error: 'Receiver ID, Listing ID, and message text are required.',
      });
    }

    // --- Validation for the message sender/receiver relation to the listing owner ---
    const listingCheck = await pool.query(
      'SELECT user_id, produce_type FROM produce_listings WHERE id = $1',
      [listing_id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Associated listing not found.' });
    }

    const listingOwnerId = listingCheck.rows[0].user_id;
    const produceType = listingCheck.rows[0].produce_type; // Get produce type for Socket.IO emission

    // Prevent a user from messaging themselves via this endpoint (should be handled by frontend too)
    if (sender_id === receiver_id) {
      return res.status(400).json({
        error:
          'You cannot send a message to yourself directly using this feature.',
      });
    }

    // Ensure that the conversation involves the listing owner.
    // Either the sender is the owner and receiver is a buyer, OR
    // the receiver is the owner and sender is a buyer.
    const isSenderOwner = sender_id === listingOwnerId;
    const isReceiverOwner = receiver_id === listingOwnerId;

    if (!(isSenderOwner || isReceiverOwner)) {
      // This case handles attempts to message someone where neither party is the listing owner,
      // which might be an unintended conversation for this specific message flow.
      return res
        .status(403)
        .json({ error: 'Conversation must involve the listing owner.' });
    }

    // --- End of validation ---

    const newMessage = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, listing_id, message_text) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_id, receiver_id, listing_id, message_text]
    );

    const createdMessage = newMessage.rows[0];

    // Get sender/receiver usernames for the emitted message (for frontend display)
    const senderUser = await pool.query(
      'SELECT username, email FROM users WHERE id = $1',
      [sender_id]
    );
    const receiverUser = await pool.query(
      'SELECT username, email FROM users WHERE id = $1',
      [receiver_id]
    );

    const messageWithUsernames = {
      ...createdMessage,
      sender_username:
        senderUser.rows[0]?.username || senderUser.rows[0]?.email,
      receiver_username:
        receiverUser.rows[0]?.username || receiverUser.rows[0]?.email,
      produce_type: produceType, // Add produce type for context
    };

    res.status(201).json(messageWithUsernames); // Send back enriched message to the sender

    // Emit the new message ONLY to the receiver's Socket.IO room.
    // The sender's client already added the message optimistically and received HTTP confirmation.
    req.io.to(`user-${receiver_id}`).emit('newMessage', messageWithUsernames);

    // We are intentionally removing the emission to the sender's room (i.e., user-${sender_id})
    // because the sender's UI already optimistically updated and received the HTTP response.
    // Sending it again via Socket.IO causes the duplicate display.
    // If you need multi-device sync for the sender's own messages, you'll need more complex
    // deduplication logic on the frontend (e.g., using a client-generated temp ID and then
    // updating it with the real DB ID received via HTTP response, and then ignoring Socket.IO
    // messages with matching real DB IDs). For this specific issue, this is the direct fix.
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messages/conversation/:listing_id/:other_user_id - Get conversation for a specific listing between two users (PROTECTED)
router.get(
  '/conversation/:listing_id/:other_user_id',
  authMiddleware,
  async (req, res) => {
    try {
      const { listing_id, other_user_id } = req.params;
      const current_user_id = req.user.userId; // Authenticated user

      // Basic validation for parameters
      if (isNaN(listing_id) || isNaN(other_user_id)) {
        return res
          .status(400)
          .json({ error: 'Invalid listing ID or other user ID.' });
      }

      const messages = await pool.query(
        `SELECT
                    m.id,
                    m.sender_id,
                    s.username AS sender_username,
                    s.email AS sender_email,
                    m.receiver_id,
                    r.username AS receiver_username,
                    r.email AS receiver_email,
                    m.listing_id,
                    pl.produce_type, -- Join to get produce type for context
                    m.message_text,
                    m.timestamp,
                    m.read_status
                FROM messages m
                JOIN users s ON m.sender_id = s.id
                JOIN users r ON m.receiver_id = r.id
                JOIN produce_listings pl ON m.listing_id = pl.id
                WHERE m.listing_id = $1
                AND (
                    (m.sender_id = $2 AND m.receiver_id = $3) OR
                    (m.sender_id = $3 AND m.receiver_id = $2)
                )
                ORDER BY m.timestamp ASC`,
        [listing_id, current_user_id, other_user_id]
      );

      // Optional: Mark messages sent *to* the current user in this conversation as read
      await pool.query(
        'UPDATE messages SET read_status = TRUE WHERE listing_id = $1 AND receiver_id = $2 AND sender_id = $3 AND read_status = FALSE',
        [listing_id, current_user_id, other_user_id]
      );

      res.json(messages.rows);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  }
);

// GET /api/messages/inbox - Get all unique conversations for the authenticated user (PROTECTED)
// This endpoint returns a list of unique conversations (e.g., by other user and listing ID)
// that the authenticated user is a part of, showing the last message in each.
router.get('/inbox', authMiddleware, async (req, res) => {
  try {
    const current_user_id = req.user.userId;

    const conversations = await pool.query(
      `WITH latest_messages AS (
                SELECT
                    MAX(m.id) AS last_message_id
                FROM messages m
                WHERE m.sender_id = $1 OR m.receiver_id = $1
                GROUP BY
                    m.listing_id,
                    CASE
                        WHEN m.sender_id = $1 THEN m.receiver_id
                        ELSE m.sender_id
                    END
            )
            SELECT
                m.id AS message_id,
                m.listing_id,
                CASE
                    WHEN m.sender_id = $1 THEN u_receiver.id
                    ELSE u_sender.id
                END AS other_user_id, -- Corrected to reflect the actual other user's ID
                CASE
                    WHEN m.sender_id = $1 THEN u_receiver.username
                    ELSE u_sender.username
                END AS other_username,
                CASE
                    WHEN m.sender_id = $1 THEN u_receiver.email
                    ELSE u_sender.email
                END AS other_email,
                p.produce_type,
                m.message_text,
                m.timestamp,
                m.sender_id, -- Include sender_id to know if "You" sent the last message
                m.receiver_id,
                (SELECT COUNT(*) FROM messages WHERE listing_id = m.listing_id AND receiver_id = $1 AND
                 (sender_id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)) AND read_status = FALSE) AS unread_count
            FROM messages m
            JOIN latest_messages lm ON m.id = lm.last_message_id
            JOIN users u_sender ON m.sender_id = u_sender.id
            JOIN users u_receiver ON m.receiver_id = u_receiver.id
            JOIN produce_listings p ON m.listing_id = p.id
            ORDER BY m.timestamp DESC`,
      [current_user_id]
    );

    res.json(conversations.rows);
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

// GET /api/messages/unread-count - Get total unread messages for the authenticated user
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND read_status = FALSE',
      [userId]
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

module.exports = router;
