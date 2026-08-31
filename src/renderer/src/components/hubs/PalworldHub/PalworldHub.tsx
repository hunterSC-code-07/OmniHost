import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'
import '../../../assets/palworld-ui.css'

import { ConsoleTab } from '../../tabs/ConsoleTab'
import { PalworldOptionsTab } from './PalworldOptionsTab'
import { PalworldPlayersTab } from './PalworldPlayersTab'
import { PalworldModsTab } from './PalworldModsTab'
import { FilesTab } from '../../tabs/FilesTab'
import { BackupsTab } from '../../tabs/BackupsTab'
import { OverviewTab } from '../../tabs/OverviewTab'
import { PalworldAnimatedBackground } from './PalworldAnimatedBackground'
import { TunnelModal } from '../../modals/TunnelModal'

import { useServerStore } from '../../../store/useServerStore'
import { useUiStore } from '../../../store/useUiStore'
import { useShallow } from 'zustand/react/shallow'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'console', label: 'Console', icon: 'terminal' },
  { id: 'options', label: 'Options', icon: 'settings' },
  { id: 'players', label: 'Players', icon: 'group' },
  { id: 'mods', label: 'Mods', icon: 'extension' },
  { id: 'files', label: 'Files', icon: 'folder' },
  { id: 'backups', label: 'Backups', icon: 'save' }
] as const

export const PalworldHub: React.FC = () => {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const currentServer = useServerStore((s) => s.servers.find((srv) => srv.id === activeServerId))

  const { startServer, stopServer, restartServer, deleteServer } = useServerStore(
    useShallow((s) => ({
      startServer: s.startServer,
      stopServer: s.stopServer,
      restartServer: s.restartServer,
      deleteServer: s.deleteServer
    }))
  )

  const prevServerRef = useRef(currentServer)
  if (currentServer) {
    prevServerRef.current = currentServer
  }
  const activeServer = currentServer || prevServerRef.current

  if (!activeServer) return null

  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore(
    useShallow((s) => ({
      tunnelStatus: s.tunnelStatus,
      tunnelIp: s.tunnelIp,
      setTempTunnelIp: s.setTempTunnelIp
    }))
  )
  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false)

  const handleTunnel = async () => {
    if (tunnelStatus === 'Online' || tunnelStatus === 'Starting...') {
      // @ts-ignore
      await window.api.system.stopTunnel()
      useUiStore.getState().setTunnelStatus('Offline')
    } else {
      useUiStore.getState().setTunnelStatus('Starting...')
      // @ts-ignore
      await window.api.system.startTunnel(tunnelIp, 'palworld')
      // Because FrpAdapter doesn't send a specific "connected" IPC, we assume Online after it spawns
      useUiStore.getState().setTunnelStatus('Online')
    }
  }

  const [activeTab, setActiveTab] = useState<
    'overview' | 'console' | 'options' | 'players' | 'mods' | 'files' | 'backups'
  >('overview')
  const [tabDirection, setTabDirection] = useState(0)

  const handleTabChange = (newTab: typeof activeTab) => {
    if (newTab === activeTab) return
    const tabIds = TABS.map((t) => t.id)
    const currentIndex = tabIds.indexOf(activeTab)
    const newIndex = tabIds.indexOf(newTab)
    setTabDirection(newIndex > currentIndex ? 1 : -1)
    setActiveTab(newTab)
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden palworld-ui">
      <PalworldAnimatedBackground />

      <div className="pal-panel p-6 flex flex-col gap-6 z-10 border-b-0 rounded-b-none">
        <div className="flex justify-between items-center relative z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => useServerStore.getState().setActiveServerId(null)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center group"
              title="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
            </button>
            <h2 className="pal-title">{activeServer.name}</h2>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ml-2">
              Palworld
            </span>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex pal-panel rounded-full p-1 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105">
              <button
                onClick={handleTunnel}
                title={
                  tunnelStatus === 'Online'
                    ? 'Stop Tunnel'
                    : tunnelStatus === 'Starting...'
                      ? 'Starting...'
                      : 'Start Tunnel'
                }
                className={`relative overflow-hidden group px-4 py-2.5 transition-all flex items-center justify-center ${tunnelStatus === 'Online' ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : tunnelStatus === 'Starting...' ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}
                >
                  {tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}
                </span>
              </button>
              <button
                onClick={() => {
                  setTempTunnelIp(tunnelIp)
                  setIsTunnelModalOpen(true)
                }}
                className="px-3 border-l border-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                title="Tunnel IP Settings"
              >
                <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
              </button>
            </div>

            <button
              onClick={() => deleteServer(activeServer.id)}
              className="pal-btn"
            >
              <span>DELETE</span>
            </button>

            <button
              onClick={() =>
                activeServer.status === 'Online'
                  ? stopServer(activeServer.id)
                  : startServer(activeServer.id)
              }
              className={activeServer.status === 'Online' ? 'pal-btn pal-btn-orange' : 'pal-btn pal-btn-blue'}
            >
              <span>
                {activeServer.status === 'Online' ? 'STOP' : 'START'}
              </span>
            </button>

            <button
              onClick={() => restartServer(activeServer.id)}
              className="pal-btn pal-btn-blue"
            >
              <span>RESTART</span>
            </button>
          </div>
        </div>

        {/* Sub Top Nav Bar for Server Tabs */}
        <div className="w-full pb-1">
          <OverlayScrollbarsComponent
            options={{
              scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 }
            }}
            defer
          >
            <div className="flex items-center gap-2 min-w-max pt-2 pb-2 px-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`pal-btn ${
                    activeTab === tab.id
                      ? 'pal-btn-active'
                      : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </OverlayScrollbarsComponent>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col border border-t-0 border-white/5 shadow-inner z-10">
        <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
          <AnimatePresence custom={tabDirection} mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              custom={tabDirection}
              variants={{
                enter: (direction: number) => ({
                  x: direction > 0 ? 50 : -50,
                  opacity: 0,
                  position: 'absolute' as const,
                  width: '100%',
                  height: '100%'
                }),
                center: {
                  x: 0,
                  opacity: 1,
                  position: 'relative' as const,
                  width: '100%',
                  height: '100%'
                },
                exit: (direction: number) => ({
                  x: direction < 0 ? 50 : -50,
                  opacity: 0,
                  position: 'absolute' as const,
                  width: '100%',
                  height: '100%'
                })
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex flex-col min-h-0 w-full h-full"
            >
              {activeTab === 'overview' && (
                <OverviewTab
                  serverVersion="Palworld Dedicated Server"
                  maxPlayers={activeServer.maxPlayers || 32}
                  maxRam={8}
                  maxCpu={4}
                />
              )}
              {activeTab === 'console' && (
                <ConsoleTab
                  isActive={activeTab === 'console'}
                  onPlayerClick={() => handleTabChange('players')}
                />
              )}
              {activeTab === 'options' && <PalworldOptionsTab serverId={activeServer.id} />}
              {activeTab === 'players' && <PalworldPlayersTab />}
              {activeTab === 'mods' && <PalworldModsTab />}
              {activeTab === 'files' && <FilesTab />}
              {activeTab === 'backups' && <BackupsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </div>
  )
}
