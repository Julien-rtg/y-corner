import { createContext } from 'react';

export const UnreadMessagesContext = createContext<{
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export default UnreadMessagesContext;
