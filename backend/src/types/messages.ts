// src/types/messages.ts - Messaging related types
export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  listing_id?: number;
  content: string;
  sent_at: Date;
  read_at?: Date;
  created_at: Date;
}

export interface SendMessageData {
  recipient_id: number;
  listing_id?: number;
  content: string;
}

export interface MessageWithUsers extends Message {
  sender_username: string;
  recipient_username: string;
  listing_title?: string;
}

export interface Conversation {
  other_user_id: number;
  other_user_username: string;
  latest_message: string;
  latest_message_date: Date;
  unread_count: number;
}
