import { Search, Filter, ArrowUpDown, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  categories: string[];
  sortBy: "name_asc" | "name_desc" | "price_asc" | "price_desc";
  setSortBy: (value: "name_asc" | "name_desc" | "price_asc" | "price_desc") => void;
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  locations: string[];
}

export default function Filters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  selectedLocation,
  setSelectedLocation,
  locations,
}: FiltersProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un équipement..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Category Filter */}
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
        
        {/* Sort Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-shrink-0">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {sortBy.includes('name') ? 
                (sortBy === 'name_asc' ? 'Nom (A-Z)' : 'Nom (Z-A)') : 
                (sortBy === 'price_asc' ? 'Prix (↑)' : 'Prix (↓)')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("name_asc")}>
              Nom (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name_desc")}>
              Nom (Z-A)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("price_asc")}>
              Prix (croissant)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("price_desc")}>
              Prix (décroissant)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Price Range Filter */}
        <div className="flex-1 space-y-2">  
          <Label></Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1">Min</Label>
              <Input
                type="text"
                value={priceRange[0].toString()}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || /^\d+$/.test(inputValue)) {
                    const value = inputValue === '' ? 0 : parseInt(inputValue);
                    setPriceRange([value, priceRange[1]]);
                  }
                }}
                placeholder="Prix minimum"
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-center">
              <span className="text-muted-foreground">-</span>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1">Max</Label>
              <Input
                type="text"
                value={priceRange[1].toString()}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || /^\d+$/.test(inputValue)) {
                    const value = inputValue === '' ? 0 : parseInt(inputValue);
                    setPriceRange([priceRange[0], value]);
                  }
                }}
                placeholder="Prix maximum"
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Location Filter */}
        <div className="flex-1 space-y-2">
          <Label>Localisation</Label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sélectionner une localisation" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}