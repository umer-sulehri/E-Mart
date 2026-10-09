import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { AUTH_STORAGE_KEY, purgeIdentityStorage } from '@/lib/storage-keys';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: user !== null }),

      setLoading: (isLoading) => set({ isLoading }),

      login: (user) =>
        set({ user, isAuthenticated: true, isLoading: false }),

      logout: () => {
        set({ user: null, isAuthenticated: false, isLoading: false });
        // `set` makes the persist middleware write the cleared state, so the
        // key has to be dropped afterwards — otherwise the (null) record and
        // the previous user's review drafts survive sign-out.
        purgeIdentityStorage();
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        // Persist only what the header, sidebars and dashboards render. Phone
        // and date of birth are read from /api/v1/auth/me on demand, so there
        // is no reason to leave extra PII sitting in local storage.
        user: state.user
          ? {
              ...state.user,
              phone: undefined,
              dateOfBirth: undefined,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
