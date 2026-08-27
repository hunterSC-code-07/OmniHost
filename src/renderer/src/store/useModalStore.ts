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
  }))
}));
