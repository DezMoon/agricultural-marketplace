// frontend/src/components/MessageCenter.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import './MessageCenter.css'; // Create this CSS file

const socket = io('http://localhost:3000'); // Connect to your backend Socket.IO server

const MessageCenter = () => {
  const { listingId, otherUserId } = useParams(); // Get IDs from URL
  const location = useLocation(); // To get state passed from navigate
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Current logged-in user
  const messagesEndRef = useRef(null); // Ref for auto-scrolling to bottom

  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract farmerUsername and produceType from location.state if available
  const { farmerUsername, produceType } = location.state || {};

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    // Join user's Socket.IO room
    socket.emit('joinRoom', user.userId);

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:3000/api/messages/conversation/${listingId}/${otherUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else if (response.status === 401 || response.status === 403) {
          setError(
            'Unauthorized to view this conversation. Please log in again.'
          );
          // logout(); // Optional: force logout
        } else {
          setError('Failed to fetch messages.');
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('An error occurred while connecting to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Socket.IO listener for new messages
    socket.on('newMessage', (msg) => {
      // Only add message if it belongs to this specific conversation
      if (
        msg.listing_id === parseInt(listingId) &&
        ((msg.sender_id === user.userId &&
          msg.receiver_id === parseInt(otherUserId)) ||
          (msg.sender_id === parseInt(otherUserId) &&
            msg.receiver_id === user.userId))
      ) {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }
    });

    return () => {
      socket.off('newMessage'); // Clean up listener on component unmount
    };
  }, [listingId, otherUserId, user, isAuthenticated, navigate]);

  // Scroll to the latest message whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_id: parseInt(otherUserId),
          listing_id: parseInt(listingId),
          message_text: newMessageText,
        }),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        // Optimistically update UI, backend should also emit via socket
        setMessages((prevMessages) => [...prevMessages, sentMessage]);
        setNewMessageText(''); // Clear input
        // Emit message to the receiver's room as well, this makes sure
        // if the receiver is online, they get it immediately.
        // We'll add this to backend/routes/messages.js later.
        socket.emit('sendMessage', sentMessage); // This is a custom event we'll need to handle on backend
      } else if (response.status === 401 || response.status === 403) {
        setError('Unauthorized to send message. Please log in again.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred while sending message.');
    }
  };

  // After marking messages as read in MessageCenter.js
  useEffect(() => {
    const markAsRead = async () => {
      // Call your backend to mark messages as read
      // After successful mark, emit refresh event
      socket.emit('refreshUnread', user.userId);
    };
    markAsRead();
  }, [listingId, otherUserId, user.userId]);

  if (loading) {
    return (
      <div className="message-center-container">Loading conversation...</div>
    );
  }

  if (error) {
    return (
      <div className="message-center-container error-message">
        Error: {error}
      </div>
    );
  }

  const getOtherPartyName = () => {
    // The other user is the farmer whose listing we are contacting
    // Or the user who contacted our listing
    if (messages.length > 0) {
      const sampleMsg = messages[0];
      if (sampleMsg.sender_id === user.userId) {
        return sampleMsg.receiver_username || sampleMsg.receiver_email;
      } else {
        return sampleMsg.sender_username || sampleMsg.sender_email;
      }
    }
    // Fallback if no messages yet, use data passed from navigate
    return farmerUsername || `User ${otherUserId}`;
  };

  return (
    <div className="message-center-container">
      <h2>
        Conversation for "{produceType || 'Listing'}" with {getOtherPartyName()}
      </h2>
      <div className="message-list">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-item ${msg.sender_id === user.userId ? 'sent' : 'received'}`}
          >
            <span className="message-sender">
              {msg.sender_id === user.userId
                ? 'You'
                : msg.sender_username || msg.sender_email}
              :
            </span>
            <p className="message-text">{msg.message_text}</p>
            <span className="message-timestamp">
              {new Date(msg.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* For auto-scrolling */}
      </div>
      <form onSubmit={handleSendMessage} className="message-input-form">
        <textarea
          value={newMessageText}
          onChange={(e) => setNewMessageText(e.target.value)}
          placeholder="Type your message..."
          rows="3"
        ></textarea>
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default MessageCenter;
