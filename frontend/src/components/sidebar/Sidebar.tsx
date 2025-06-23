import { Button } from '@/components/ui/button';
import { AuthentificationService } from '@/services/authentification';
import { Home, User, LogOut, Package, Heart, PlusCircle, MailOpen, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useContext } from 'react';
import { UnreadMessagesContext } from '@/App';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const authService = new AuthentificationService();
  const { unreadCount } = useContext(UnreadMessagesContext);
  
  const handleLogout = () => {
    authService.logout();
  };

  const navItems = [
    { name: 'Accueil', icon: Home, path: '/' },
    { name: 'Mon profil', icon: User, path: '/profile' },
    { name: 'Mes messages', icon: MessageCircle, path: '/messages' },
    { name: 'Mes équipements', icon: Package, path: '/my-equipments' },
    { name: 'Wishlist', icon: Heart, path: '/wishlist' },
    { name: 'Ajouter équipement', icon: PlusCircle, path: '/equipment' },
    { name: 'Contact', icon: MailOpen, path: '/contact' },
  ];

  return (
    <div className="w-80 h-screen bg-card border-r p-6 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold">YCorner</h2>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start',
                  location.pathname === item.path ? 'bg-accent' : ''
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between w-full">
                  <span>{item.name}</span>
                  {item.path === '/messages' && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full ml-2">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pt-6 mt-6 border-t">
        <Button variant="outline" className="w-full justify-start text-red-500" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}