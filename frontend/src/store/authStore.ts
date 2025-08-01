// frontend/src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiService from '../services/api';
import { User } from '../types';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  unreadCount: number;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUnreadCount: (count: number) => void;
  login: (credentials: {
    identifier: string;
    password: string;
  }) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      unreadCount: 0,

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setUnreadCount: (unreadCount) => set({ unreadCount }),

      clearError: () => set({ error: null }),

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.login(credentials);
          // Store tokens
          localStorage.setItem('token', response.accessToken);
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }

          // Update state
          set({
            user: response.user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Login failed';
          set({
            loading: false,
            error: errorMessage,
            user: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.register(userData);

          // Store tokens if provided (auto-login after registration)
          if (response.accessToken) {
            localStorage.setItem('token', response.accessToken);
            if (response.refreshToken) {
              localStorage.setItem('refreshToken', response.refreshToken);
            }

            // Update state with auto-login
            set({
              user: response.user,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
          } else {
            // Registration successful but no auto-login
            set({
              loading: false,
              error: null,
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Registration failed';
          set({
            loading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          // Call logout API
          await apiService.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error);
        } finally {
          // Clear tokens and state
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            unreadCount: 0,
          });
        }
      },

      refreshAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ loading: false });
          return;
        }

        set({ loading: true, error: null });
        try {
          // Try to get user info with current token
          const userResponse = await apiService.request('/api/users/me');

          set({
            user: userResponse,
            isAuthenticated: true,
            loading: false,
            error: null,
          });

          // Only fetch unread message count if user authentication was successful
          try {
            const unreadResponse = await apiService.request(
              '/api/messages/unread-count'
            );
            set({ unreadCount: unreadResponse.unreadCount || 0 });
          } catch (error) {
            // Non-critical error, just log it
            console.warn('Could not fetch unread count:', error);
            set({ unreadCount: 0 });
          }
        } catch (error) {
          // Token might be expired, try refresh
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const refreshResponse = await apiService.refreshToken();
              localStorage.setItem('token', refreshResponse.accessToken);

              // Try again with new token
              const userResponse = await apiService.request('/api/users/me');
              set({
                user: userResponse,
                isAuthenticated: true,
                loading: false,
                error: null,
              });

              // Fetch unread count with new token
              try {
                const unreadResponse = await apiService.request(
                  '/api/messages/unread-count'
                );
                set({ unreadCount: unreadResponse.unreadCount || 0 });
              } catch (error) {
                console.warn(
                  'Could not fetch unread count after refresh:',
                  error
                );
                set({ unreadCount: 0 });
              }
              return;
            }
          } catch (refreshError) {
            console.warn('Token refresh failed:', refreshError);
          }

          // Both original and refresh failed, clear auth
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            unreadCount: 0,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist user data, not loading/error states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
