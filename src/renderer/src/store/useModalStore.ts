import { create } from 'zustand';

interface ModalStore {
  // Existing Dashboard Modals
  isCreateServerModalOpen: boolean;
  createServerDefaultType: string | null;
  serverToDeleteId: number | null;
  steamLoginModalConfig: {
    isOpen: boolean;
    action: 'create' | 'cache';
    callback?: (credentials: any) => void;
  };
  
  openCreateServerModal: (defaultType?: string) => void;
  closeCreateServerModal: () => void;
  
  openDeleteModal: (serverId: number) => void;
  closeDeleteModal: () => void;
  
  openSteamLoginModal: (action: 'create' | 'cache', callback?: (credentials: any) => void) => void;
  closeSteamLoginModal: () => void;

  // DayZ Hub Modals
  dayzInfoModal: { isOpen: boolean; message: string };
  openDayzInfoModal: (message: string) => void;
  closeDayzInfoModal: () => void;

  dayzMissingDepsModal: { isOpen: boolean; depDetails: any[]; onConfirm?: (deps: any[]) => void; onCancel?: () => void };
  openDayzMissingDepsModal: (depDetails: any[], onConfirm: (deps: any[]) => void, onCancel?: () => void) => void;
  closeDayzMissingDepsModal: () => void;

  dayzUninstallSingleModal: { isOpen: boolean; modId: string; modName: string; onConfirm?: (modId: string) => void };
  openDayzUninstallSingleModal: (modId: string, modName: string, onConfirm: (modId: string) => void) => void;
  closeDayzUninstallSingleModal: () => void;

  dayzUninstallAllModal: { isOpen: boolean; modsCount: number; onConfirm?: () => void };
  openDayzUninstallAllModal: (modsCount: number, onConfirm: () => void) => void;
  closeDayzUninstallAllModal: () => void;

  dayzRebuildConfirmModal: { isOpen: boolean; onConfirm?: () => void };
  openDayzRebuildConfirmModal: (onConfirm: () => void) => void;
  closeDayzRebuildConfirmModal: () => void;

  dayzRebuildSuccessModal: { isOpen: boolean };
  openDayzRebuildSuccessModal: () => void;
  closeDayzRebuildSuccessModal: () => void;

  dayzDependencyResultModal: { isOpen: boolean; modTitle: string; deps: any[] };
  openDayzDependencyResultModal: (modTitle: string, deps: any[]) => void;
  closeDayzDependencyResultModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  // Existing Dashboard Modals
  isCreateServerModalOpen: false,
  createServerDefaultType: null as string | null,
  serverToDeleteId: null,
  steamLoginModalConfig: {
    isOpen: false,
    action: 'create'
  },

  openCreateServerModal: (defaultType?: string) => set({ isCreateServerModalOpen: true, createServerDefaultType: defaultType || null }),
  closeCreateServerModal: () => set({ isCreateServerModalOpen: false, createServerDefaultType: null }),

  openDeleteModal: (serverId) => set({ serverToDeleteId: serverId }),
  closeDeleteModal: () => set({ serverToDeleteId: null }),

  openSteamLoginModal: (action, callback) => set({
    steamLoginModalConfig: { isOpen: true, action, callback }
  }),
  closeSteamLoginModal: () => set((state) => ({
    steamLoginModalConfig: { ...state.steamLoginModalConfig, isOpen: false, callback: undefined }
  })),

  // DayZ Hub Modals
  dayzInfoModal: { isOpen: false, message: '' },
  openDayzInfoModal: (message) => set({ dayzInfoModal: { isOpen: true, message } }),
  closeDayzInfoModal: () => set((state) => ({ dayzInfoModal: { ...state.dayzInfoModal, isOpen: false } })),

  dayzMissingDepsModal: { isOpen: false, depDetails: [] },
  openDayzMissingDepsModal: (depDetails, onConfirm, onCancel) => set({ dayzMissingDepsModal: { isOpen: true, depDetails, onConfirm, onCancel } }),
  closeDayzMissingDepsModal: () => set((state) => ({ dayzMissingDepsModal: { ...state.dayzMissingDepsModal, isOpen: false, onConfirm: undefined, onCancel: undefined } })),

  dayzUninstallSingleModal: { isOpen: false, modId: '', modName: '' },
  openDayzUninstallSingleModal: (modId, modName, onConfirm) => set({ dayzUninstallSingleModal: { isOpen: true, modId, modName, onConfirm } }),
  closeDayzUninstallSingleModal: () => set((state) => ({ dayzUninstallSingleModal: { ...state.dayzUninstallSingleModal, isOpen: false, onConfirm: undefined } })),

  dayzUninstallAllModal: { isOpen: false, modsCount: 0 },
  openDayzUninstallAllModal: (modsCount, onConfirm) => set({ dayzUninstallAllModal: { isOpen: true, modsCount, onConfirm } }),
  closeDayzUninstallAllModal: () => set((state) => ({ dayzUninstallAllModal: { ...state.dayzUninstallAllModal, isOpen: false, onConfirm: undefined } })),

  dayzRebuildConfirmModal: { isOpen: false },
  openDayzRebuildConfirmModal: (onConfirm) => set({ dayzRebuildConfirmModal: { isOpen: true, onConfirm } }),
  closeDayzRebuildConfirmModal: () => set((state) => ({ dayzRebuildConfirmModal: { ...state.dayzRebuildConfirmModal, isOpen: false, onConfirm: undefined } })),

  dayzRebuildSuccessModal: { isOpen: false },
  openDayzRebuildSuccessModal: () => set({ dayzRebuildSuccessModal: { isOpen: true } }),
  closeDayzRebuildSuccessModal: () => set({ dayzRebuildSuccessModal: { isOpen: false } }),

  dayzDependencyResultModal: { isOpen: false, modTitle: '', deps: [] },
  openDayzDependencyResultModal: (modTitle, deps) => set({ dayzDependencyResultModal: { isOpen: true, modTitle, deps } }),
  closeDayzDependencyResultModal: () => set((state) => ({ dayzDependencyResultModal: { ...state.dayzDependencyResultModal, isOpen: false } }))
}));
