// Type definitions for the frontend application

import React from 'react';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

export interface ProduceListing {
  id: number;
  user_id: number;
  title: string;
  category: 'vegetables' | 'fruits' | 'grains' | 'dairy' | 'meat' | 'other';
  quantity: number;
  unit: 'kg' | 'lbs' | 'tons' | 'pieces' | 'liters' | 'gallons';
  price_per_unit: number;
  description: string;
  location: string;
  harvest_date: string;
  availability_status: 'available' | 'sold' | 'reserved';
  listing_date: string;
  image_url?: string;
  farmer_username: string;
  farmer_email: string;
  created_at?: string;
  updated_at?: string;
}

// Alias for consistency with backend
export type Produce = ProduceListing;

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  listing_id?: number;
  message_text: string;
  timestamp: string;
  read_status: boolean;
  conversation_id?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface CreateListingData {
  produce_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  description: string;
  location: string;
  harvest_date: string;
}

// Component prop types
export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export interface DarkModeToggleProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}
