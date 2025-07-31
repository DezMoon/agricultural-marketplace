// src/types/auth.ts - Authentication related types
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at?: Date;
}

export interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
}

export interface UserLoginData {
  identifier: string; // Can be either email or username
  password: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  used_at?: Date;
  revoked_at?: Date;
}

export interface AuthRequest extends Express.Request {
  user?: JWTPayload;
}

// Login/Register response types
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}
