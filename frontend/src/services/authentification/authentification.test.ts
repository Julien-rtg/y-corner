import { AuthentificationService } from './authentification';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeAll(() => {
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { href: '' };
});


const API_URL = 'http://localhost:8000';



describe('AuthentificationService', () => {
  let authService: AuthentificationService;
  
  beforeEach(() => {
    authService = new AuthentificationService(API_URL);
    localStorageMock.clear();
    window.location.href = '';
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store user data in localStorage', async () => {
      const email = 'testuser@example.com';
      const password = 'password123';
      const mockResponse = {
        data: {
          token: 'fake-token-123',
          refresh_token: 'fake-refresh-token-123',
          user: { id: 1, email: 'testuser@example.com', firstName: 'Test', lastName: 'User' }
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await authService.login(email, password);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/login_check`,
        { email, password }
      );
      expect(result).toBe(true);
      expect(localStorage.getItem('token')).toBe('fake-token-123');
      expect(localStorage.getItem('refresh_token')).toBe('fake-refresh-token-123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.data.user));
    });

    it('should throw an error when login fails', async () => {
      const email = 'testuser@example.com';
      const password = 'wrong-password';
      const errorResponse = new Error('Request failed');
      
      mockedAxios.post.mockRejectedValueOnce(errorResponse);
      
      await expect(authService.login(email, password)).rejects.toThrow();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/login_check',
        { email, password }
      );
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        birthDate: '1990-01-01',
        address: '123 Test Street',
        city: 'Test City',
        country: 'France',
        postalCode: '75000'
      };
      
      const mockResponse = {
        data: { success: true }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await authService.register(userData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/register`,
        userData
      );
      expect(result).toEqual(mockResponse);
    });

    it('should use default country if not provided', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        birthDate: '1990-01-01',
        address: '123 Test Street',
        city: 'Test City',
        country: '',
        postalCode: '75000'
      };
      
      const mockResponse = {
        data: { success: true }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      await authService.register(userData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/register`,
        { ...userData, country: 'France' }
      );
    });

    it('should throw an error when registration fails', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        birthDate: '1990-01-01',
        address: '123 Test Street',
        city: 'Test City',
        country: 'France',
        postalCode: '75000'
      };
      
      const errorResponse = new Error('Request failed');
      
      mockedAxios.post.mockRejectedValueOnce(errorResponse);
      
      await expect(authService.register(userData)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should clear localStorage and redirect to login page', () => {      
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('refresh_token', 'fake-refresh-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      
      authService.logout();
      
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem('refresh_token', 'old-refresh-token');
      
      const mockResponse = {
        data: {
          token: 'new-token',
          refresh_token: 'new-refresh-token'
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
          const result = await authService.refresh();
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/token/refresh`,
        { refresh_token: 'old-refresh-token' }
      );
      expect(result).toBe(true);
      expect(localStorage.getItem('token')).toBe('new-token');
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
    });

    it('should return false when token is not available', async () => {
      localStorage.removeItem('token');
      
      const result = await authService.refresh();
      
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw an error when refresh fails', async () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem('refresh_token', 'old-refresh-token');
      
      const errorResponse = new Error('Request failed');
      
      mockedAxios.post.mockRejectedValueOnce(errorResponse);
      
      await expect(authService.refresh()).rejects.toThrow();
    });
  });
});
