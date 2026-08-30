import { create } from 'zustand'

interface PlayerStore {
  onlinePlayers: Record<string, any[]>
  setOnlinePlayers: (id: string, players: any[]) => void
  bannedPlayers: Record<string, any[]>
  setBannedPlayers: (id: string, players: any[]) => void
  playerListType: 'live' | 'history' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips'
  setPlayerListType: (
    type: 'live' | 'history' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips'
  ) => void
  selectedPlayer: string | null
  setSelectedPlayer: (player: string | null) => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  onlinePlayers: {},
  setOnlinePlayers: (id, players) =>
    set((state) => ({
      onlinePlayers: { ...state.onlinePlayers, [id]: players }
    })),
  bannedPlayers: {},
  setBannedPlayers: (id, players) =>
    set((state) => ({
      bannedPlayers: { ...state.bannedPlayers, [id]: players }
    })),
  playerListType: 'live',
  setPlayerListType: (type) => set({ playerListType: type }),
  selectedPlayer: null,
  setSelectedPlayer: (player) => set({ selectedPlayer: player })
}))
