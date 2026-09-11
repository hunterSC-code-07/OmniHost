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

  setServers: (servers: Server[]) => void
  setActiveServerId: (id: number | null) => void

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

  setServers: (servers) => set({ servers }),
  setActiveServerId: (id) => set({ activeServerId: id }),

  fetchServers: async () => {
    // @ts-ignore
    const data = await window.api.server.getServers()
    set({ servers: data })
  },

  startServer: async (id: number) => {
    // @ts-ignore
    await window.api.server.startServer(id)
    await get().fetchServers()
  },

  stopServer: async (id: number) => {
    // @ts-ignore
    await window.api.server.stopServer(id)
    await get().fetchServers()
  },

  restartServer: async (id: number) => {
    // @ts-ignore
    await window.api.server.stopServer(id)
    // @ts-ignore
    await window.api.server.startServer(id)
    await get().fetchServers()
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
