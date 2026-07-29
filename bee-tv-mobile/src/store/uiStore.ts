import { create } from 'zustand';

interface UIState {
  splashActive: boolean;
  setSplashActive: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  splashActive: true,
  setSplashActive: (v) => set({ splashActive: v }),
}));
