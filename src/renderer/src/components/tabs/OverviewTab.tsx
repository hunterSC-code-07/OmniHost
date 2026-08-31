import React from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'

import { useServerStore } from '../../store/useServerStore'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useLogStore } from '../../store/useLogStore'
import { useStatsStore } from '../../store/useStatsStore'
import { useUiStore } from '../../store/useUiStore'

interface OverviewTabProps {
  serverVersion: string
  maxPlayers?: number
  maxRam?: number
  maxCpu?: number
}

export const OverviewTab: React.FC<OverviewTabProps> = React.memo(
  ({ serverVersion, maxPlayers = 20, maxRam = 4, maxCpu = 4 }) => {
    const { activeServerId, servers } = useServerStore()
    const { onlinePlayers: allOnlinePlayers } = usePlayerStore()
    const { logs: allLogs } = useLogStore()
    const { statsHistory: allStatsHistory } = useStatsStore()

    const [sysInfo, setSysInfo] = React.useState<any>({})
    const tunnelStatus = useUiStore((s) => s.tunnelStatus)
    const tunnelIp = useUiStore((s) => s.tunnelIp)

    React.useEffect(() => {
      window.api.system.getSystemInfo().then(setSysInfo)
    }, [])

    const currentServer = servers.find((s) => s.id === activeServerId)
    const serverStatus = currentServer?.status || 'Offline'
    const isMinecraft = currentServer?.game?.toLowerCase() === 'minecraft'
    const isPalworld = currentServer?.game?.toLowerCase() === 'palworld'
    const isTheForest = currentServer?.game?.toLowerCase() === 'theforest'
    const panelClass = isTheForest ? 'forest-panel' : isMinecraft ? 'minecraft-panel-dark' : isPalworld ? 'pal-panel' : 'bg-surface/80 backdrop-blur-md border border-outline-variant/30 rounded-xl hover:bg-surface-container-high/80 transition-colors'

    const statsHistory = activeServerId ? allStatsHistory[activeServerId.toString()] || [] : []
    const onlinePlayers = activeServerId ? allOnlinePlayers[activeServerId.toString()] || [] : []
    const logs = activeServerId
      ? allLogs
          .filter((l) => l.id === activeServerId.toString() || l.id === 'global')
          .map((l) => l.msg)
      : []

    // Helpers to generate smooth SVG paths
    const generatePath = (data: number[], max: number, decimals: number) => {
      if (data.length === 0) return 'M0,50 L100,50'
      if (data.length === 1)
        return `M0,${50 - (data[0] / max) * 40} L100,${50 - (data[0] / max) * 40}`

      // Scale X from 0 to 100, Y from 50 (bottom) to 10 (top, giving 10px padding)
      const points = data.map((val, i) => {
        const x = (i / Math.max(29, data.length - 1)) * 100
        // Snap to exact 0 if the rounded display text would be 0
        const snappedVal = Number(val.toFixed(decimals)) === 0 ? 0 : val
        const pct = Math.min(snappedVal, max) / max
        const y = 50 - pct * 40
        return [x, y]
      })

      // Create a smooth cubic bezier curve through points
      let path = `M${points[0][0]},${points[0][1]}`
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i]
        const p1 = points[i + 1]
        const cx = (p0[0] + p1[0]) / 2
        path += ` C${cx},${p0[1]} ${cx},${p1[1]} ${p1[0]},${p1[1]}`
      }
      return path
    }

    // Scale CPU by number of allocated cores so 200% on 2 cores = 100% full capacity
    const cpuData = statsHistory.map((s) => s.cpu / maxCpu)
    // RAM is in bytes. We scale max to allocated maxRam
    const ramData = statsHistory.map((s) => s.ram / 1024 / 1024 / 1024) // GB
    const currentCpu = cpuData.length > 0 ? cpuData[cpuData.length - 1] : 0
    const currentRam = ramData.length > 0 ? ramData[ramData.length - 1] : 0

    const cpuPath = generatePath(cpuData, 100, 0) // Max 100%, 0 decimals
    const ramPath = generatePath(ramData, maxRam, 1) // Max allocated RAM, 1 decimal

    const recentLogs = logs.slice(-10)

    return (
      <div className="absolute inset-0 flex min-h-0">
        <OverlayScrollbarsComponent
          className="flex-1 min-h-0 min-w-0 w-full"
          options={{
            scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 }
          }}
          defer
        >
          <div className="p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <h1 className={`font-headline-lg text-headline-lg mb-1 ${isTheForest ? 'forest-title text-4xl' : 'text-on-surface'}`}>
                  Server Overview
                </h1>
                <p className={`font-body-md text-body-md ${isTheForest ? 'text-white/80' : 'text-on-surface-variant'}`}>
                  Real-time performance and status
                </p>
              </div>

              {serverStatus === 'Online' && (
                <div className="flex flex-col gap-2 bg-surface-container/50 border border-brand/20 p-4 rounded-xl items-end">
                  <span className="text-sm font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                    Connection Info
                  </span>
                  <div className="flex gap-4 items-center">
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-on-surface-variant uppercase">
                        Local Network
                      </span>
                      <span className="font-mono text-white text-lg select-all bg-black/40 px-2 py-0.5 rounded cursor-copy border border-white/5 hover:border-brand/40 transition-colors">
                        {sysInfo.localIp}:
                        {currentServer?.game === 'Palworld'
                          ? '8211'
                          : currentServer?.game === 'DayZ'
                            ? '2302'
                            : '25565'}
                      </span>
                    </div>
                    {tunnelStatus === 'Online' && tunnelIp && (
                      <>
                        <div className="w-px h-8 bg-white/10 mx-2"></div>
                        <div className="flex flex-col text-right">
                          <span className="text-xs text-brand uppercase">Public Tunnel</span>
                          <span className="font-mono text-brand font-bold text-lg select-all bg-brand/10 px-2 py-0.5 rounded cursor-copy border border-brand/20 hover:border-brand transition-colors">
                            {tunnelIp}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* CPU Card */}
              <div className={`${panelClass} p-6 flex flex-col h-[220px]`}>
                <div className="flex justify-between items-center h-8">
                  <h3 className={`font-headline-md text-headline-md ${isTheForest ? 'forest-title' : 'text-on-surface'}`}>CPU Usage</h3>
                  <span className={`font-headline-md text-headline-md font-bold ${isTheForest ? 'text-[var(--forest-yellow)]' : 'text-primary'}`}>
                    {currentCpu.toFixed(0)}%
                  </span>
                </div>
                <div className="h-32 w-full relative overflow-hidden rounded-lg bg-surface-container-lowest/50 border border-outline-variant/20 mt-auto">
                  <svg
                    viewBox="0 0 100 50"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full overflow-visible"
                  >
                    <path
                      d={`${cpuPath} L100,50 L0,50 Z`}
                      className="text-primary/20"
                      fill="currentColor"
                    />
                    <path
                      d={cpuPath}
                      fill="none"
                      className={isTheForest ? 'text-[var(--forest-yellow)]' : 'text-primary'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute bottom-2 right-2 font-label-sm text-label-sm text-on-surface-variant">
                    60s History
                  </div>
                </div>
              </div>

              {/* RAM Card */}
              <div className={`${panelClass} p-6 flex flex-col h-[220px]`}>
                <div className="flex justify-between items-center h-8">
                  <h3 className={`font-headline-md text-headline-md ${isTheForest ? 'forest-title' : 'text-on-surface'}`}>RAM Usage</h3>
                  <span className={`font-headline-md text-headline-md font-bold ${isTheForest ? 'text-[var(--forest-yellow)]' : 'text-primary'}`}>
                    {currentRam.toFixed(1)} GB / {maxRam.toFixed(1)} GB
                  </span>
                </div>
                <div className="h-32 w-full relative overflow-hidden rounded-lg bg-surface-container-lowest/50 border border-outline-variant/20 mt-auto">
                  <svg
                    viewBox="0 0 100 50"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full overflow-visible"
                  >
                    <path
                      d={`${ramPath} L100,50 L0,50 Z`}
                      className="text-secondary/20"
                      fill="currentColor"
                    />
                    <path
                      d={ramPath}
                      fill="none"
                      className={isTheForest ? 'text-[var(--forest-yellow)]' : 'text-secondary'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute bottom-2 right-2 font-label-sm text-label-sm text-on-surface-variant">
                    60s History
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status */}
              <div className={`${panelClass} p-6 flex flex-col items-center justify-center gap-2`}>
                <div className="font-label-md text-label-md text-on-surface-variant">Status</div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${serverStatus === 'Online' ? (isTheForest ? 'bg-[var(--forest-green)]' : 'bg-secondary shadow-[0_0_10px_theme(colors.secondary)] animate-pulse') : (isTheForest ? 'bg-[var(--forest-red)]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]')}`}
                  ></div>
                  <span className={`font-headline-md text-headline-md ${isTheForest ? 'forest-title' : 'text-on-surface'}`}>
                    {serverStatus}
                  </span>
                </div>
              </div>

              {/* Version */}
              <div className={`${panelClass} p-6 flex flex-col items-center justify-center gap-2`}>
                <div className="font-label-md text-label-md text-on-surface-variant">
                  Server Version
                </div>
                <div className={`font-headline-md text-headline-md ${isTheForest ? 'forest-title' : 'text-on-surface'}`}>
                  {serverVersion}
                </div>
              </div>

              {/* Players */}
              <div className={`${panelClass} p-6 flex flex-col items-center justify-center gap-2`}>
                <div className="font-label-md text-label-md text-on-surface-variant">
                  Active Players
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">group</span>
                  <span className={`font-headline-md text-headline-md ${isTheForest ? 'forest-title' : 'text-on-surface'}`}>
                    {onlinePlayers.length} / {maxPlayers}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className={`${panelClass} flex flex-col overflow-hidden flex-1 min-h-[250px]`}>
              <div className="border-b border-outline-variant/30 px-6 py-4">
                <h3 className="font-headline-md text-headline-md text-on-surface">Recent Logs</h3>
              </div>
              <div className="p-6 overflow-y-auto bg-surface-container-lowest/50 font-console-text text-console-text space-y-2 flex-1">
                {recentLogs.length === 0 ? (
                  <div className="text-on-surface-variant italic font-body-md text-body-md">
                    No logs available.
                  </div>
                ) : (
                  recentLogs.map((log, idx) => (
                    <div key={idx} className="text-on-surface whitespace-pre-wrap break-words">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </OverlayScrollbarsComponent>
      </div>
    )
  }
)
