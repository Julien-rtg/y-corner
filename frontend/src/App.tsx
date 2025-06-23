import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';
import { useEffect, useState, createContext } from 'react';
import { AuthentificationService } from '@/services/authentification';
import EquipmentDetail from "@/pages/main/equipment-detail/Equipment-detail";
import Home from "@/pages/main/home/Home";
import ChatPage from "@/pages/main/chat/ChatPage";
import useWebSocket from 'react-use-websocket';
import chatService from '@/services/chat';
import { getUser } from '@/utils/getToken';
import Profile from './pages/main/profile/Profile';
import MyEquipments from './pages/main/my-equipments/MyEquipments';
import Equipment from './pages/main/equipment/Equipment';

export const UnreadMessagesContext = createContext<{
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}>({
  unreadCount: 0,
  refreshUnreadCount: async () => { }
});

function App() {
  const auth = new AuthentificationService();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = getUser();

  const WS_URL = user && user.id ? import.meta.env.VITE_WEBSOCKET_URL.replace('{id}', user.id.toString()) : '';

  const { sendJsonMessage, lastJsonMessage, readyState, getWebSocket } = WS_URL ? useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
      onOpen: () => {
        console.log('WebSocket connection established');
        if (getWebSocket) {
          chatService.setWebSocket(getWebSocket() as WebSocket);
        }
      },
      onClose: (event) => console.log('WebSocket connection closed', event),
      onError: (error) => console.error('WebSocket error:', error),
    },
  ) : {};

  const refreshUnreadCount = async () => {
    if (user && user.id) {
      try {
        const response = await chatService.getUnreadMessageCount(user.id);
        setUnreadCount(response.totalUnread);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    }
  };

  const refreshUnreadCountLightweight = async () => {
    if (user && user.id) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await chatService.getUnreadMessageCount(user.id, controller.signal);
        clearTimeout(timeoutId);

        setUnreadCount(response.totalUnread);
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching unread count:', error);
        }
      }
    }
  };

  useEffect(() => {
    if (lastJsonMessage) {
      if (lastJsonMessage && typeof lastJsonMessage === 'object' && 'type' in lastJsonMessage && lastJsonMessage.type === 'new_message') {
        refreshUnreadCountLightweight();
      }
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const response = await auth.refresh();
        if (!response) {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
          refreshUnreadCount();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          <Route path="/messages" element={isAuthenticated ?
            <ChatPage
              sendJsonMessage={sendJsonMessage}
              lastJsonMessage={lastJsonMessage}
              readyState={readyState}
            /> : <Navigate to="/login" />} />
          <Route
            path="/equipment/:id"
            element={isAuthenticated ?
              <EquipmentDetail
                sendJsonMessage={sendJsonMessage}
                lastJsonMessage={lastJsonMessage}
                readyState={readyState}
              /> : <Navigate to="/login" />}
          />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/my-equipments" element={isAuthenticated ? <MyEquipments /> : <Navigate to="/login" />} />
          <Route path="/equipment" element={isAuthenticated ? <Equipment /> : <Navigate to="/login" />} />
          <Route path="/edit-equipment/:id" element={isAuthenticated ? <Equipment /> : <Navigate to="/login" />} />
        </Routes>
        <Toaster richColors />
      </Router>
    </UnreadMessagesContext.Provider>
  );
}

export default App;