// frontend/src/App.js
import React, { useEffect } from 'react'; // Import useEffect
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
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Component for the navigation links, now aware of auth state
const AuthNavLinks = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const displayName = user ? user.username || user.email : ''; // Prioritize username, then email

  return (
    <ul>
      <li>
        <Link to="/">Produce Listings</Link>
      </li>
      {isAuthenticated ? (
        <>
          <li>
            <span>Welcome, {displayName}!</span>{' '}
            {/* Display username or email */}
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
              {/* Example of a protected route if you have one */}
              {/* <Route path="/create-listing" element={<ProtectedRoute><CreateListingForm /></ProtectedRoute>} /> */}
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
