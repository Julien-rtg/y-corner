import { Equipment } from "../interfaces/Equipment.interface";
import { API_URL_CREATE_EQUIPMENT, API_URL_EQUIPMENT, API_URL_EQUIPMENTS, API_URL_USER_EQUIPMENTS } from "@/constants/api.ts";
import { api } from "@/lib/api.ts";
import { getToken, getUser } from "@/utils/getToken.ts";

export class EquipmentService {
    public async getAllEquipment(): Promise<Equipment[]> {
        const token = getToken();
        try {
            const data = await api<Equipment[]>(
                API_URL_EQUIPMENTS,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                },
                import.meta.env.VITE_API_URL || ""
            );

            if (!data) {
                throw new Error("Réponse invalide du serveur : equipments manquant.");
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error("Une erreur inconnue est survenue.");
            }
        }
    }

    public async getEquipment(id: string): Promise<Equipment> {
        const token = getToken();

        try {
            const endpoint = API_URL_EQUIPMENT.replace("{id}", id);

            const data = await api<Equipment>(
                endpoint,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                },
                import.meta.env.VITE_API_URL || ""
            );

            if (!data) {
                throw new Error("Réponse invalide du serveur : equipment manquant.");
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error("Une erreur inconnue est survenue.");
            }
        }
    }

    public async getUserEquipments(): Promise<Equipment[]> {
        const token = getToken();
        try {
            const data = await api<Equipment[]>(
                API_URL_USER_EQUIPMENTS,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                },
                import.meta.env.VITE_API_URL || ""
            );

            if (!data) {
                throw new Error("Réponse invalide du serveur : équipements utilisateur manquants.");
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error("Une erreur inconnue est survenue.");
            }
        }
    }

    public async deleteEquipment(id: number): Promise<void> {
        const token = getToken();
        try {
            const endpoint = API_URL_EQUIPMENT.replace("{id}", id.toString());
            await api<void>(
                endpoint,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                },
                import.meta.env.VITE_API_URL || ""
            );
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error("Une erreur inconnue est survenue.");
            }
        }
    }

    public async createEquipment(equipmentData: {
        name: string;
        price: number;
        description: string;
        city: string;
        categories: any[];
        images: any[];
    }): Promise<void> {
        const token = getToken();
        const user = getUser();
        
        try {
            await api<void>(
                API_URL_CREATE_EQUIPMENT,
                {
                    method: "POST",
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify([{
                        name: equipmentData.name,
                        price: equipmentData.price,
                        description: equipmentData.description,
                        city: equipmentData.city,
                        categories: equipmentData.categories.map(category => ({
                            id: category.id,
                            name: category.name
                        })),
                        image: equipmentData.images[0].content,
                        user_id: user?.id
                    }])
                },
                import.meta.env.VITE_API_URL || ""
            );
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error("Une erreur inconnue est survenue lors de la création de l'équipement.");
            }
        }
    }

    public async updateEquipment(id: number, equipmentData: {
        name: string;
        price: number;
        description: string;
        city: string;
        categories: any[];
        images: any[];
    }): Promise<void> {
        const token = getToken();
        try {
            const endpoint = API_URL_EQUIPMENT.replace("{id}", id.toString());
            await api<void>(
                endpoint,
                {
                    method: "PUT",
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(equipmentData)
                },
                import.meta.env.VITE_API_URL || ""
            );
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error("Une erreur inconnue est survenue lors de la mise à jour de l'équipement.");
            }
        }
    }
}