import React, { useState } from 'react'
import 'overlayscrollbars/overlayscrollbars.css'
import terrariaBgVideo from '../../../assets/terraria-animated-bg.mp4'
import '../../../assets/terraria-ui.css'
import '../../../assets/gamehub-ui.css'
import { useServerStore } from '../../../store/useServerStore'
import { TerrariaHubHeader } from './TerrariaHubHeader'
import { TerrariaHubNavigation } from './TerrariaHubNavigation'
import { TerrariaOverviewTab } from './tabs/TerrariaOverviewTab'
import { TerrariaOptionsTab } from './tabs/TerrariaOptionsTab'
import { TerrariaPlayersTab } from './tabs/TerrariaPlayersTab'
import { ConsoleTab } from '../../tabs/ConsoleTab'

export const TerrariaHub: React.FC = () => {
  const { activeServerId, servers } = useServerStore()
  const currentServer = servers.find((s) => s.id === activeServerId)
  const [activeTab, setActiveTab] = useState('overview')

  if (!currentServer) return null

  return (
    <div
      className="gamehub-theme terraria-ui flex-1 flex flex-col relative overflow-hidden"
      data-game="terraria"
    >
      {/* Animated Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-40 transition-opacity duration-1000"
      >
        <source src={terrariaBgVideo} type="video/mp4" />
      </video>
      <div className="hub-frame-header terraria-panel p-6 flex flex-col gap-6 z-10 border-b-0 rounded-b-none shadow-none">
        <TerrariaHubHeader />
        <TerrariaHubNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="hub-frame-content flex-1 overflow-hidden relative min-h-0 flex flex-col border border-t-0 border-white/5 shadow-inner z-10 bg-black/40">
        <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
          {activeTab === 'overview' && <TerrariaOverviewTab />}
          {activeTab === 'console' && (
            <ConsoleTab
              isActive={activeTab === 'console'}
              onPlayerClick={() => setActiveTab('players')}
            />
          )}
          {activeTab === 'options' && <TerrariaOptionsTab />}
          {activeTab === 'players' && <TerrariaPlayersTab />}
        </div>
      </div>
    </div>
  )
}
