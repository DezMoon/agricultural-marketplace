import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import apiService from '../services/api';
import { Message } from '../types';

interface MessageState {
  // State
  conversations: { [key: string]: Message[] };
  currentConversation: string | null;
  loading: boolean;
  error: string | null;
  unreadCounts: { [key: string]: number };
  totalUnreadCount: number;

  // Actions
  setConversations: (conversations: { [key: string]: Message[] }) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUnreadCounts: (counts: { [key: string]: number }) => void;
  markConversationAsRead: (conversationId: string) => void;
  clearError: () => void;

  // Async actions
  fetchConversations: () => Promise<void>;
  fetchConversation: (conversationId: string) => Promise<void>;
  sendMessage: (
    recipientId: number,
    content: string,
    produceId?: number
  ) => Promise<Message>;
  markAsRead: (messageId: number) => Promise<void>;
}

export const useMessageStore = create<MessageState>()(
  immer((set, get) => ({
    // Initial state
    conversations: {},
    currentConversation: null,
    loading: false,
    error: null,
    unreadCounts: {},
    totalUnreadCount: 0,

    // Synchronous actions
    setConversations: (conversations) =>
      set((state) => {
        state.conversations = conversations;
      }),

    addMessage: (message) =>
      set((state) => {
        const conversationId =
          message.conversation_id ||
          `${Math.min(message.sender_id, message.recipient_id)}-${Math.max(message.sender_id, message.recipient_id)}`;

        if (!state.conversations[conversationId]) {
          state.conversations[conversationId] = [];
        }

        // Add message if it doesn't already exist
        const exists = state.conversations[conversationId].some(
          (m) => m.id === message.id
        );
        if (!exists) {
          state.conversations[conversationId].push(message);
          state.conversations[conversationId].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        }
      }),

    updateMessage: (messageId, updates) =>
      set((state) => {
        Object.values(state.conversations).forEach((messages) => {
          const messageIndex = messages.findIndex((m) => m.id === messageId);
          if (messageIndex !== -1 && messages[messageIndex]) {
            const existingMessage = messages[messageIndex];
            messages[messageIndex] = { ...existingMessage, ...updates };
          }
        });
      }),

    setCurrentConversation: (conversationId) =>
      set((state) => {
        state.currentConversation = conversationId;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.loading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    setUnreadCounts: (counts) =>
      set((state) => {
        state.unreadCounts = counts;
        state.totalUnreadCount = Object.values(counts).reduce(
          (total, count) => total + count,
          0
        );
      }),

    markConversationAsRead: (conversationId) =>
      set((state) => {
        if (state.conversations[conversationId]) {
          state.conversations[conversationId].forEach((message) => {
            if (!message.read_at) {
              message.read_at = new Date().toISOString();
            }
          });
        }

        if (state.unreadCounts[conversationId]) {
          state.totalUnreadCount -= state.unreadCounts[conversationId];
          state.unreadCounts[conversationId] = 0;
        }
      }),

    clearError: () =>
      set((state) => {
        state.error = null;
      }),

    // Async actions
    fetchConversations: async () => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const response = await apiService.request(
          '/api/messages/conversations'
        );
        const conversations: { [key: string]: Message[] } = {};
        const unreadCounts: { [key: string]: number } = {};

        response.forEach((conversation: any) => {
          const conversationId =
            conversation.conversation_id ||
            `${Math.min(conversation.sender_id, conversation.recipient_id)}-${Math.max(conversation.sender_id, conversation.recipient_id)}`;

          if (!conversations[conversationId]) {
            conversations[conversationId] = [];
            unreadCounts[conversationId] = 0;
          }

          conversations[conversationId] = conversation.messages || [];
          unreadCounts[conversationId] = conversation.unread_count || 0;
        });

        set((state) => {
          state.conversations = conversations;
          state.unreadCounts = unreadCounts;
          state.totalUnreadCount = Object.values(unreadCounts).reduce(
            (total, count) => total + count,
            0
          );
          state.loading = false;
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to fetch conversations';
        set((state) => {
          state.loading = false;
          state.error = errorMessage;
        });
        throw error;
      }
    },

    fetchConversation: async (conversationId) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const messages = await apiService.request(
          `/api/messages/conversation/${conversationId}`
        );

        set((state) => {
          state.conversations[conversationId] = messages;
          state.currentConversation = conversationId;
          state.loading = false;
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to fetch conversation';
        set((state) => {
          state.loading = false;
          state.error = errorMessage;
        });
        throw error;
      }
    },

    sendMessage: async (recipientId, content, produceId) => {
      const tempId = Date.now(); // Temporary ID for optimistic update
      const conversationId = `temp-${tempId}`;

      // Optimistic update
      const optimisticMessage: Message = {
        id: tempId,
        sender_id: 0, // Will be filled by server
        recipient_id: recipientId,
        content,
        produce_id: produceId,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversation_id: conversationId,
      };

      set((state) => {
        if (!state.conversations[conversationId]) {
          state.conversations[conversationId] = [];
        }
        state.conversations[conversationId].push(optimisticMessage);
        state.loading = true;
        state.error = null;
      });

      try {
        const messageData: any = { recipient_id: recipientId, content };
        if (produceId) {
          messageData.produce_id = produceId;
        }

        const sentMessage = await apiService.sendMessage(messageData);
        const realConversationId =
          sentMessage.conversation_id ||
          `${Math.min(sentMessage.sender_id, sentMessage.recipient_id)}-${Math.max(sentMessage.sender_id, sentMessage.recipient_id)}`;

        set((state) => {
          // Remove optimistic message
          delete state.conversations[conversationId];

          // Add real message
          if (!state.conversations[realConversationId]) {
            state.conversations[realConversationId] = [];
          }

          const exists = state.conversations[realConversationId].some(
            (m) => m.id === sentMessage.id
          );
          if (!exists) {
            state.conversations[realConversationId].push(sentMessage);
            state.conversations[realConversationId].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          }

          state.currentConversation = realConversationId;
          state.loading = false;
        });

        return sentMessage;
      } catch (error) {
        // Remove optimistic message on error
        set((state) => {
          delete state.conversations[conversationId];
          state.loading = false;
          state.error =
            error instanceof Error ? error.message : 'Failed to send message';
        });
        throw error;
      }
    },

    markAsRead: async (messageId) => {
      // Optimistic update
      set((state) => {
        Object.values(state.conversations).forEach((messages) => {
          const message = messages.find((m) => m.id === messageId);
          if (message && !message.read_at) {
            message.read_at = new Date().toISOString();
          }
        });
      });

      try {
        await apiService.request(`/api/messages/${messageId}/read`, {
          method: 'PUT',
        });
      } catch (error) {
        // Revert optimistic update
        set((state) => {
          Object.values(state.conversations).forEach((messages) => {
            const message = messages.find((m) => m.id === messageId);
            if (message) {
              message.read_at = null;
            }
          });
          state.error =
            error instanceof Error
              ? error.message
              : 'Failed to mark message as read';
        });
        throw error;
      }
    },
  }))
);
