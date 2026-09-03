// ============================================================
// OneFlesh — Auth Zustand Store
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPublic, UserRole } from '@oneflesh/shared';

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: UserPublic, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isLoading: false }),

      setAccessToken: (token) => set({ accessToken: token }),

      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'oneflesh-auth',
      // Only persist user info, not the access token (short-lived)
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useUserRole = (): UserRole | null =>
  useAuthStore((s) => s.user?.role ?? null) as UserRole | null;
