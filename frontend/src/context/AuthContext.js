// frontend/src/context/AuthContext.js
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import apiService from '../services/api';

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
      // Adjust based on your TypeScript backend token payload
      setUser({
        username: decoded.username,
        email: decoded.email,
        userId: decoded.userId,
      });
      return true;
    } catch (error) {
      // Remove invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      return false;
    }
  };

  // Function to handle token refresh
  const handleTokenRefresh = useCallback(async () => {
    try {
      const response = await apiService.refreshToken();
      if (response.accessToken) {
        decodeAndSetUser(response.accessToken);
        return true;
      }
    } catch (error) {
      // Refresh failed, clear tokens and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/login');
      return false;
    }
  }, [navigate]);

  // Check for token on initial load and set up token refresh
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token) {
        // Try to decode the current token
        const decoded = decodeAndSetUser(token);
        if (!decoded && refreshToken) {
          // If current token is invalid, try to refresh
          await handleTokenRefresh();
        }
      } else if (refreshToken) {
        // No access token but have refresh token, try to refresh
        await handleTokenRefresh();
      }

      setLoading(false);
    };

    initAuth();
  }, [handleTokenRefresh]);

  const login = async (credentials) => {
    const response = await apiService.login(credentials);
    if (response.accessToken) {
      decodeAndSetUser(response.accessToken);
      return response;
    }
    throw new Error('No access token received');
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        handleTokenRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
