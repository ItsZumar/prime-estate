import { create } from 'zustand';
import { api } from './api';
import { saveAuth, logout as clearAuth, getUser, getToken } from './auth';
import type { AuthUser } from './auth';

type AuthResponse = { access_token: string; user: AuthUser };

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
};

type AuthActions = {
  hydrate: () => void;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: 'user' | 'admin') => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  token: null,
  status: 'idle',
  error: null,

  hydrate() {
    set({ user: getUser(), token: getToken() });
  },

  clearError() {
    set({ status: 'idle', error: null });
  },

  async signIn(email, password) {
    set({ status: 'loading', error: null });
    try {
      const { access_token, user } = await api.post<AuthResponse>('/auth/login', { email, password });
      saveAuth(access_token, user);
      set({ user, token: access_token, status: 'idle' });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Something went wrong';
      set({ status: 'error', error });
      throw err;
    }
  },

  async signUp(name, email, password, role) {
    set({ status: 'loading', error: null });
    try {
      const { access_token, user } = await api.post<AuthResponse>('/auth/register', { name, email, password, role });
      saveAuth(access_token, user);
      set({ user, token: access_token, status: 'idle' });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Something went wrong';
      set({ status: 'error', error });
      throw err;
    }
  },

  logout() {
    clearAuth();
    set({ user: null, token: null, status: 'idle', error: null });
  },
}));
