import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sidebar from '@/components/ui/sidebar/Sidebar';
import { Badge } from "@/components/ui/badge";
import { Equipment } from '@/interfaces/Equipment.interface';
import { EquipmentService } from '@/services/equipment';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const equipmentService = new EquipmentService();
        const data = await equipmentService.getAllEquipment();
        console.log(data);
        setEquipment(data);
        // Extract unique categories from equipment data
        const uniqueCategories = new Set<string>();
        uniqueCategories.add("All");
        
        data.forEach(item => {
          item.categories.forEach(category => {
            uniqueCategories.add(category.name);
          });
        });
        
        setCategories(Array.from(uniqueCategories));
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
      
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return a.price - b.price;
    });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold">Sports Equipment</h1>
              <p className="text-muted-foreground">Browse our collection of premium sports gear</p>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search equipment..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-shrink-0">
                    <Filter className="mr-2 h-4 w-4" />
                    {selectedCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {categories.map((category) => (
                    <DropdownMenuItem 
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-shrink-0">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort by: {sortBy === "name" ? "Name" : "Price"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("name")}>
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price")}>
                    Price
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredEquipment.length} items
            </div>

            {/* Loading and Error States */}
            {loading && (
              <div className="flex justify-center py-8">
                <p>Loading equipment...</p>
              </div>
            )}
            
            {error && (
              <div className="flex justify-center py-8">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {/* Products Grid */}
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
                        Posted by: {item.user.firstName} {item.user.lastName}
                      </p>
                      <p className="text-2xl font-bold">
                        ${item.price.toFixed(2)}
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
            
            {/* Empty State */}
            {!loading && !error && filteredEquipment.length === 0 && (
              <div className="flex justify-center py-8">
                <p>No equipment found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;