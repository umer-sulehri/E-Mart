import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiStore {
  locale: 'en' | 'ur';
  highContrast: boolean;
  cartOpen: boolean;
  voiceSearchOpen: boolean;
  setLocale: (locale: 'en' | 'ur') => void;
  toggleHighContrast: () => void;
  setCartOpen: (open: boolean) => void;
  setVoiceSearchOpen: (open: boolean) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      locale: 'en',
      highContrast: false,
      cartOpen: false,
      voiceSearchOpen: false,
      setLocale: (locale) => set({ locale }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setVoiceSearchOpen: (voiceSearchOpen) => set({ voiceSearchOpen }),
    }),
    { name: 'emart-ui', skipHydration: true }
  )
);
