import { create } from 'zustand';

interface SteamCredentialsStore {
  steamCreds: { username: string; password?: string; steamGuard?: string };
  rememberMe: boolean;
  showCreds: boolean;
  setSteamCreds: (creds: { username: string; password?: string; steamGuard?: string }) => void;
  setRememberMe: (remember: boolean) => void;
  setShowCreds: (show: boolean) => void;
  saveCredentials: (onSuccess: () => void, onError: (msg: string) => void) => void;
}

export const useSteamCredentialsStore = create<SteamCredentialsStore>((set, get) => ({
  steamCreds: (() => {
    try {
      const saved = localStorage.getItem('omnihost_steam_creds');
      if (saved) return JSON.parse(atob(saved));
      return { 
        username: import.meta.env.VITE_STEAM_USERNAME || '',
        password: import.meta.env.VITE_STEAM_PASSWORD || ''
      };
    } catch {
      return { 
        username: import.meta.env.VITE_STEAM_USERNAME || '',
        password: import.meta.env.VITE_STEAM_PASSWORD || ''
      };
    }
  })(),
  rememberMe: !!localStorage.getItem('omnihost_steam_creds'),
  showCreds: false,
  setSteamCreds: (creds) => set({ steamCreds: creds }),
  setRememberMe: (remember) => set({ rememberMe: remember }),
  setShowCreds: (show) => set({ showCreds: show }),
  saveCredentials: (onSuccess, onError) => {
    const state = get();
    if (state.steamCreds.username) {
      if (state.rememberMe) {
        localStorage.setItem(
          'omnihost_steam_creds',
          btoa(JSON.stringify({ 
            username: state.steamCreds.username,
            password: state.steamCreds.password
          }))
        );
      } else {
        localStorage.removeItem('omnihost_steam_creds');
      }
      onSuccess();
    } else {
      onError('Username is required.');
    }
  }
}));
