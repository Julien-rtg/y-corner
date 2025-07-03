import CategoryWishlist from './Category-wishlist';
import EquipmentWishlist from './Equipment-wishlist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Wishlist() {

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold">Mes Favoris</h1>
            </div>

            <Tabs defaultValue="equipments" className="w-full">
              <TabsList>
                <TabsTrigger value="equipments">Équipements</TabsTrigger>
                <TabsTrigger value="categories">Catégories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="equipments">
                <EquipmentWishlist />
              </TabsContent>
              <TabsContent value="categories">
                <CategoryWishlist />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Wishlist;