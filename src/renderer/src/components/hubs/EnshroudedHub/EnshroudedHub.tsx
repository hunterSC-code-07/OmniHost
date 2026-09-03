import React, { useState, useMemo } from 'react';
import 'overlayscrollbars/overlayscrollbars.css';
import { motion, AnimatePresence } from 'motion/react';

import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { TunnelModal } from '../../modals/TunnelModal';

import { EnshroudedConsoleTab } from './tabs/EnshroudedConsoleTab';
import { EnshroudedOptionsTab } from './tabs/EnshroudedOptionsTab';
import { EnshroudedPlayersTab } from './tabs/EnshroudedPlayersTab';
import { EnshroudedOverviewTab } from './tabs/EnshroudedOverviewTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'console', label: 'Console', icon: 'terminal' },
  { id: 'options', label: 'Options', icon: 'settings' },
  { id: 'players', label: 'Live Players', icon: 'group' }
];

export const EnshroudedHub: React.FC = () => {
  const { activeServerId, servers, setActiveServerId, startServer, stopServer, restartServer, deleteServer } = useServerStore();
  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [direction, setDirection] = useState(1);
  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false);

  const handleTabChange = (newTabId: string) => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    const newIndex = TABS.findIndex(t => t.id === newTabId);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTabId);
  };

  const activeServer = useMemo(() => servers.find(s => s.id === activeServerId), [servers, activeServerId]);

  const handleTunnel = async () => {
    if (tunnelStatus === 'Offline' || tunnelStatus === '') {
      // @ts-ignore
      await window.api.system.startTunnel(tunnelIp, 'enshrouded');
    } else if (tunnelStatus === 'Online') {
      // @ts-ignore
      await window.api.system.stopTunnel();
    }
  };
  
  if (!activeServer) return null;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden dayz-scrollbars bg-[#0a0f18] text-gray-200">
      
      {/* Fallback dark background if no image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1128] to-[#010205] z-0 opacity-80"></div>

      <div className="p-8 flex flex-col gap-6 z-10 relative">
        <div className="flex justify-between items-center relative z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveServerId(null)} className="p-2 text-white/50 hover:text-white transition-colors flex items-center justify-center group" title="Back to Dashboard">
              <span className="material-symbols-outlined text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <h2 className="text-3xl font-bold tracking-wider text-blue-100">{activeServer.name}</h2>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex bg-[#111827] items-center border border-blue-900/50 rounded overflow-hidden">
              <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`relative overflow-hidden group px-4 py-1.5 transition-all flex items-center justify-center ${tunnelStatus === 'Online' ? 'text-green-400' : tunnelStatus === 'Starting...' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
                <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
              </button>
              <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="px-3 border-l border-blue-900/50 text-gray-400 hover:text-white transition-colors flex items-center justify-center bg-black/20" title="Tunnel IP Settings">
                <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
              </button>
            </div>
            <button onClick={() => deleteServer(activeServer.id)} className="px-4 py-2 font-bold bg-red-900/40 text-red-400 hover:bg-red-800/60 hover:text-red-300 border border-red-900/50 rounded transition-all">
              DELETE
            </button>
            <button onClick={() => activeServer.status === 'Online' ? stopServer(activeServer.id) : startServer(activeServer.id)} className={`px-4 py-2 font-bold border rounded transition-all ${activeServer.status === 'Online' ? 'bg-red-900/40 text-red-400 border-red-900/50 hover:bg-red-800/60' : 'bg-green-900/40 text-green-400 border-green-900/50 hover:bg-green-800/60'}`}>
              {activeServer.status === 'Online' ? 'STOP' : 'START'}
            </button>
            <button onClick={() => restartServer(activeServer.id)} className="px-4 py-2 font-bold bg-blue-900/40 text-blue-400 hover:bg-blue-800/60 hover:text-blue-300 border border-blue-900/50 rounded transition-all">
              RESTART
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full flex justify-end pr-2 border-b border-blue-900/30 relative z-10 gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col z-10 px-8 pb-8">
        <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden bg-[#0d1424]/80 backdrop-blur-md border border-blue-900/30 rounded-lg shadow-2xl">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={activeTab}
              custom={direction}
              variants={{
                initial: (dir: number) => ({ opacity: 0, x: dir * 20 }),
                animate: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir * -20 })
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.15 }}
              className="flex flex-col min-h-0 w-full h-full relative"
            >
              { activeTab === 'overview' && <EnshroudedOverviewTab serverId={activeServer.id} />}
              { activeTab === 'console' && <EnshroudedConsoleTab />}
              { activeTab === 'players' && <EnshroudedPlayersTab serverId={activeServer.id} />}
              { activeTab === 'options' && <EnshroudedOptionsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </div>
  );
};
