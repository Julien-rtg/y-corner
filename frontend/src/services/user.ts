import { api } from '@/lib/api';
import { getToken } from '@/utils/getToken';
import { User } from '@/interfaces/User.interface';

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
}

const userService = new UserService();
export default userService;
