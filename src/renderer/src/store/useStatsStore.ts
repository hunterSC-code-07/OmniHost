import { create } from 'zustand'

export interface StatPoint {
  cpu: number
  ram: number
}

interface StatsStore {
  statsHistory: Record<string, StatPoint[]>
  addStat: (id: string, stat: StatPoint) => void
  setStatsHistory: (history: Record<string, StatPoint[]>) => void
}

export const useStatsStore = create<StatsStore>((set) => ({
  statsHistory: {},
  setStatsHistory: (history) => set({ statsHistory: history }),
  addStat: (id, stat) =>
    set((state) => {
      const current = state.statsHistory[id] || []
      const updated = [...current, stat]
      if (updated.length > 50) updated.shift()
      return {
        statsHistory: {
          ...state.statsHistory,
          [id]: updated
        }
      }
    })
}))
