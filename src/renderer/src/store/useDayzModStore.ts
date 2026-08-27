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
  installedMods: Record<number, any[]>;
  installedModsLoading: Record<number, boolean>;
  addPendingDownload: (serverId: number, mod: any) => void;
  removePendingDownload: (serverId: number, modId: string) => void;
  updatePendingProgress: (serverId: number, modId: string, progress: number, msg: string) => void;
  clearPendingDownloads: (serverId: number) => void;
  loadInstalledMods: (serverId: number) => Promise<void>;
  setInstalledMods: (serverId: number, mods: any[]) => void;
  setInstalledModsLoading: (serverId: number, loading: boolean) => void;
}

export const useDayzModStore = create<DayzModStore>()(
  persist(
    (set) => ({
      pendingDownloads: {},
      installedMods: {},
      installedModsLoading: {},
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
      setInstalledMods: (serverId, mods) => set((state) => ({
        installedMods: { ...state.installedMods, [serverId]: mods }
      })),
      setInstalledModsLoading: (serverId, loading) => set((state) => ({
        installedModsLoading: { ...state.installedModsLoading, [serverId]: loading }
      })),
      loadInstalledMods: async (serverId) => {
        set((state) => ({
          installedModsLoading: { ...state.installedModsLoading, [serverId]: true }
        }));
        try {
          const basicMods = await window.api.dayz.getInstalledMods(serverId);
          const workshopIds = basicMods
            .filter((m: any) => m.id && /^\d+$/.test(m.id) && String(m.id) !== '0')
            .map((m: any) => m.id);

          let detailedMods: any[] = [];
          if (workshopIds.length > 0) {
            detailedMods = await window.api.steam.getWorkshopItemDetails(workshopIds);
          }

          const mergedMods = basicMods.map((basicMod: any) => {
            const detail = detailedMods.find((d: any) => d.publishedfileid === basicMod.id);
            if (detail) {
              return {
                ...basicMod,
                title: detail.title || basicMod.title,
                preview_url: detail.preview_url,
                file_size: detail.file_size,
                tags: detail.tags,
                description: detail.description
              };
            }
            return basicMod;
          }).sort((a: any, b: any) => {
            if (a.isDisabled === b.isDisabled) {
              return (a.title || a.folderName || '').localeCompare(b.title || b.folderName || '', undefined, { sensitivity: 'base' });
            }
            return a.isDisabled ? 1 : -1;
          });

          set((state) => ({
            installedMods: { ...state.installedMods, [serverId]: mergedMods }
          }));
        } catch (e) {
          console.error(e);
        } finally {
          set((state) => ({
            installedModsLoading: { ...state.installedModsLoading, [serverId]: false }
          }));
        }
      }
    }),
    {
      name: 'dayz-pending-downloads', // Unique name for sessionStorage key
      storage: createJSONStorage(() => sessionStorage), // We use sessionStorage to clear on window close
    }
  )
);
