import { create } from 'zustand';

interface ModalStore {
  isCreateServerModalOpen: boolean;
  serverToDeleteId: number | null;
  steamLoginModalConfig: {
    isOpen: boolean;
    action: 'create' | 'cache';
    callback?: (credentials: any) => void;
  };
  
  openCreateServerModal: () => void;
  closeCreateServerModal: () => void;
  
  openDeleteModal: (serverId: number) => void;
  closeDeleteModal: () => void;
  
  openSteamLoginModal: (action: 'create' | 'cache', callback?: (credentials: any) => void) => void;
  closeSteamLoginModal: () => void;
  
  // 7 Days to Die
  isSevenDaysConfigModalOpen: boolean;
  sevenDaysConfigServerId: number | null;
  openSevenDaysConfigModal: (serverId: number) => void;
  closeSevenDaysConfigModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isCreateServerModalOpen: false,
  serverToDeleteId: null,
  steamLoginModalConfig: {
    isOpen: false,
    action: 'create'
  },

  openCreateServerModal: () => set({ isCreateServerModalOpen: true }),
  closeCreateServerModal: () => set({ isCreateServerModalOpen: false }),

  openDeleteModal: (serverId) => set({ serverToDeleteId: serverId }),
  closeDeleteModal: () => set({ serverToDeleteId: null }),

  openSteamLoginModal: (action, callback) => set({
    steamLoginModalConfig: { isOpen: true, action, callback }
  }),
  closeSteamLoginModal: () => set((state) => ({
    steamLoginModalConfig: { ...state.steamLoginModalConfig, isOpen: false, callback: undefined }
  })),

  // 7 Days to Die
  isSevenDaysConfigModalOpen: false,
  sevenDaysConfigServerId: null,
  openSevenDaysConfigModal: (serverId) => set({ isSevenDaysConfigModalOpen: true, sevenDaysConfigServerId: serverId }),
  closeSevenDaysConfigModal: () => set({ isSevenDaysConfigModalOpen: false, sevenDaysConfigServerId: null }),
}));
