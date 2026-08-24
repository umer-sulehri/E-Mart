import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';

type UserMode = 'buyer' | 'seller' | 'admin';
interface AuthStore {
  user: User | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  currentMode: UserMode;
  /** True once the persisted state has been restored from localStorage. */
  hydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  switchMode: (mode: UserMode) => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      isAuthenticated: false,
      currentMode: 'buyer',
      hydrated: false,

      login: (user, token) =>
        set({
          user,
          sessionToken: token,
          isAuthenticated: true,
          currentMode: user.role === 'seller' ? 'seller' : user.role === 'admin' ? 'admin' : 'buyer',
        }),

      logout: () =>
        set({
          user: null,
          sessionToken: null,
          isAuthenticated: false,
          currentMode: 'buyer',
        }),

      switchMode: (mode) => set({ currentMode: mode }),

      setUser: (user) => set({ user }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'emart-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
