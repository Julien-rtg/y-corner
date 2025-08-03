import Filters from '@/components/filters/Filters';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Equipment } from '@/interfaces/Equipment.interface';
import { EquipmentService } from '@/services/equipment/equipment';
import { useNavigate } from 'react-router-dom';
import { Heart, HeartFilled } from '../../../components/icons/Heart';
import userService from '@/services/user/user';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';

function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "price_asc" | "price_desc">("name_asc");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<string[]>(["Tous"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [locations, setLocations] = useState<string[]>(["Tous"]);
  const [selectedLocation, setSelectedLocation] = useState("Tous");

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const equipmentService = new EquipmentService();
        const data = await equipmentService.getAllEquipment();
        
        try {
          const favorites = await userService.getFavorites();
          const favoriteIds = favorites.map(fav => fav.id);
          
          data.forEach(item => {
            item.isFavorite = favoriteIds.includes(item.id);
          });
        } catch (favError) {
          console.error("Failed to fetch favorites:", favError);
          Sentry.captureException(favError, {
            tags: { component: 'Home', function: 'fetchFavorites' }
          });
        }
        
        setEquipment(data);
        
        const uniqueCategories = new Set<string>();
        uniqueCategories.add("Tous");
        
        const uniqueLocations = new Set<string>();
        uniqueLocations.add("Tous");
        let highestPrice = 0;
        
        data.forEach(item => {
          item.categories.forEach(category => {
            uniqueCategories.add(category.name);
          });
          
          if (item.city) {
            uniqueLocations.add(item.city);
          }
          
          if (item.price > highestPrice) {
            highestPrice = item.price;
          }
        });
        
        setCategories(Array.from(uniqueCategories));
        setLocations(Array.from(uniqueLocations));
        setPriceRange([0, Math.ceil(highestPrice / 100) * 100]);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch equipment:", err);
        setError("Failed to load equipment. Please try again later.");
        
        Sentry.captureException(err, {
          tags: {
            component: 'Home',
            function: 'fetchEquipment'
          },
          extra: {
            message: 'Error loading equipment data'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  const filteredEquipment = equipment
    .filter(item => {
      const matchesCategory = selectedCategory === "Tous" || 
        item.categories.some(category => category.name === selectedCategory);
      
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      
      const matchesLocation = selectedLocation === "Tous" || item.city === selectedLocation;
      
      return matchesCategory && matchesSearch && matchesPrice && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const handleToggleFavorite = async (e: React.MouseEvent, item: Equipment) => {
    e.stopPropagation();
    
    try {
      if (item.isFavorite) {
        await userService.removeFavorite(item.id);
        toast.success('Retiré des favoris');
      } else {
        await userService.addFavorite(item.id);
        toast.success('Ajouté aux favoris');
      }
      
      setEquipment(prevEquipment => {
        return prevEquipment.map(equip => {
          if (equip.id === item.id) {
            return { ...equip, isFavorite: !equip.isFavorite };
          }
          return equip;
        });
      });
      
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      toast.error('Une erreur est survenue');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold">Équipements Sportifs</h1>
            </div>

            <Filters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              sortBy={sortBy}
              setSortBy={setSortBy}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              locations={locations}
            />

            <div className="text-sm text-muted-foreground">
              Affichage de {filteredEquipment.length} articles
            </div>
            {loading && (
              <div className="flex justify-center py-8">
                <p>Chargement des équipements...</p>
              </div>
            )}
            
            {error && (
              <div className="flex justify-center py-8">
                <p className="text-red-500">Erreur: Une erreur est survenue lors du chargement des données</p>
              </div>
            )}

            {!loading && !error && (
              <>
                <h2 className="sr-only">Liste des équipements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipment.map((item) => (
                  <Card key={item.id} className="flex flex-col relative">
                    <button 
                      aria-label={item.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm cursor-pointer"
                      onClick={(e) => handleToggleFavorite(e, item)}
                    >
                      {item.isFavorite ? (
                        <HeartFilled className="h-5 w-5 text-red-500" />
                      ) : (
                        <Heart className="h-5 w-5 text-gray-600 hover:text-red-500" />
                      )}
                    </button>
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
                        Publié par: {item.user?.firstName} {item.user?.lastName}
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
              </>
            )}
            
            {!loading && !error && filteredEquipment.length === 0 && (
              <div className="flex justify-center py-8">
                <p>Aucun équipement trouvé</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;