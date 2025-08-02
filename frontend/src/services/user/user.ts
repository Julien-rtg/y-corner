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
import * as Sentry from '@sentry/react';

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
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'getUserDetails',
          endpoint: `/api/users/${userId}`
        },
        extra: {
          userId: userId,
          apiUrl: this.apiUrl
        }
      });
      
      throw error;
    }
  }
  
  async getUserBasicInfo(userId: number): Promise<{ id: number; firstName: string; lastName: string }> {
    try {
      const endpoint = `/api/users/${userId}/basic-info`;
      
      const data = await api<{ id: number; firstName: string; lastName: string }>(
        endpoint,
        {
          method: 'GET',
        },
        this.apiUrl
      );

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations basiques de l\'utilisateur:', error);
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'getUserBasicInfo',
          endpoint: `/api/users/${userId}/basic-info`
        },
        extra: {
          userId: userId,
          apiUrl: this.apiUrl
        }
      });
      
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
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'updateUser',
          endpoint: `/api/users/${userId}`
        },
        extra: {
          userId: userId,
          userData: JSON.stringify({
            hasFirstName: !!userData.firstName,
            hasLastName: !!userData.lastName,
            hasEmail: !!userData.email,
            hasAddress: !!userData.address,
            hasCity: !!userData.city,
            hasCountry: !!userData.country,
            hasPostalCode: !!userData.postalCode,
            hasBirthDate: !!userData.birthDate,
            hasPassword: !!userData.password
          }),
          apiUrl: this.apiUrl
        }
      });
      
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
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'deleteUser',
          endpoint: `/api/users/${userId}`
        },
        extra: {
          userId: userId,
          apiUrl: this.apiUrl
        }
      });
      
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
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'getFavorites',
          endpoint: API_URL_USER_FAVORITES
        },
        extra: {
          userId: getUser()?.id,
          apiUrl: this.apiUrl
        }
      });
      
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
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'addFavorite',
          endpoint: API_URL_USER_FAVORITE_EQUIPMENT
        },
        extra: {
          userId: getUser()?.id,
          equipmentId: equipmentId,
          apiUrl: this.apiUrl
        }
      });
      
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
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'removeFavorite',
          endpoint: API_URL_USER_FAVORITE_EQUIPMENT
        },
        extra: {
          userId: getUser()?.id,
          equipmentId: equipmentId,
          apiUrl: this.apiUrl
        }
      });
      
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
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'getFavoriteCategories',
          endpoint: API_URL_USER_FAVORITE_CATEGORIES
        },
        extra: {
          userId: getUser()?.id,
          apiUrl: this.apiUrl
        }
      });
      
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
          body: JSON.stringify({ categoryId }),
        },
        this.apiUrl
      );
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie favorite:', error);
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'addFavoriteCategory',
          endpoint: API_URL_USER_FAVORITE_CATEGORY
        },
        extra: {
          userId: getUser()?.id,
          categoryId: categoryId,
          apiUrl: this.apiUrl
        }
      });
      
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
      
      Sentry.captureException(error, {
        tags: {
          service: 'UserService',
          method: 'removeFavoriteCategory',
          endpoint: API_URL_USER_FAVORITE_CATEGORY
        },
        extra: {
          userId: getUser()?.id,
          categoryId: categoryId,
          apiUrl: this.apiUrl
        }
      });
      
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;
