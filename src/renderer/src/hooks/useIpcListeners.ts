import { useEffect } from 'react'
import { useServerStore } from '../store/useServerStore'
import { useLogStore } from '../store/useLogStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { useStatsStore } from '../store/useStatsStore'

export function useIpcListeners() {
  useEffect(() => {
    const fetchServers = async () => {
      // @ts-ignore
      const data = await window.api.server.getServers()
      useServerStore.getState().setServers(data)
    }
    fetchServers()

    // @ts-ignore
    window.api.server.onServersUpdate((data: any[]) => {
      useServerStore.getState().setServers(data)
    })

    // @ts-ignore
    window.api.server.onConsoleLog((data: any) => {
      const msgs = data.msg ? data.msg.split('\n').filter((l: string) => l.trim() !== '') : []
      useLogStore.getState().addLogs(data.id.toString(), msgs)
    })

    // @ts-ignore
    window.api.server.onOnlinePlayers((data: any) => {
      usePlayerStore.getState().setOnlinePlayers(data.id.toString(), data.players)
    })

    // @ts-ignore
    window.api.server.onServerStats((data: any) => {
      useStatsStore.getState().addStat(data.id.toString(), { cpu: data.cpu, ram: data.ram })
    })
  }, [])
}
