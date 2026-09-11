import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'
import './enshrouded-ui.css'

import { useServerStore } from '../../../store/useServerStore'
import { useUiStore } from '../../../store/useUiStore'
import { TunnelModal } from '../../modals/TunnelModal'
import { ENSHROUDED_BACKGROUND_URL } from './EnshroudedHub.constants'
import { EnshroudedConsoleTab } from './tabs/EnshroudedConsoleTab'
import { EnshroudedOptionsTab } from './tabs/EnshroudedOptionsTab'
import { EnshroudedOverviewTab } from './tabs/EnshroudedOverviewTab'
import { EnshroudedPlayersTab } from './tabs/EnshroudedPlayersTab'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'console', label: 'Console', icon: 'terminal' },
  { id: 'options', label: 'Options', icon: 'settings' },
  { id: 'players', label: 'Players', icon: 'groups' }
] as const

type EnshroudedTab = (typeof TABS)[number]['id']

export const EnshroudedHub: React.FC = () => {
  const {
    activeServerId,
    servers,
    setActiveServerId,
    startServer,
    stopServer,
    restartServer,
    deleteServer
  } = useServerStore()
  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore()
  const [activeTab, setActiveTab] = useState<EnshroudedTab>('overview')
  const [tabDirection, setTabDirection] = useState(0)
  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false)

  const activeServer = useMemo(
    () => servers.find((server) => server.id === activeServerId),
    [servers, activeServerId]
  )

  if (!activeServer) return null

  const isOnline = activeServer.status === 'Online'

  const handleTabChange = (nextTab: EnshroudedTab) => {
    if (nextTab === activeTab) return
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab)
    const nextIndex = TABS.findIndex((tab) => tab.id === nextTab)
    setTabDirection(nextIndex > currentIndex ? 1 : -1)
    setActiveTab(nextTab)
  }

  const handleTunnel = async () => {
    if (tunnelStatus === 'Offline' || tunnelStatus === '') {
      await window.api.system.startTunnel(tunnelIp, 'enshrouded')
    } else if (tunnelStatus === 'Online') {
      await window.api.system.stopTunnel()
    }
  }

  return (
    <div
      className="enshrouded-ui enshrouded-scrollbars flex flex-1 flex-col overflow-hidden relative"
      data-testid="enshrouded-hub"
    >
      <div
        className="enshrouded-background pointer-events-none"
        style={{ backgroundImage: `url('${ENSHROUDED_BACKGROUND_URL}')` }}
      />

      <header className="enshrouded-header relative z-10 px-6 pt-5 pb-4 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setActiveServerId(null)}
              className="enshrouded-icon-btn shrink-0 group"
              title="Back to Dashboard"
              aria-label="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-0.5">
                arrow_back
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="enshrouded-kicker">Enshrouded · Dedicated server</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-label-sm text-[10px] uppercase tracking-widest ${
                    isOnline
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-white/45'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`}
                  />
                  {activeServer.status}
                </span>
              </div>
              <h1 className="enshrouded-title truncate text-2xl lg:text-3xl">
                {activeServer.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <div className="flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={handleTunnel}
                disabled={tunnelStatus === 'Starting...'}
                className={`enshrouded-icon-btn ${tunnelStatus === 'Online' ? 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' : ''}`}
                title={tunnelStatus === 'Online' ? 'Stop Tunnel' : 'Start Tunnel'}
                aria-label={tunnelStatus === 'Online' ? 'Stop Tunnel' : 'Start Tunnel'}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}
                >
                  {tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempTunnelIp(tunnelIp)
                  setIsTunnelModalOpen(true)
                }}
                className="enshrouded-icon-btn"
                title="Tunnel IP Settings"
                aria-label="Tunnel IP Settings"
              >
                <span className="material-symbols-outlined text-[19px]">tune</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => deleteServer(activeServer.id)}
              className="enshrouded-btn enshrouded-btn-danger"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() =>
                isOnline ? stopServer(activeServer.id) : startServer(activeServer.id)
              }
              className={`enshrouded-btn ${isOnline ? 'enshrouded-btn-danger' : 'enshrouded-btn-primary'}`}
            >
              {isOnline ? 'Stop' : 'Start'}
            </button>
            <button
              type="button"
              onClick={() => restartServer(activeServer.id)}
              className="enshrouded-btn"
            >
              Restart
            </button>
          </div>
        </div>

        <OverlayScrollbarsComponent
          className="w-full"
          options={{
            scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 }
          }}
          defer
        >
          <nav className="flex min-w-max items-center gap-2 py-1" aria-label="Enshrouded server">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`enshrouded-tab ${activeTab === tab.id ? 'active' : ''}`}
                data-testid={`enshrouded-tab-${tab.id}`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </OverlayScrollbarsComponent>
      </header>

      <main className="relative z-10 flex-1 min-h-0 px-6 pt-5">
        <div className="enshrouded-content relative h-full min-h-0 overflow-hidden">
          <AnimatePresence custom={tabDirection} mode="sync" initial={false}>
            <motion.div
              key={activeTab}
              custom={tabDirection}
              variants={{
                enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 28 : -28 }),
                center: { opacity: 1, x: 0 },
                exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 28 : -28 })
              }}
              initial={false}
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="absolute inset-0 flex min-h-0 flex-col"
            >
              {activeTab === 'overview' && <EnshroudedOverviewTab />}
              {activeTab === 'console' && <EnshroudedConsoleTab />}
              {activeTab === 'options' && <EnshroudedOptionsTab />}
              {activeTab === 'players' && <EnshroudedPlayersTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </div>
  )
}
