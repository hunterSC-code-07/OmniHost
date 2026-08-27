import { create } from 'zustand'

export interface Server {
  id: number
  name: string
  game: string
  status: string
  [key: string]: any
}

interface ServerStore {
  servers: Server[]
  activeServerId: number | null
  activeGameHub: string | null
  lastGameHub: string | null
  hoveredGame: string | null

  setServers: (servers: Server[]) => void
  setActiveServerId: (id: number | null) => void
  setActiveGameHub: (hub: string | null) => void
  setLastGameHub: (hub: string | null) => void
  setHoveredGame: (game: string | null) => void

  // Actions
  startServer: (id: number) => Promise<void>
  stopServer: (id: number) => Promise<void>
  restartServer: (id: number) => Promise<void>
  deleteServer: (id: number) => Promise<void>
  fetchServers: () => Promise<void>
}

export const useServerStore = create<ServerStore>((set, get) => ({
  servers: [],
  activeServerId: null,
  activeGameHub: null,
  lastGameHub: null,
  hoveredGame: null,

  setServers: (servers) => set({ servers }),
  setActiveServerId: (id) => set({ activeServerId: id }),
  setActiveGameHub: (hub) => set({ activeGameHub: hub }),
  setLastGameHub: (hub) => set({ lastGameHub: hub }),
  setHoveredGame: (game) => set({ hoveredGame: game }),

  fetchServers: async () => {
    // @ts-ignore
    const data = await window.api.server.getServers()
    set({ servers: data })
  },

  startServer: async (id: number) => {
    // @ts-ignore
    await window.api.server.startServer(id)
    set((state) => ({
      servers: state.servers.map((s) => (s.id === id ? { ...s, status: 'Online' } : s))
    }))
  },

  stopServer: async (id: number) => {
    // @ts-ignore
    await window.api.server.stopServer(id)
    set((state) => ({
      servers: state.servers.map((s) => (s.id === id ? { ...s, status: 'Offline' } : s))
    }))
  },

  restartServer: async (id: number) => {
    // @ts-ignore
    await window.api.server.stopServer(id)
    set((state) => ({
      servers: state.servers.map((s) => (s.id === id ? { ...s, status: 'Offline' } : s))
    }))

    setTimeout(async () => {
      // @ts-ignore
      await window.api.server.startServer(id)
      set((state) => ({
        servers: state.servers.map((s) => (s.id === id ? { ...s, status: 'Online' } : s))
      }))
    }, 3000)
  },

  deleteServer: async (id: number) => {
    // @ts-ignore
    await window.api.server.deleteServer(id)
    set((state) => ({
      activeServerId: state.activeServerId === id ? null : state.activeServerId
    }))
    get().fetchServers()
  }
}))
