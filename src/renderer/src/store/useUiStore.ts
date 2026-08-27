import { create } from 'zustand';

interface UiStore {
  activeGameHub: string | null;
  lastGameHub: string | null;
  hoveredGame: string | null;
  tunnelStatus: string;
  tunnelIp: string;
  tempTunnelIp: string;
  radminIp: string;
  isClearingCache: boolean;
  cacheSize: number;
  gameCacheStatus: Record<string, boolean>;
  
  setActiveGameHub: (hub: string | null) => void;
  setLastGameHub: (hub: string | null) => void;
  setHoveredGame: (game: string | null) => void;
  setTunnelStatus: (status: string) => void;
  setTunnelIp: (ip: string) => void;
  setTempTunnelIp: (ip: string) => void;
  setRadminIp: (ip: string) => void;
  setIsClearingCache: (isClearing: boolean) => void;
  setCacheSize: (size: number) => void;
  setGameCacheStatus: (game: string, isCached: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  activeGameHub: null,
  lastGameHub: null,
  hoveredGame: null,
  tunnelStatus: 'Offline',
  tunnelIp: localStorage.getItem('tunnelIp') || '34.131.235.17',
  tempTunnelIp: '',
  radminIp: '',
  isClearingCache: false,
  cacheSize: 0,
  gameCacheStatus: {},
  
  setActiveGameHub: (hub) => set(() => {
    if (hub) return { activeGameHub: hub, lastGameHub: hub };
    return { activeGameHub: hub };
  }),
  setLastGameHub: (hub) => set({ lastGameHub: hub }),
  setHoveredGame: (game) => set({ hoveredGame: game }),
  setTunnelStatus: (status) => set({ tunnelStatus: status }),
  setTunnelIp: (ip) => {
    localStorage.setItem('tunnelIp', ip);
    set({ tunnelIp: ip });
  },
  setTempTunnelIp: (ip) => set({ tempTunnelIp: ip }),
  setRadminIp: (ip) => set({ radminIp: ip }),
  setIsClearingCache: (isClearing) => set({ isClearingCache: isClearing }),
  setCacheSize: (size) => set({ cacheSize: size }),
  setGameCacheStatus: (game, isCached) => set((state) => ({ 
    gameCacheStatus: { ...state.gameCacheStatus, [game]: isCached } 
  }))
}));
