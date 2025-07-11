import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';
import { useEffect, useState, createContext } from 'react';
import { AuthentificationService } from '@/services/authentification/authentification';
import EquipmentDetail from "@/pages/main/equipment-detail/Equipment-detail";
import Home from "@/pages/main/home/Home";
import ChatPage from "@/pages/main/chat/ChatPage";
import useWebSocket from 'react-use-websocket';
import chatService from '@/services/chat/chat';
import { getUser } from '@/utils/getToken';
import Profile from './pages/main/profile/Profile';
import MyEquipments from './pages/main/my-equipments/MyEquipments';
import Equipment from './pages/main/equipment/Equipment';
import Wishlist from './pages/main/wishlist/Wishlist';
import Contact from './pages/main/contact/Contact';
import { init } from "@sentry/react";
import Sidebar from '@/components/sidebar/Sidebar';

export const UnreadMessagesContext = createContext<{
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}>({
  unreadCount: 0,
  refreshUnreadCount: async () => { }
});

const Layout = ({ children, isAuthenticated }: { children: React.ReactNode, isAuthenticated: boolean }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/reset-password';
  
  return (
    <div className="flex">
      {isAuthenticated && !isAuthPage && <Sidebar />}
      <div className={`${isAuthenticated && !isAuthPage ? 'ml-80' : ''} flex-1`}>
        {children}
      </div>
    </div>
  );
};

function App() {
  const auth = new AuthentificationService();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = getUser();

  init({
    dsn: "https://1c46eed707732f6f424bb03f7fe9903d@o4509558456385536.ingest.de.sentry.io/4509558458286160",
    tracesSampleRate: 1.0,
    sendDefaultPii: true
  });

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
        <Layout isAuthenticated={isAuthenticated}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" />} />
            <Route path="/" element={<Home />} />
            <Route path="/messages" element={isAuthenticated ?
              <ChatPage
                sendJsonMessage={sendJsonMessage}
                lastJsonMessage={lastJsonMessage}
                readyState={readyState}
              /> : <Navigate to="/login" />} />
            <Route
              path="/equipment/:id"
              element={<EquipmentDetail
                sendJsonMessage={sendJsonMessage}
                lastJsonMessage={lastJsonMessage}
                readyState={readyState}
              />}
            />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/my-equipments" element={isAuthenticated ? <MyEquipments /> : <Navigate to="/login" />} />
            <Route path="/equipment" element={isAuthenticated ? <Equipment /> : <Navigate to="/login" />} />
            <Route path="/edit-equipment/:id" element={isAuthenticated ? <Equipment /> : <Navigate to="/login" />} />
            <Route path="/wishlist" element={isAuthenticated ? <Wishlist /> : <Navigate to="/login" />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Layout>
        <Toaster richColors />
      </Router>
    </UnreadMessagesContext.Provider>
  );
}

export default App;