import { api } from '@/lib/api';
import { getToken, getUser } from '@/utils/getToken';
import { User } from '@/interfaces/User.interface';
import { Equipment } from '@/interfaces/Equipment.interface';
import { Category } from '@/interfaces/Category.interface';
import { 
  API_URL_USER_FAVORITES, 
  API_URL_USER_FAVORITE_EQUIPMENT,
  API_URL_USER_FAVORITE_CATEGORIES,
  API_URL_USER_FAVORITE_CATEGORY
} from '@/constants/api';

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: number;
  birthDate?: string;
  password?: string;
}

export class UserService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || '';
  }

  async getUserDetails(userId: number): Promise<User> {
    try {
      const endpoint = `/api/users/${userId}`;
      const token = getToken();

      const data = await api<User>(
        endpoint,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        },
        this.apiUrl
      );

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails utilisateur:', error);
      throw error;
    }
  }

  async updateUser(userId: number, userData: UserUpdateData): Promise<User> {
    try {
      const endpoint = `/api/users/${userId}`;
      const token = getToken();

      const data = await api<User>(
        endpoint,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(userData),
        },
        this.apiUrl
      );

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      const endpoint = `/api/users/${userId}`;
      const token = getToken();

      await api<void>(
        endpoint,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
        this.apiUrl
      );
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  async getFavorites(): Promise<Equipment[]> {
    try {
      const currentUser = getUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Utilisateur non connecté');
      }

      const endpoint = API_URL_USER_FAVORITES.replace('{id}', currentUser.id.toString());
      const token = getToken();

      const data = await api<Equipment[]>(
        endpoint,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        },
        this.apiUrl
      );

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      throw error;
    }
  }

  async addFavorite(equipmentId: number): Promise<void> {
    try {
      const currentUser = getUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Utilisateur non connecté');
      }

      const endpoint = API_URL_USER_FAVORITE_EQUIPMENT
        .replace('{id}', currentUser.id.toString())
        .replace('{equipmentId}', equipmentId.toString());
      const token = getToken();

      await api<void>(
        endpoint,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ equipmentId }),
        },
        this.apiUrl
      );
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      throw error;
    }
  }

  async removeFavorite(equipmentId: number): Promise<void> {
    try {
      const currentUser = getUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Utilisateur non connecté');
      }

      const endpoint = API_URL_USER_FAVORITE_EQUIPMENT
        .replace('{id}', currentUser.id.toString())
        .replace('{equipmentId}', equipmentId.toString());
      const token = getToken();

      await api<void>(
        endpoint,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
        this.apiUrl
      );
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      throw error;
    }
  }

  async getFavoriteCategories(): Promise<Category[]> {
    try {
      const currentUser = getUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Utilisateur non connecté');
      }

      const endpoint = API_URL_USER_FAVORITE_CATEGORIES.replace('{id}', currentUser.id.toString());
      const token = getToken();

      const data = await api<Category[]>(
        endpoint,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        },
        this.apiUrl
      );

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories favorites:', error);
      throw error;
    }
  }

  async addFavoriteCategory(categoryId: number): Promise<void> {
    try {
      const currentUser = getUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Utilisateur non connecté');
      }

      const endpoint = API_URL_USER_FAVORITE_CATEGORY
        .replace('{id}', currentUser.id.toString())
        .replace('{categoryId}', categoryId.toString());
      const token = getToken();

      await api<void>(
        endpoint,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
        },
        this.apiUrl
      );
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie aux favoris:', error);
      throw error;
    }
  }

  async removeFavoriteCategory(categoryId: number): Promise<void> {
    try {
      const currentUser = getUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Utilisateur non connecté');
      }

      const endpoint = API_URL_USER_FAVORITE_CATEGORY
        .replace('{id}', currentUser.id.toString())
        .replace('{categoryId}', categoryId.toString());
      const token = getToken();

      await api<void>(
        endpoint,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
        this.apiUrl
      );
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie des favoris:', error);
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;
