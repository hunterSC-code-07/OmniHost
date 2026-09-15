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
  cacheSizes: { minecraft: number, dayzBase: number, dayzWorkshop: number, satisfactoryBase: number };
  gameCacheStatus: Record<string, boolean>;
  playBootSound: boolean;
  useCustomBootSound: boolean;
  bootSoundVolume: number;
  
  setActiveGameHub: (hub: string | null) => void;
  setLastGameHub: (hub: string | null) => void;
  setHoveredGame: (game: string | null) => void;
  setTunnelStatus: (status: string) => void;
  setTunnelIp: (ip: string) => void;
  setTempTunnelIp: (ip: string) => void;
  setRadminIp: (ip: string) => void;
  setIsClearingCache: (isClearing: boolean) => void;
  setCacheSizes: (sizes: { minecraft: number, dayzBase: number, dayzWorkshop: number, satisfactoryBase: number }) => void;
  setGameCacheStatus: (game: string, isCached: boolean) => void;
  setPlayBootSound: (play: boolean) => void;
  setUseCustomBootSound: (use: boolean) => void;
  setBootSoundVolume: (volume: number) => void;
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
  cacheSizes: { minecraft: 0, dayzBase: 0, dayzWorkshop: 0, satisfactoryBase: 0 },
  gameCacheStatus: {},
  playBootSound: localStorage.getItem('playBootSound') !== 'false',
  useCustomBootSound: localStorage.getItem('useCustomBootSound') === 'true',
  bootSoundVolume: localStorage.getItem('bootSoundVolume') ? Number(localStorage.getItem('bootSoundVolume')) : 0.5,
  
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
  setCacheSizes: (sizes) => set({ cacheSizes: sizes }),
  setGameCacheStatus: (game, isCached) => set((state) => ({ 
    gameCacheStatus: { ...state.gameCacheStatus, [game]: isCached } 
  })),
  setPlayBootSound: (play) => {
    localStorage.setItem('playBootSound', String(play));
    set({ playBootSound: play });
  },
  setUseCustomBootSound: (use) => {
    localStorage.setItem('useCustomBootSound', String(use));
    set({ useCustomBootSound: use });
  },
  setBootSoundVolume: (volume) => {
    localStorage.setItem('bootSoundVolume', String(volume));
    set({ bootSoundVolume: volume });
  }
}));
