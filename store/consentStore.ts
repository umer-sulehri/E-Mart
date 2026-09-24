'use client';

import { create } from 'zustand';

type ConsentUIState = {
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
};

export const useConsentUI = create<ConsentUIState>((set) => ({
  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));