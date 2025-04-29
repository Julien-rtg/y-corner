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
import Sidebar from '@/components/sidebar/Sidebar';
import { Badge } from "@/components/ui/badge";
import { Equipment } from '@/interfaces/Equipment.interface';
import { EquipmentService } from '@/services/equipment';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "price_asc" | "price_desc">("name_asc");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [locations, setLocations] = useState<string[]>(["All"]);
  const [selectedLocation, setSelectedLocation] = useState("All");

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const equipmentService = new EquipmentService();
        const data = await equipmentService.getAllEquipment();
        console.log(data);
        setEquipment(data);
        
        const uniqueCategories = new Set<string>();
        uniqueCategories.add("All");
        
        const uniqueLocations = new Set<string>();
        uniqueLocations.add("All");
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
        setMaxPrice(Math.ceil(highestPrice / 100) * 100);
        setPriceRange([0, Math.ceil(highestPrice / 100) * 100]);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch equipment:", err);
        setError("Failed to load equipment. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  const filteredEquipment = equipment
    .filter(item => {
      const matchesCategory = selectedCategory === "All" || 
        item.categories.some(category => category.name === selectedCategory);
      
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      
      const matchesLocation = selectedLocation === "All" || item.city === selectedLocation;
      
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
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
              maxPrice={maxPrice}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipment.map((item) => (
                  <Card key={item.id} className="flex flex-col" onClick={() => navigate(`/equipment/${item.id}`)}>
                    <CardHeader className="p-0">
                      <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0].content}
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
                    <CardContent className="flex-1 p-6">
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
                    <CardFooter className="p-6 pt-0">
                      <Button className="w-full" size="lg">
                        Contacter le vendeur
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
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