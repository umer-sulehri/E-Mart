import { create } from 'zustand';

interface UIState {
  isMobileMenuOpen: boolean;
  isCartOpen: boolean;
  isSearchOpen: boolean;
  searchQuery: string;

  toggleMobileMenu: () => void;
  toggleCart: () => void;
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;
  closeAll: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isMobileMenuOpen: false,
  isCartOpen: false,
  isSearchOpen: false,
  searchQuery: '',

  toggleMobileMenu: () =>
    set((state) => ({
      isMobileMenuOpen: !state.isMobileMenuOpen,
      isCartOpen: false,
      isSearchOpen: false,
    })),

  toggleCart: () =>
    set((state) => ({
      isCartOpen: !state.isCartOpen,
      isMobileMenuOpen: false,
      isSearchOpen: false,
    })),

  toggleSearch: () =>
    set((state) => ({
      isSearchOpen: !state.isSearchOpen,
      isMobileMenuOpen: false,
      isCartOpen: false,
    })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  closeAll: () =>
    set({
      isMobileMenuOpen: false,
      isCartOpen: false,
      isSearchOpen: false,
    }),
}));
