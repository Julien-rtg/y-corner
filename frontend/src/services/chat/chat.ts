import { api } from '@/lib/api';
import { getToken } from '@/utils/getToken';
import * as Sentry from '@sentry/react';

export interface ChatMessage {
  id: string;
  fromUserId: number;
  toUserId: number;
  message: string;
  createdAt: string;
  seen: boolean;
}

export interface Conversation {
  id: number;
  recipientId: number;
  recipientName: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCounts: Record<string, number>;
  totalUnread: number;
}

export class ChatService {
  private apiUrl: string;
  private socket: WebSocket | null = null;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || '';
  }
  
  setWebSocket(socket: WebSocket) {
    this.socket = socket;
  }
  
  markMessagesAsSeen(fromUserId: number, toUserId: number) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'mark_seen',
        from: fromUserId,
        to: toUserId
      }));
      return true;
    }
    return false;
  }

  async getMessagesBetweenUsers(userId: number, recipientId: number): Promise<ChatMessage[]> {
    try {
      const endpoint = `/api/chat/messages?user1Id=${userId}&user2Id=${recipientId}`;
      const token = getToken();

      const data = await api<ChatMessage[]>(
        endpoint,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        },
        this.apiUrl
      );

      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      
      Sentry.captureException(error, {
        tags: {
          service: 'ChatService',
          method: 'getMessagesBetweenUsers',
          endpoint: `/api/chat/messages`
        },
        extra: {
          userId: userId,
          recipientId: recipientId,
          apiUrl: this.apiUrl
        }
      });
      
      throw error;
    }
  }

  async getUserConversations(userId: number): Promise<Conversation[]> {
    try {
      const endpoint = `/api/chat/conversations?userId=${userId}`;
      const token = getToken();

      const data = await api<Conversation[]>(
        endpoint,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        },
        this.apiUrl
      );

      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      
      Sentry.captureException(error, {
        tags: {
          service: 'ChatService',
          method: 'getUserConversations',
          endpoint: `/api/chat/conversations`
        },
        extra: {
          userId: userId,
          apiUrl: this.apiUrl
        }
      });
      
      throw error;
    }
  }
  
  async getUnreadMessageCount(userId: number, signal?: AbortSignal): Promise<UnreadCountResponse> {
    try {
      const endpoint = `/api/chat/unread-count?userId=${userId}`;
      const token = getToken();

      const data = await api<UnreadCountResponse>(
        endpoint,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          signal
        },
        this.apiUrl
      );

      return data || { unreadCounts: {}, totalUnread: 0 };
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      return { unreadCounts: {}, totalUnread: 0 };
    }
  }
}

const chatService = new ChatService();
export default chatService;