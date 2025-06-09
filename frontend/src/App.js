// frontend/src/App.js
import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from 'react-router-dom';
import ProduceList from './components/ProduceList';
import Register from './components/Register';
import Login from './components/Login';
import CreateListingForm from './components/CreateListingForm';
import MyListings from './components/MyListings';
import EditListingForm from './components/EditListingForm';
import MessageCenter from './components/MessageCenter';
import Inbox from './components/Inbox'; // Import Inbox
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Component for the navigation links, now aware of auth state
const AuthNavLinks = () => {
  const { user, logout, isAuthenticated } = useAuth();

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
          <li>
            <Link to="/inbox">Inbox</Link> {/* NEW: Link to Inbox */}
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
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <nav>
            <AuthNavLinks />
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
