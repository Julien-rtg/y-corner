import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from '@/components/sidebar/Sidebar';
import { Badge } from "@/components/ui/badge";
import { Equipment } from '@/interfaces/Equipment.interface';
import { useNavigate } from 'react-router-dom';
import { Heart, HeartFilled } from '@/components/icons/Heart';
import userService from '@/services/user';
import { EquipmentService } from '@/services/equipment';
import { toast } from 'sonner';

function Wishlist() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const favoriteIds = await userService.getFavorites();
        
        if (favoriteIds.length === 0) {
          setFavorites([]);
          setError(null);
          setLoading(false);
          return;
        }
        
        const equipmentService = new EquipmentService();
        const favoriteEquipments: Equipment[] = [];
        
        for (const id of favoriteIds) {
          try {
            const equipment = await equipmentService.getEquipment(id.toString());
            equipment.isFavorite = true;
            favoriteEquipments.push(equipment);
          } catch (equipmentError) {
            console.error(`Failed to fetch equipment ${id}:`, equipmentError);
          }
        }
        
        setFavorites(favoriteEquipments);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
        setError("Erreur lors du chargement des favoris. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (item: Equipment) => {
    try {
      await userService.removeFavorite(item.id);
      toast.success('Retiré des favoris');
      
      setFavorites(prevFavorites => prevFavorites.filter(fav => fav.id !== item.id));
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      toast.error('Une erreur est survenue');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold">Mes Favoris</h1>
            </div>

            <div className="text-sm text-muted-foreground">
              {favorites.length} article{favorites.length !== 1 ? 's' : ''} en favoris
            </div>
            
            {loading && (
              <div className="flex justify-center py-8">
                <p>Chargement des favoris...</p>
              </div>
            )}
            
            {error && (
              <div className="flex justify-center py-8">
                <p className="text-red-500">Erreur: {error}</p>
              </div>
            )}

            {!loading && !error && favorites.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Heart className="h-16 w-16 text-gray-300" />
                <p className="text-xl text-gray-500">Vous n'avez pas encore de favoris</p>
                <Button onClick={() => navigate('/')} className="mt-4">
                  Découvrir des équipements
                </Button>
              </div>
            )}

            {!loading && !error && favorites.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((item) => (
                  <Card key={item.id} className="flex flex-col relative">
                    <div 
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(item);
                      }}
                    >
                      <HeartFilled className="h-5 w-5 text-red-500" />
                    </div>
                    <CardHeader className="p-0" onClick={() => navigate(`/equipment/${item.id}`)}>
                      <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${item.images[0].content}`}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <p className="text-gray-500">No image</p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-6" onClick={() => navigate(`/equipment/${item.id}`)}>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="line-clamp-1">{item.name}</CardTitle>
                        <div className="flex flex-wrap gap-1">
                          {item.categories.map((category) => (
                            <Badge key={category.id} variant="secondary" className="ml-2 shrink-0">
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">
                        {item.city}
                      </p>
                      <p className="text-muted-foreground text-sm mb-4">
                        Publié par: {item.user.firstName} {item.user.lastName}
                      </p>
                      <p className="text-2xl font-bold">
                        {item.price.toFixed(2)} €
                      </p>
                    </CardContent>
                    <CardFooter className="p-6 pt-0" onClick={() => navigate(`/equipment/${item.id}`)}>
                      <Button className="w-full" size="lg">
                        Voir l'équipement
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Wishlist;