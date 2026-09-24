// ==============================================================================
// OceanSense — Authentication Zustand Store
// Demonstrates: Week 8 State Architecture & Token Persistence
// ==============================================================================

import { create } from 'zustand';

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'OPERATIONS_MANAGER' 
  | 'MARINE_ENGINEER' 
  | 'ANALYST' 
  | 'VIEWER' 
  | 'SUBSCRIBER';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: UserRole[];
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isLoginModalOpen: boolean;
  _didLogout: boolean; // Tracks intentional logout to prevent auto-re-login

  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setLoginModalOpen: (open: boolean) => void;
  login: (email: string, passwordPlain: string) => Promise<boolean>;
  quickLogin: (email: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('oceansense_token'),
  user: null,
  isLoading: false,
  error: null,
  isLoginModalOpen: false,
  _didLogout: false,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('oceansense_token', token);
    } else {
      localStorage.removeItem('oceansense_token');
    }
    set({ token });
  },

  setUser: (user) => set({ user }),
  setLoginModalOpen: (open) => set({ isLoginModalOpen: open }),

  login: async (email: string, passwordPlain: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordPlain }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      get().setToken(data.data.token);
      // Reset _didLogout so future checkAuth works correctly after fresh login
      set({ user: data.data.user, isLoading: false, isLoginModalOpen: false, _didLogout: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  quickLogin: async (email: string) => {
    return get().login(email, 'Password123!');
  },

  logout: () => {
    get().setToken(null);
    // Mark as intentional logout so checkAuth will NOT auto-re-login
    set({ user: null, isLoginModalOpen: true, _didLogout: true });
  },

  checkAuth: async () => {
    // If user intentionally logged out, respect that — show login modal instead of auto-re-logging in
    if (get()._didLogout) {
      set({ isLoginModalOpen: true });
      return;
    }

    const token = get().token;
    if (!token) {
      // Auto-initialize with default operator session for zero-friction first-time access
      await get().quickLogin('operator@oceansense.io');
      return;
    }

    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.data, isLoading: false });
      } else {
        // Token was invalid or expired: gracefully re-authenticate with default operator
        console.warn('[Auth] Token expired or invalid, auto-renewing default session...');
        await get().quickLogin('operator@oceansense.io');
      }
    } catch (e) {
      // Offline fallback: set default operator user in-memory
      console.warn('[Auth] Auth check offline fallback activated');
      await get().quickLogin('operator@oceansense.io');
    }
  },
}));
