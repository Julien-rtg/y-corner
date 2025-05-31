import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';
import { useEffect, useState } from 'react';
import { AuthentificationService } from '@/services/authentification';
import Equipment from "@/pages/main/equipments/equipment";
import Home from "@/pages/main/home/Home";
import ChatPage from "@/pages/main/chat/ChatPage";
import useWebSocket from 'react-use-websocket';
import chatService from '@/services/chat';
import { getUser } from '@/utils/getToken';

function App() {
  const auth = new AuthentificationService();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const user = getUser();

  const WS_URL = import.meta.env.VITE_WEBSOCKET_URL.replace('{id}', user.id.toString());
    
  const { sendJsonMessage, lastJsonMessage, readyState, getWebSocket } = useWebSocket(
      WS_URL,
      {
          share: false,
          shouldReconnect: () => true,
          onOpen: () => {
              console.log('WebSocket connection established');
              chatService.setWebSocket(getWebSocket() as WebSocket);
          },
          onClose: (event) => console.log('WebSocket connection closed', event),
          onError: (error) => console.error('WebSocket error:', error),
      },
  )

  useEffect(() => {
    if(lastJsonMessage) {
      console.log(lastJsonMessage);
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await auth.refresh();
        if(!response) {
          setIsAuthenticated(false);
          return;
        }
        setIsAuthenticated(true);
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
          <Equipment 
            sendJsonMessage={sendJsonMessage} 
            lastJsonMessage={lastJsonMessage} 
            readyState={readyState}
          /> : <Navigate to="/login" />}
        />
      </Routes>
      <Toaster richColors />
    </Router>
  );
}

export default App;