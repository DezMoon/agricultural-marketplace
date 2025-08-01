// frontend/src/components/MessageCenter.tsx
import React, {
  useState,
  useEffect,
  useRef,
  FormEvent,
  ChangeEvent,
} from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { Message } from '../types';
import apiService from '../services/api';
import '../styles/MessageCenter.css';

const socket: Socket = io('http://localhost:3000'); // Connect to your backend Socket.IO server

interface LocationState {
  farmerUsername?: string;
  produceType?: string;
}

const MessageCenter: React.FC = () => {
  const { listingId, otherUserId } = useParams<{
    listingId: string;
    otherUserId: string;
  }>();
  const location = useLocation() as { state?: LocationState };
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore(); // Current logged-in user
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling to bottom

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extract farmerUsername and produceType from location.state if available
  const { farmerUsername, produceType } = location.state || {};

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    // Join user's Socket.IO room
    socket.emit('joinRoom', user.id);

    const fetchMessages = async (): Promise<void> => {
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
          const responseData = await response.json();
          const data: Message[] = responseData.data; // Backend returns data in 'data' field
          setMessages(data);
        } else if (response.status === 401 || response.status === 403) {
          setError('Unauthorized. Please log in again.');
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

    // Listen for new messages via Socket.IO
    socket.on('newMessage', (newMessage: Message) => {
      console.log('New message received:', newMessage);
      // Only add message if it's part of this conversation
      if (
        newMessage.listing_id === parseInt(listingId || '0') &&
        ((newMessage.sender_id === user.id &&
          newMessage.receiver_id === parseInt(otherUserId || '0')) ||
          (newMessage.sender_id === parseInt(otherUserId || '0') &&
            newMessage.receiver_id === user.id))
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    });

    // Clean up on unmount
    return () => {
      socket.off('newMessage');
    };
  }, [listingId, otherUserId, isAuthenticated, user, navigate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!newMessageText.trim() || !user) return;

    try {
      const sentMessage = await apiService.sendMessage({
        receiver_id: parseInt(otherUserId || '0'),
        listing_id: parseInt(listingId || '0'),
        message_text: newMessageText,
      });

      // Add the sent message to the local state (for immediate UI update)
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      setNewMessageText(''); // Clear the input field
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message.');
    }
  };

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

  return (
    <div className="message-center-container">
      <div className="conversation-header">
        <button onClick={() => navigate('/inbox')} className="back-btn">
          ← Back to Inbox
        </button>
        <h2>
          Conversation about: {produceType || 'Produce'}{' '}
          {farmerUsername && `with ${farmerUsername}`}
        </h2>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <p className="no-messages">
            No messages yet. Start the conversation by sending a message below!
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.sender_id === user?.id ? 'sent' : 'received'
              }`}
            >
              <div className="message-content">
                <p>{message.message_text}</p>
                <span className="message-timestamp">
                  {new Date(message.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} /> {/* For auto-scrolling */}
      </div>

      {/* Send new message form */}
      <form onSubmit={handleSendMessage} className="send-message-form">
        <input
          type="text"
          value={newMessageText}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNewMessageText(e.target.value)
          }
          placeholder="Type your message..."
          required
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default MessageCenter;
