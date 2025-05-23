// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Stores user data (e.g., { username: '...', email: '...', userId: '...' })
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to decode token and set user
  const decodeAndSetUser = (token) => {
    try {
      const decoded = jwtDecode(token);
      // Adjust based on your token payload - now expecting username and email
      setUser({
        username: decoded.username,
        email: decoded.email, // Extract email
        userId: decoded.userId,
      });
      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('token'); // Remove invalid token
      setUser(null);
      return false;
    }
  };

  // Check for token on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      decodeAndSetUser(token);
    }
    setLoading(false); // Finished initial loading check
  }, []);

  const login = (token) => {
    // Removed username parameter as it's now in the token
    localStorage.setItem('token', token);
    decodeAndSetUser(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
