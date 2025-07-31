// src/services/api.js - Centralized API service for TypeScript backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  // Helper method for making requests with improved error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      // Handle different response types from TypeScript backend
      const contentType = response.headers.get('content-type');
      let data;

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
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
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
  async login(credentials) {
    const response = await this.request('/api/users/login', {
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

  async register(userData) {
    const response = await this.request('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
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

  // Refresh token method for TypeScript backend
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request('/api/users/refresh', {
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
  async logout() {
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
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  // Produce listings methods
  async getListings() {
    return this.request('/api/produce/listings');
  }

  async createListing(formData) {
    // For FormData, don't set Content-Type header
    return this.request('/api/produce/listings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
  }

  async updateListing(id, formData) {
    return this.request(`/api/produce/listings/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
  }

  async deleteListing(id) {
    return this.request(`/api/produce/listings/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyListings() {
    return this.request('/api/produce/my-listings');
  }

  // Messages methods
  async sendMessage(messageData) {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getMessages() {
    return this.request('/api/messages');
  }

  async markMessageAsRead(messageId) {
    return this.request(`/api/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async getUnreadCount() {
    return this.request('/api/messages/unread-count');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Get API info
  async getApiInfo() {
    return this.request('/api');
  }
}

const apiService = new ApiService();
export default apiService;
