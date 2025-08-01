// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import io from 'socket.io-client';
import ProduceList from './components/ProduceList';
import Register from './components/Register';
import Login from './components/Login';
import CreateListingForm from './components/CreateListingForm';
import MyListings from './components/MyListings';
import EditListingForm from './components/EditListingForm';
import MessageCenter from './components/MessageCenter';
import Inbox from './components/Inbox';
import ListingDetails from './components/ListingDetails';
import { useAuthStore } from './store/authStore';
import DarkModeToggle from './components/DarkModeToggle';
import { ProtectedRouteProps } from './types';
import './App.css';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');

// Component for the navigation links, now aware of auth state
const AuthNavLinks: React.FC = () => {
  const { user, logout, isAuthenticated, unreadCount, clearAllAuth } =
    useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Join socket room for real-time messaging
    socket.emit('joinRoom', user.id);

    // Listen for new messages on socket
    const handleNewMessage = (): void => {
      // The auth store will handle updating unread counts
    };

    const handleRefreshUnread = (): void => {
      // The auth store will handle updating unread counts
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('refreshUnread', handleRefreshUnread);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('refreshUnread', handleRefreshUnread);
    };
  }, [isAuthenticated, user]);

  return (
    <ul style={{ listStyle: 'none', display: 'flex', gap: '20px', margin: 0 }}>
      <li>
        <Link to="/">Home</Link>
      </li>
      {isAuthenticated ? (
        <>
          <li>
            <Link to="/create-listing">Create Listing</Link>
          </li>
          <li>
            <Link to="/my-listings">My Listings</Link>
          </li>
          <li>
            <Link to="/inbox">
              Inbox{' '}
              {unreadCount > 0 && (
                <span style={{ color: 'red' }}>({unreadCount})</span>
              )}
            </Link>
          </li>
          <li>
            <span>Welcome, {user?.username || 'User'}!</span>
          </li>
          <li>
            <button
              onClick={clearAllAuth}
              style={{
                background: 'red',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Clear auth tokens and reload"
            >
              Clear Auth
            </button>
          </li>
          <li>
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
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
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h2>Authentication Required</h2>
        <p>
          Please <Link to="/login">login</Link> to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Read from localStorage or default to false
    return localStorage.getItem('darkMode') === 'true';
  });
  const { refreshAuth, loading } = useAuthStore();

  // Initialize authentication on app startup
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    // Add/remove class on body
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    // Persist preference
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = (): void => setDarkMode((prev) => !prev);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
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
          <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
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
              path="/inbox"
              element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              }
            />
            <Route path="/listing/:id" element={<ListingDetails />} />
          </Routes>
        </div>

        <footer>
          <p>&copy; 2025 Agricultural Marketplace</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
