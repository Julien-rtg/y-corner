import { LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthentificationService } from '@/services/authentification';

export default function Sidebar() {
  const authService = new AuthentificationService();
  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="w-80 h-screen bg-card border-r p-6 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold">Filters</h2>
      </div>

      <div className="space-y-6">
        {/* Search Filter */}
        <div className="space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8" />
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="books">Books</SelectItem>
              <SelectItem value="home">Home & Garden</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-4">
          <Label>Price Range</Label>
          <Slider
            defaultValue={[0, 1000]}
            max={1000}
            step={10}
            className="mt-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>$0</span>
            <span>$1000</span>
          </div>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label>Location</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="north">North Region</SelectItem>
              <SelectItem value="south">South Region</SelectItem>
              <SelectItem value="east">East Region</SelectItem>
              <SelectItem value="west">West Region</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Apply Filters Button */}
        <Button className="w-full mt-4">
          Apply Filters
        </Button>

        <Button  onClick={handleLogout}>
          Déconnexion
        </Button>
      </div>
    </div>
  );
}