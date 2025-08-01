// frontend/src/components/Inbox.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import '../styles/Inbox.css';

interface Conversation {
  produce_id: number;
  other_user_id: number;
  other_username?: string;
  other_email?: string;
  title: string;
  message_text: string;
  timestamp: string;
  sender_id: number;
  unread_count: number;
}

const Inbox: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchConversations = async (): Promise<void> => {
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
          const data: Conversation[] = await response.json();
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
    listingId: number,
    otherUserId: number,
    otherUsername: string,
    produceType: string
  ): void => {
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
              key={`${conv.produce_id}-${conv.other_user_id}`} // Unique key for conversation
              className="conversation-item"
              onClick={() =>
                handleConversationClick(
                  conv.produce_id,
                  conv.other_user_id,
                  conv.other_username || conv.other_email || 'Unknown',
                  conv.title
                )
              }
            >
              <div className="conversation-info">
                <div className="conversation-header">
                  <h3>Conversation about: {conv.title}</h3>
                  <span className="other-party">
                    With: {conv.other_username || conv.other_email}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="unread-count">
                      {conv.unread_count} New
                    </span>
                  )}
                </div>
                <p className="last-message">
                  {conv.sender_id === user?.id
                    ? 'You: '
                    : `${conv.other_username || conv.other_email}: `}
                  {conv.message_text.length > 50
                    ? conv.message_text.substring(0, 50) + '...'
                    : conv.message_text}
                </p>
                <span className="message-timestamp">
                  {new Date(conv.timestamp).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Inbox;
