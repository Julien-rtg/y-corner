import { api } from '@/lib/api';
import { getToken } from '@/utils/getToken';

export interface ChatMessage {
  id: string;
  fromUserId: number;
  toUserId: number;
  message: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  recipientId: number;
  recipientName: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

export class ChatService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || '';
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
      throw error;
    }
  }
}

const chatService = new ChatService();
export default chatService;