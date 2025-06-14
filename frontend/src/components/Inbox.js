// frontend/src/components/Inbox.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Inbox.css'; // This CSS file will be created in the next step

const Inbox = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          'http://localhost:3000/api/messages/inbox',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        } else if (response.status === 401 || response.status === 403) {
          setError('Unauthorized. Please log in again.');
          // Optional: navigate('/login') or logout()
        } else {
          setError('Failed to fetch conversations.');
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('An error occurred while connecting to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [isAuthenticated, user, navigate]);

  const handleConversationClick = (
    listingId,
    otherUserId,
    otherUsername,
    produceType
  ) => {
    navigate(`/messages/${listingId}/${otherUserId}`, {
      state: { farmerUsername: otherUsername, produceType: produceType },
    });
  };

  if (loading) {
    return <div className="inbox-container">Loading inbox...</div>;
  }

  if (error) {
    return <div className="inbox-container error-message">Error: {error}</div>;
  }

  return (
    <div className="inbox-container">
      <h2>Your Conversations</h2>
      {conversations.length === 0 ? (
        <p>
          No conversations yet. Contact a farmer on the produce listings page to
          start one!
        </p>
      ) : (
        <ul className="conversation-list">
          {conversations.map((conv) => (
            <li
              key={`${conv.listing_id}-${conv.other_user_id}`} // Unique key for conversation
              className="conversation-item"
              onClick={() =>
                handleConversationClick(
                  conv.listing_id,
                  conv.other_user_id,
                  conv.other_username || conv.other_email,
                  conv.produce_type
                )
              }
            >
              <div className="conversation-header">
                <h3>Conversation about: {conv.produce_type}</h3>
                <span className="other-party">
                  With: {conv.other_username || conv.other_email}
                </span>
                {conv.unread_count > 0 && (
                  <span className="unread-count">{conv.unread_count} New</span>
                )}
              </div>
              <p className="last-message">
                {conv.sender_id === user.userId
                  ? 'You: '
                  : `${conv.other_username || conv.other_email}: `}
                {conv.message_text.length > 50
                  ? conv.message_text.substring(0, 50) + '...'
                  : conv.message_text}
              </p>
              <span className="message-timestamp">
                {new Date(conv.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Inbox;
