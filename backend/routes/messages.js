// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware'); // For protecting message routes

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

    // Optional: Verify receiver_id and listing_id exist and are valid (e.g., receiver_id is the farmer of the listing)
    // For now, we'll trust the frontend to send valid IDs for simplicity.
    // A robust check would involve:
    // 1. Check if receiver_id exists in users table.
    // 2. Check if listing_id exists in produce_listings table.
    // 3. Verify that the receiver_id *is* the user_id associated with the listing_id.

    // Example of verification for receiver being the listing owner:
    const listingOwnerCheck = await pool.query(
      'SELECT user_id FROM produce_listings WHERE id = $1',
      [listing_id]
    );

    if (listingOwnerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Associated listing not found.' });
    }

    if (listingOwnerCheck.rows[0].user_id !== receiver_id) {
      return res
        .status(400)
        .json({ error: 'Receiver is not the owner of this listing.' });
    }

    if (sender_id === receiver_id) {
      return res.status(400).json({
        error: 'You cannot send a message to yourself for a listing.',
      });
    }

    const newMessage = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, listing_id, message_text) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_id, receiver_id, listing_id, message_text]
    );

    const createdMessage = newMessage.rows[0];
    res.status(201).json(createdMessage);

    // TODO: Integrate Socket.IO here to emit new message to receiver
    // req.io.to(`user-${receiver_id}`).emit('newMessage', createdMessage);
    // This will be added when we properly set up Socket.IO rooms for users.
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messages/conversation/:listing_id/:other_user_id - Get conversation for a specific listing between two users (PROTECTED)
// This endpoint retrieves messages exchanged between the authenticated user and another specific user,
// related to a particular listing.
router.get(
  '/conversation/:listing_id/:other_user_id',
  authMiddleware,
  async (req, res) => {
    try {
      const { listing_id, other_user_id } = req.params;
      const current_user_id = req.user.userId; // Authenticated user

      // Ensure that the current_user_id is either the sender or receiver in the conversation
      // and that the other_user_id is the other party.
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
          pl.farmer_name, -- Join to get farmer name (redundant with receiver if farmer is receiver)
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
               m.listing_id,
               CASE
                   WHEN m.sender_id = $1 THEN m.receiver_id
                   ELSE m.sender_id
               END AS other_party_id,
               MAX(m.timestamp) AS last_message_time
           FROM messages m
           WHERE m.sender_id = $1 OR m.receiver_id = $1
           GROUP BY m.listing_id,
                    CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
       )
       SELECT
           lm.listing_id,
           pl.produce_type, -- Get produce type
           pl.farmer_name AS listing_farmer_name, -- Get farmer name of the listing
           lm.other_party_id,
           u.username AS other_party_username,
           u.email AS other_party_email,
           m.message_text AS last_message_text,
           m.timestamp AS last_message_timestamp,
           (SELECT COUNT(*) FROM messages WHERE listing_id = lm.listing_id AND receiver_id = $1 AND sender_id = lm.other_party_id AND read_status = FALSE) AS unread_count
       FROM latest_messages lm
       JOIN messages m ON m.listing_id = lm.listing_id AND m.timestamp = lm.last_message_time AND
                         ((m.sender_id = lm.other_party_id AND m.receiver_id = $1) OR
                          (m.sender_id = $1 AND m.receiver_id = lm.other_party_id))
       JOIN users u ON lm.other_party_id = u.id
       JOIN produce_listings pl ON lm.listing_id = pl.id
       ORDER BY lm.last_message_time DESC`,
      [current_user_id]
    );

    res.json(conversations.rows);
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiver_id, listing_id, message_text } = req.body;
    const sender_id = req.user.userId;

    // ... (existing validation and listingOwnerCheck) ...

    const newMessage = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, listing_id, message_text) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_id, receiver_id, listing_id, message_text]
    );

    const createdMessage = newMessage.rows[0];

    // Get sender/receiver usernames for the emitted message
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
    };

    res.status(201).json(messageWithUsernames); // Send back enriched message

    // Emit the new message to the receiver's Socket.IO room
    // The 'user-' prefix is important as defined in server.js
    req.io.to(`user-${receiver_id}`).emit('newMessage', messageWithUsernames);
    // Also emit to the sender's room so their other active sessions receive it (optional, but good for multi-device support)
    if (sender_id !== receiver_id) {
      // Avoid double-emitting if user messages themselves (though we prevent that now)
      req.io.to(`user-${sender_id}`).emit('newMessage', messageWithUsernames);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
