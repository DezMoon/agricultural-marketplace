// src/services/api.js - Centralized API service
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  // Helper method for making requests
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    return this.request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
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
}

export default new ApiService();
