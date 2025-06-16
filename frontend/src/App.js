// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from 'react-router-dom';
import io from 'socket.io-client';
import ProduceList from './components/ProduceList';
import Register from './components/Register';
import Login from './components/Login';
import CreateListingForm from './components/CreateListingForm';
import MyListings from './components/MyListings';
import EditListingForm from './components/EditListingForm';
import MessageCenter from './components/MessageCenter';
import Inbox from './components/Inbox'; // Import Inbox
import ListingDetails from './components/ListingDetails'; // Import ListingDetails
import { AuthProvider, useAuth } from './context/AuthContext';
import DarkModeToggle from './components/DarkModeToggle'; // Import the toggle
import './App.css';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');

// Component for the navigation links, now aware of auth state
const AuthNavLinks = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count on mount and when user changes
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchUnread = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(
        'http://localhost:3000/api/messages/unread-count',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    };

    fetchUnread();

    socket.emit('joinRoom', user.userId);

    // On new message, always fetch the latest count
    socket.on('newMessage', fetchUnread);

    // On refreshUnread, also fetch the latest count
    socket.on('refreshUnread', fetchUnread);

    return () => {
      socket.off('newMessage', fetchUnread);
      socket.off('refreshUnread', fetchUnread);
    };
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
  };

  const displayName = user ? user.username || user.email : '';

  return (
    <ul>
      <li>
        <Link to="/">Produce Listings</Link>
      </li>
      {isAuthenticated ? (
        <>
          <li>
            <Link to="/create-listing">Create Listing</Link>
          </li>
          <li>
            <Link to="/my-listings">My Listings</Link>
          </li>
          <li style={{ position: 'relative' }}>
            <Link to="/inbox">
              Inbox
              {unreadCount > 0 && (
                <span className="inbox-badge">{unreadCount}</span>
              )}
            </Link>
          </li>
          <li>
            <span>Welcome, {displayName}!</span>
          </li>
          <li>
            <button onClick={handleLogout} className="nav-button">
              Logout
            </button>
          </li>
        </>
      ) : (
        <>
          <li>
            <Link to="/register">Register</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
        </>
      )}
    </ul>
  );
};

// Simple Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : null;
};

function App() {
  // Dark mode state and effect
  const [darkMode, setDarkMode] = useState(() => {
    // Read from localStorage or default to false
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    // Add/remove class on body
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    // Persist preference
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              position: 'relative',
            }}
          >
            {/* Toggle at top right */}
            <DarkModeToggle
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
            {/* Navigation links (centered) */}
            <div style={{ flex: 1 }}>
              <AuthNavLinks />
            </div>
          </nav>

          <div className="produce-listings-container">
            <Routes>
              <Route path="/" element={<ProduceList />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/create-listing"
                element={
                  <ProtectedRoute>
                    <CreateListingForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-listings"
                element={
                  <ProtectedRoute>
                    <MyListings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-listing/:id"
                element={
                  <ProtectedRoute>
                    <EditListingForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:listingId/:otherUserId"
                element={
                  <ProtectedRoute>
                    <MessageCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inbox" // NEW: Route for Inbox
                element={
                  <ProtectedRoute>
                    <Inbox />
                  </ProtectedRoute>
                }
              />
              <Route path="/listing/:id" element={<ListingDetails />} />{' '}
              {/* NEW: Route for ListingDetails */}
            </Routes>
          </div>

          <footer>
            <p>&copy; 2025 Agricultural Marketplace</p>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
