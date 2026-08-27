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
      return saved ? JSON.parse(atob(saved)) : { username: '' };
    } catch {
      return { username: '' };
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
          btoa(JSON.stringify({ username: state.steamCreds.username }))
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
