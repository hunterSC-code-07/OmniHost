import { create } from 'zustand';

interface ModalStore {
  showCreateModal: boolean;
  initialCreateServerType: string;
  showSteamLoginModal: boolean;
  steamLoginAction: 'create' | 'cache';
  steamUsername: string;
  steamPassword: string;
  steamGuardCode: string;
  isSteamGuardRequired: boolean;
  serverToDelete: number | null;
  showTunnelModal: boolean;

  setShowCreateModal: (show: boolean) => void;
  setInitialCreateServerType: (type: string) => void;
  setShowSteamLoginModal: (show: boolean) => void;
  setSteamLoginAction: (action: 'create' | 'cache') => void;
  setSteamUsername: (username: string) => void;
  setSteamPassword: (password: string) => void;
  setSteamGuardCode: (code: string) => void;
  setIsSteamGuardRequired: (required: boolean) => void;
  setServerToDelete: (id: number | null) => void;
  setShowTunnelModal: (show: boolean) => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  showCreateModal: false,
  initialCreateServerType: 'Vanilla',
  showSteamLoginModal: false,
  steamLoginAction: 'create',
  steamUsername: '',
  steamPassword: '',
  steamGuardCode: '',
  isSteamGuardRequired: false,
  serverToDelete: null,
  showTunnelModal: false,

  setShowCreateModal: (show) => set({ showCreateModal: show }),
  setInitialCreateServerType: (type) => set({ initialCreateServerType: type }),
  setShowSteamLoginModal: (show) => set({ showSteamLoginModal: show }),
  setSteamLoginAction: (action) => set({ steamLoginAction: action }),
  setSteamUsername: (username) => set({ steamUsername: username }),
  setSteamPassword: (password) => set({ steamPassword: password }),
  setSteamGuardCode: (code) => set({ steamGuardCode: code }),
  setIsSteamGuardRequired: (required) => set({ isSteamGuardRequired: required }),
  setServerToDelete: (id) => set({ serverToDelete: id }),
  setShowTunnelModal: (show) => set({ showTunnelModal: show }),
}));
