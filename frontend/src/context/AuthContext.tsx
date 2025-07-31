// frontend/src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import apiService from '../services/api';
import { User, AuthContextType, LoginData } from '../types';

// JWT Token payload interface
interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Stores user data
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Function to decode token and set user
  const decodeAndSetUser = (token: string): boolean => {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      // Set user data from token payload
      setUser({
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
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
  const handleTokenRefresh = useCallback(async (): Promise<boolean> => {
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
    return false;
  }, [navigate]);

  // Check for token on initial load and set up token refresh
  useEffect(() => {
    const initAuth = async (): Promise<void> => {
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

  const login = async (token: string, userData: User): Promise<void> => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      // console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/login');
    }
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  return context;
};
