import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PendingDownload {
  mod: any;
  progress: number;
  msg: string;
}

interface DayzModStore {
  // Keyed by activeServerId, then by modId (or publishedfileid)
  pendingDownloads: Record<number, Record<string, PendingDownload>>;
  addPendingDownload: (serverId: number, mod: any) => void;
  removePendingDownload: (serverId: number, modId: string) => void;
  updatePendingProgress: (serverId: number, modId: string, progress: number, msg: string) => void;
  clearPendingDownloads: (serverId: number) => void;
}

export const useDayzModStore = create<DayzModStore>()(
  persist(
    (set) => ({
      pendingDownloads: {},
      addPendingDownload: (serverId, mod) => set((state) => {
        const serverDownloads = state.pendingDownloads[serverId] || {};
        const modId = mod.id || mod.publishedfileid;
        return {
          pendingDownloads: {
            ...state.pendingDownloads,
            [serverId]: {
              ...serverDownloads,
              [modId]: { mod, progress: 0, msg: 'Starting download...' }
            }
          }
        };
      }),
      removePendingDownload: (serverId, modId) => set((state) => {
        const serverDownloads = state.pendingDownloads[serverId] || {};
        const nextServerDownloads = { ...serverDownloads };
        delete nextServerDownloads[modId];
        return {
          pendingDownloads: {
            ...state.pendingDownloads,
            [serverId]: nextServerDownloads
          }
        };
      }),
      updatePendingProgress: (serverId, modId, progress, msg) => set((state) => {
        const serverDownloads = state.pendingDownloads[serverId] || {};
        if (!serverDownloads[modId]) return state; // Don't update if not pending
        return {
          pendingDownloads: {
            ...state.pendingDownloads,
            [serverId]: {
              ...serverDownloads,
              [modId]: { ...serverDownloads[modId], progress, msg }
            }
          }
        };
      }),
      clearPendingDownloads: (serverId) => set((state) => {
        const next = { ...state.pendingDownloads };
        delete next[serverId];
        return { pendingDownloads: next };
      }),
    }),
    {
      name: 'dayz-pending-downloads', // Unique name for sessionStorage key
      storage: createJSONStorage(() => sessionStorage), // We use sessionStorage to clear on window close
    }
  )
);
