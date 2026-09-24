// ==============================================================================
// OceanSense — Theme Store (Tactical Dark & Bridge Light Daylight Mode)
// Demonstrates: Modern Theme Switching & User Preference Persistence
// ==============================================================================

import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'grayish';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('oceansense_theme');
  if (saved === 'light' || saved === 'dark' || saved === 'grayish') return saved;
  return 'dark'; // Default tactical naval dark console
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  document.documentElement.setAttribute('data-theme', initial);

  return {
    theme: initial,
    setTheme: (theme: ThemeMode) => {
      localStorage.setItem('oceansense_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      set({ theme });
    },
    toggleTheme: () => {
      const current = get().theme;
      let next: ThemeMode = 'light';
      if (current === 'light') next = 'grayish';
      else if (current === 'grayish') next = 'dark';
      else next = 'light';

      localStorage.setItem('oceansense_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      set({ theme: next });
    },
  };
});
