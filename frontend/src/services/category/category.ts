import { Category } from "../../interfaces/Category.interface";
import { API_URL_CATEGORIES } from "@/constants/api.ts";
import { api } from "@/lib/api.ts";
import { getToken } from "@/utils/getToken.ts";
import * as Sentry from "@sentry/react";

export class CategoryService {
    public async getAllCategories(): Promise<Category[]> {
        const token = getToken();
        try {
            const data = await api<Category[]>(
                API_URL_CATEGORIES,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                },
                import.meta.env.VITE_API_URL || ""
            );

            if (!data) {
                throw new Error("Réponse invalide du serveur : catégories manquantes.");
            }

            return data;
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    service: 'CategoryService',
                    method: 'getAllCategories',
                    endpoint: API_URL_CATEGORIES
                },
                extra: {
                    apiUrl: import.meta.env.VITE_API_URL || ""
                }
            });
            
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error("Une erreur inconnue est survenue.");
            }
        }
    }
}
