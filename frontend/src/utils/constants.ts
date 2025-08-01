// src/utils/constants.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/users/login',
    REGISTER: '/api/users/register',
  },
  PRODUCE: {
    LISTINGS: '/api/produce/listings',
    MY_LISTINGS: '/api/produce/my-listings',
  },
  MESSAGES: {
    BASE: '/api/messages',
    UNREAD_COUNT: '/api/messages/unread-count',
  },
  HEALTH: '/health',
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
} as const;

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'joinRoom',
  REFRESH_UNREAD: 'refreshUnread',
} as const;

export const PRODUCE_TYPES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Meat',
  'Poultry',
  'Fish',
  'Other',
] as const;

export const UNITS = [
  'kg',
  'lbs',
  'tons',
  'pieces',
  'bunches',
  'boxes',
  'bags',
] as const;

// Type helpers
export type ProduceType = (typeof PRODUCE_TYPES)[number];
export type Unit = (typeof UNITS)[number];
