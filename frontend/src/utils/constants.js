// src/utils/constants.js
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
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'joinRoom',
  REFRESH_UNREAD: 'refreshUnread',
};

export const PRODUCE_TYPES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Meat',
  'Poultry',
  'Fish',
  'Other',
];

export const UNITS = [
  'kg',
  'lbs',
  'tons',
  'pieces',
  'bunches',
  'boxes',
  'bags',
];
