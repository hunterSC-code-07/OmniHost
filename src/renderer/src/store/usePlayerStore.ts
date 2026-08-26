import { create } from 'zustand';

interface PlayerStore {
  onlinePlayers: Record<string, string[]>;
  setOnlinePlayers: (id: string, players: string[]) => void;
  playerListType: 'live' | 'history' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips';
  setPlayerListType: (type: 'live' | 'history' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips') => void;
  selectedPlayer: string | null;
  setSelectedPlayer: (player: string | null) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  onlinePlayers: {},
  setOnlinePlayers: (id, players) => set((state) => ({
    onlinePlayers: { ...state.onlinePlayers, [id]: players }
  })),
  playerListType: 'live',
  setPlayerListType: (type) => set({ playerListType: type }),
  selectedPlayer: null,
  setSelectedPlayer: (player) => set({ selectedPlayer: player })
}));
