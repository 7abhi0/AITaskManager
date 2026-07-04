import { create } from 'zustand';
import api from '../utils/api';
import { IUser } from '../shared/types';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isInitializing: true,

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Login failed.');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Registration failed.');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isInitializing: false });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const { user } = response.data.data;
      set({ user, token, isAuthenticated: true, isInitializing: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
    }
  },
}));
