import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Equipment } from "@/interfaces/Equipment.interface";
import { EquipmentService } from "@/services/equipment/equipment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Sidebar from "@/components/sidebar/Sidebar";
import { toast } from "sonner";
import ConfirmationModal from "@/components/modal/ConfirmationModal";

function MyEquipments() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<number | null>(null);
    const navigate = useNavigate();
    const equipmentService = new EquipmentService();

    const fetchUserEquipments = async () => {
        try {
            setLoading(true);
            const data = await equipmentService.getUserEquipments();
            setEquipments(data);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserEquipments();
    }, []);

    const handleAddEquipment = () => {
        navigate("/equipment");
    };

    const handleEditEquipment = (id: number) => {
        navigate(`/edit-equipment/${id}`);
    };

    const handleDeleteEquipment = (id: number) => {
        setEquipmentToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteEquipment = async () => {
        if (equipmentToDelete) {
            try {
                await equipmentService.deleteEquipment(equipmentToDelete);
                toast.success("Équipement supprimé avec succès");
                fetchUserEquipments();
            } catch (error) {
                toast.error("Erreur lors de la suppression de l'équipement");
                console.error(error);
            }
        }
        setIsDeleteModalOpen(false);
        setEquipmentToDelete(null);
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-destructive text-center">
                    <h2 className="text-2xl font-bold mb-2">Erreur</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <div className="container mx-auto px-4 py-8">
                {loading && (
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                )}

                {!loading && (
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Mes Équipements</h1>
                        <Button onClick={handleAddEquipment} className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter un équipement
                        </Button>
                    </div>
                )}

                {equipments.length !== 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {equipments.map((equipment) => (
                            <Card key={equipment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-video bg-muted relative overflow-hidden">
                                    {equipment.images && equipment.images.length > 0 ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}${equipment.images[0].content}`}
                                            alt={equipment.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-12 w-12 mb-2 opacity-20"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <p className="text-sm">Aucune image</p>
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-4">
                                    <Link to={`/equipment/${equipment.id}`} className="hover:underline">
                                        <h3 className="text-xl font-semibold mb-2 line-clamp-1">{equipment.name}</h3>
                                    </Link>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {equipment.categories.map((category) => (
                                            <Badge key={category.id} variant="secondary" className="font-medium">
                                                {category.name}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="flex items-center text-muted-foreground mb-2">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        <span className="text-sm">{equipment.city}</span>
                                    </div>

                                    <p className="text-xl font-bold text-primary">
                                        {equipment.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                                    </p>
                                </CardContent>

                                <CardFooter className="p-4 pt-0 flex justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditEquipment(equipment.id)}
                                    >
                                        <Pencil className="h-4 w-4 mr-1" /> Modifier
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteEquipment(equipment.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {equipments.length === 0 && !loading && (
                    <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
                        <div className="mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto text-muted-foreground/50"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M20 7l-8-4-8 4m16 0l-8 4m-8-4l8 4m8 4l-8 4m8-4l-8-4m-8 4l8-4"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Aucun équipement</h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Vous n'avez pas encore d'équipements listés. Commencez par ajouter votre premier équipement.
                        </p>
                        <Button onClick={handleAddEquipment} className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter un équipement
                        </Button>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteEquipment}
                title="Confirmer la suppression"
                message="Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="danger"
            />
        </div>
    );
}

export default MyEquipments;
