import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Category } from '@/interfaces/Category.interface';
import { Heart, HeartFilled } from '@/components/icons/Heart';
import userService from '@/services/user';
import { CategoryService } from '@/services/category';
import { toast } from 'sonner';

const categoryService = new CategoryService();

function CategoryWishlist() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [favoriteCategories, setFavoriteCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Récupérer toutes les catégories
        const allCategories = await categoryService.getAllCategories();
        setCategories(allCategories);
        
        // Récupérer les catégories favorites de l'utilisateur
        const userFavoriteCategories = await userService.getFavoriteCategories();
        setFavoriteCategories(userFavoriteCategories);
        
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des catégories:", err);
        setError("Erreur lors du chargement des catégories. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Vérifier si une catégorie est dans les favoris
  const isFavorite = (categoryId: number) => {
    return favoriteCategories.some(cat => cat.id === categoryId);
  };

  // Ajouter une catégorie aux favoris
  const handleAddFavorite = async (category: Category) => {
    try {
      await userService.addFavoriteCategory(category.id);
      setFavoriteCategories(prev => [...prev, category]);
      toast.success(`${category.name} ajouté aux favoris`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      toast.error('Une erreur est survenue');
    }
  };

  // Retirer une catégorie des favoris
  const handleRemoveFavorite = async (category: Category) => {
    try {
      await userService.removeFavoriteCategory(category.id);
      setFavoriteCategories(prev => prev.filter(cat => cat.id !== category.id));
      toast.success(`${category.name} retiré des favoris`);
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      toast.error('Une erreur est survenue');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Catégories</h2>
        <p className="text-muted-foreground">
          Sélectionnez vos catégories préférées pour être informé des nouveaux équipements
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <p>Chargement des catégories...</p>
        </div>
      )}
      
      {error && (
        <div className="flex justify-center py-8">
          <p className="text-red-500">Erreur: {error}</p>
        </div>
      )}

      {!loading && !error && categories.length === 0 && (
        <div className="flex justify-center py-8">
          <p>Aucune catégorie disponible</p>
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const favorite = isFavorite(category.id);
            return (
              <Card 
                key={category.id} 
                className={`cursor-pointer transition-all ${favorite ? 'border-primary' : ''}`}
                onClick={() => favorite ? handleRemoveFavorite(category) : handleAddFavorite(category)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="flex items-center">
                      {favorite ? (
                        <HeartFilled className="h-5 w-5 text-red-500" />
                      ) : (
                        <Heart className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <Badge variant={favorite ? "default" : "outline"}>
                    {favorite ? 'Favori' : 'Ajouter aux favoris'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoryWishlist;