import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Category } from '@/interfaces/Category.interface';
import { Image as ImageInterface } from '@/interfaces/Image.interface';
import { EquipmentService } from '@/services/equipment/equipment';
import { CategoryService } from '@/services/category/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, X, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';

interface EquipmentFormData {
  name: string;
  price: number;
  description: string;
  city: string;
  categories: Category[];
  images: ImageInterface[];
}

function Equipment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const equipmentService = new EquipmentService();
  const categoryService = new CategoryService();
  const isEditMode = !!id;

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    price: 0,
    description: '',
    city: '',
    categories: [],
    images: []
  });
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    
    if (isEditMode) {
      fetchEquipment();
    }
  }, [id]);
  
  const fetchCategories = async () => {
    try {
      const categories = await categoryService.getAllCategories();
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      toast.error('Impossible de charger les catégories');
    }
  };

  const fetchEquipment = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const equipment = await equipmentService.getEquipment(id);
      setFormData({
        name: equipment.name,
        price: equipment.price,
        description: equipment.description || '',
        city: equipment.city,
        categories: equipment.categories,
        images: equipment.images
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'équipement:', error);
      toast.error('Impossible de charger les détails de l\'équipement');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddCategory = () => {
    if (showNewCategoryInput) {
      if (!newCategory.trim()) return;
      
      const categoryExists = availableCategories.some(
        category => category.name.toLowerCase() === newCategory.trim().toLowerCase()
      );
      
      if (categoryExists) {
        toast.error('Cette catégorie existe déjà');
        return;
      }
      
      const newCategoryObj: Category = {
        id: -Date.now(),
        name: newCategory.trim()
      };
      
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategoryObj]
      }));
      
      setNewCategory('');
      setShowNewCategoryInput(false);
    } else {
      if (!selectedCategoryId) return;
      
      const categoryId = Number(selectedCategoryId);
      const selectedCategory = availableCategories.find(cat => cat.id === categoryId);
      
      if (!selectedCategory) return;
      
      const categoryExists = formData.categories.some(category => category.id === categoryId);
      
      if (!categoryExists) {
        setFormData(prev => ({
          ...prev,
          categories: [...prev.categories, selectedCategory]
        }));
      }
      
      setSelectedCategoryId('');
    }
  };
  
  const toggleNewCategoryInput = () => {
    setShowNewCategoryInput(!showNewCategoryInput);
    setSelectedCategoryId('');
    setNewCategory('');
  };

  const handleRemoveCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category.id !== categoryId)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImage = () => {
    if (!imagePreview) return;

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { id: Date.now(), content: imagePreview }]
    }));
    
    setImagePreview(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveImage = (imageId: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(image => image.id !== imageId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || formData.price <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.categories.length === 0) {
      toast.error('Veuillez ajouter au moins une catégorie');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Veuillez ajouter au moins une image');
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        const equipmentService = new EquipmentService();
        await equipmentService.updateEquipment(parseInt(id!), {
          name: formData.name,
          price: formData.price,
          description: formData.description,
          city: formData.city,
          categories: formData.categories,
          images: formData.images
        });
        toast.success('Équipement mis à jour avec succès');
      } else {
        const equipmentService = new EquipmentService();
        await equipmentService.createEquipment({
          name: formData.name,
          price: formData.price,
          description: formData.description,
          city: formData.city,
          categories: formData.categories,
          images: formData.images
        });
        toast.success('Équipement créé avec succès');
      }
      
      navigate('/my-equipments');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          {isEditMode ? 'Modifier l\'équipement' : 'Ajouter un équipement'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations de base */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Informations de base</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom de l'équipement *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Ballon de football"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Prix (€) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Ex: 29.99"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Ex: Paris"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Décrivez votre équipement..."
                      rows={5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Catégories et Images */}
            <div className="space-y-6">
              {/* Catégories */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Catégories *</h2>
                  
                  <div className="flex flex-col space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      {showNewCategoryInput ? (
                        <Input
                          id="newCategory"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Nom de la nouvelle catégorie"
                          className="bg-white"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                        />
                      ) : (
                        <select
                          id="category"
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value as number | '')}
                          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Sélectionner une catégorie</option>
                          {availableCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <Button 
                        type="button" 
                        onClick={handleAddCategory}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Button
                        type="button"
                        onClick={toggleNewCategoryInput}
                        variant="link"
                        className="text-sm p-0 h-auto"
                      >
                        {showNewCategoryInput ? 'Utiliser une catégorie existante' : 'Créer une nouvelle catégorie'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map((category) => (
                      <Badge key={category.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center">
                        {category.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category.id)}
                          className="ml-1 hover:text-destructive focus:outline-none bg-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Images */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Images *</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddImage}
                        variant="outline"
                        disabled={!imagePreview}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {imagePreview && (
                      <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Aperçu" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {formData.images.map((image) => (
                        <div key={image.id} className="relative aspect-video bg-muted rounded-md overflow-hidden">
                          <img 
                            src={`${import.meta.env.VITE_API_URL}${image.content}`} 
                            alt="Équipement" 
                            className="w-full h-full object-cover" 
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(image.id)}
                            className="absolute top-1 right-1 bg-background/80 p-1 rounded-full hover:bg-destructive hover:text-destructive-foreground focus:outline-none"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/my-equipments')}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
              {!saving && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Equipment;