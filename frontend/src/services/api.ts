// src/services/api.ts - Centralized API service for TypeScript backend
import {
  User,
  LoginData,
  RegisterData,
  ProduceListing,
  Message,
} from '../types';

// Ensure TypeScript knows about DOM types (RequestInit)

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
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
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
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
      // Handle authentication errors
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
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

    const response = await this.request<RefreshResponse>('/api/users/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

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
      console.error('Logout API call failed:', error);
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
    receiverId: number;
    listingId: number;
    message: string;
  }): Promise<Message> {
    return this.request<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
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
