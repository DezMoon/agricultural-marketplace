// src/services/api.ts - Centralized API service for TypeScript backend
import {
  User,
  LoginData,
  RegisterData,
  ProduceListing,
  Message,
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: string;
}

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_URL;
  }

  // Helper method for making requests with improved error handling
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {},
    skipAuth = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: ApiRequestOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token && !skipAuth) {
      config.headers!.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      // Handle different response types from TypeScript backend
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Enhanced error handling for TypeScript backend responses
        const errorMessage =
          data?.error ||
          data?.message ||
          `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage) as any;
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error: any) {
      // Handle authentication errors with token refresh
      if (error.status === 401) {
        try {
          // Attempt to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const refreshResponse = await this.refreshToken();
            localStorage.setItem('token', refreshResponse.accessToken);

            // Retry the original request with the new token
            config.headers!.Authorization = `Bearer ${refreshResponse.accessToken}`;
            const retryResponse = await fetch(url, config);

            const contentType = retryResponse.headers.get('content-type');
            let retryData: any;

            if (contentType && contentType.includes('application/json')) {
              retryData = await retryResponse.json();
            } else {
              retryData = await retryResponse.text();
            }

            if (!retryResponse.ok) {
              const errorMessage =
                retryData?.error ||
                retryData?.message ||
                `HTTP error! status: ${retryResponse.status}`;
              const retryError = new Error(errorMessage) as any;
              retryError.status = retryResponse.status;
              retryError.data = retryData;
              throw retryError;
            }

            return retryData;
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          throw refreshError;
        }
      }
      throw error;
    }
  }

  // Authentication methods - Updated for TypeScript backend
  async login(credentials: LoginData): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store both access and refresh tokens
    if (response.accessToken) {
      localStorage.setItem('token', response.accessToken);
    }
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  async register(userData: RegisterData): Promise<RegisterResponse> {
    const response = await this.request<RegisterResponse>(
      '/api/users/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );

    // Store both access and refresh tokens
    if (response.accessToken) {
      localStorage.setItem('token', response.accessToken);
    }
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  // Refresh token method for TypeScript backend
  async refreshToken(): Promise<RefreshResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<RefreshResponse>(
      '/api/users/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
      true
    ); // Skip auth to prevent infinite loop

    // Update stored tokens
    if (response.accessToken) {
      localStorage.setItem('token', response.accessToken);
    }
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  // Logout method for TypeScript backend
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await this.request('/api/users/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      // Continue with logout even if API call fails
      // Error is handled silently for logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  // Produce listings methods
  async getListings(): Promise<ProduceListing[]> {
    return this.request<ProduceListing[]>('/api/produce/listings');
  }

  async createListing(formData: FormData): Promise<ProduceListing> {
    // For FormData, don't set Content-Type header
    return this.request<ProduceListing>('/api/produce/listings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
  }

  async updateListing(id: number, formData: FormData): Promise<ProduceListing> {
    return this.request<ProduceListing>(`/api/produce/listings/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
  }

  async deleteListing(id: number): Promise<void> {
    return this.request(`/api/produce/listings/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyListings(): Promise<ProduceListing[]> {
    return this.request<ProduceListing[]>('/api/produce/my-listings');
  }

  async getListingById(id: number): Promise<ProduceListing> {
    return this.request<ProduceListing>(`/api/produce/listings/${id}`);
  }

  // Messages methods
  async sendMessage(messageData: {
    receiver_id: number;
    message_text: string;
    listing_id?: number;
  }): Promise<Message> {
    const response = await this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    return response.data; // Backend returns { success: true, data: message }
  }

  async getMessages(): Promise<Message[]> {
    return this.request<Message[]>('/api/messages');
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    return this.request(`/api/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.request<{ count: number }>('/api/messages/unread-count');
  }

  // Get current user info
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/users/me');
  }

  // Get conversations
  async getConversations(): Promise<any> {
    return this.request('/api/messages/conversations');
  }

  // Get specific conversation
  async getConversation(conversationId: string): Promise<Message[]> {
    return this.request<Message[]>(
      `/api/messages/conversation/${conversationId}`
    );
  }

  // Get produce listings with query params
  async getProduceListings(queryParams: URLSearchParams): Promise<any> {
    return this.request(`/api/produce?${queryParams.toString()}`);
  }

  // Get specific produce listing
  async getProduceListing(id: string): Promise<ProduceListing> {
    return this.request<ProduceListing>(`/api/produce/${id}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Get API info
  async getApiInfo(): Promise<{ message: string; version: string }> {
    return this.request<{ message: string; version: string }>('/api');
  }
}

const apiService = new ApiService();
export default apiService;
