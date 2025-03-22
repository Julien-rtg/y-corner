import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import { useEffect, useState } from 'react';
import { AuthentificationService } from '@/services/authentification';
import Equipment from "@/pages/main/equipments/equipment";
import Chat from "@/pages/main/chat/chat";

function App() {
  const auth = new AuthentificationService();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

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
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
        <Route
          path="/equipment/:id"
          element={isAuthenticated ? <Equipment /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
      <Toaster richColors />
    </Router>
  );
}

export default App;