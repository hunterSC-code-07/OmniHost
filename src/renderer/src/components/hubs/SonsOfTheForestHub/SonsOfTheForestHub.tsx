import React, { useState, useMemo } from 'react';
import 'overlayscrollbars/overlayscrollbars.css';
import './sonsoftheforest-ui.css';
import { motion, AnimatePresence } from 'motion/react';

import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { TunnelModal } from '../../modals/TunnelModal';

import { DayzFilesTab as FilesTab } from '../DayzHub/tabs/DayzFilesTab';
import { SonsOfTheForestOverviewTab } from './tabs/SonsOfTheForestOverviewTab';
import { SonsOfTheForestConsoleTab } from './tabs/SonsOfTheForestConsoleTab';
import { SonsOfTheForestPlayersTab } from './tabs/SonsOfTheForestPlayersTab';
import { SonsOfTheForestOptionsTab } from './tabs/SonsOfTheForestOptionsTab';

const TABS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'console', label: 'CONSOLE' },
  { id: 'players', label: 'PLAYERS' },
  { id: 'options', label: 'OPTIONS' },
  { id: 'files', label: 'FILES' }
];

export const SonsOfTheForestHub: React.FC = () => {
  const { activeServerId, servers, setActiveServerId, startServer, stopServer, restartServer, deleteServer } = useServerStore();
  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore();
  const [activeTab, setActiveTab] = useState('options');
  const [direction, setDirection] = useState(1);
  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false);

  const activeServer = useMemo(() => servers.find(s => s.id === activeServerId), [servers, activeServerId]);

  const handleTabChange = (newTabId: string) => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    const newIndex = TABS.findIndex(t => t.id === newTabId);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTabId);
  };

  const handleTunnel = async () => {
    if (tunnelStatus === 'Offline' || tunnelStatus === '') {
      // @ts-ignore
      await window.api.system.startTunnel(tunnelIp, 'sonsoftheforest');
    } else if (tunnelStatus === 'Online') {
      // @ts-ignore
      await window.api.system.stopTunnel();
    }
  };
  
  if (!activeServer) return null;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden sotf-scrollbars sotf-ui">
      
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) contrast(1.2)' }} />

      <div className="flex flex-col z-10 relative px-10 pt-10 pb-4">
        <div className="flex justify-between items-center w-full mb-8">
          <button onClick={() => setActiveServerId(null)} className="sotf-btn flex items-center justify-center hover:-translate-x-1" title="BACK">
            <span className="material-symbols-outlined text-[28px]">chevron_left</span>
          </button>
          
          <h2 className="text-3xl sotf-glitch-text-strong uppercase tracking-widest absolute left-1/2 -translate-x-1/2">
            {activeServer.name}
          </h2>

          <div className="flex gap-6 items-center">
            <div className="flex bg-[var(--sotf-panel)] items-center border border-[var(--sotf-border)]">
              <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`px-4 py-2 flex items-center justify-center transition-colors ${tunnelStatus === 'Online' ? 'text-green-500' : tunnelStatus === 'Starting...' ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
                <span className={`material-symbols-outlined text-[20px] ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
              </button>
              <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="px-3 py-2 border-l border-[var(--sotf-border)] text-gray-400 hover:text-white transition-colors flex items-center justify-center" title="Tunnel IP Settings">
                <span className="material-symbols-outlined text-[18px]">settings</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-4 border-b border-[var(--sotf-border)] pb-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`sotf-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col z-10 px-10 pb-10">
        <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
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
              className="flex flex-col min-h-0 w-full h-full"
            >
              { activeTab === 'overview' && <SonsOfTheForestOverviewTab />}
              { activeTab === 'console' && <SonsOfTheForestConsoleTab />}
              { activeTab === 'players' && <SonsOfTheForestPlayersTab serverId={activeServer.id} />}
              { activeTab === 'options' && <SonsOfTheForestOptionsTab />}
              { activeTab === 'files' && <FilesTab />}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="flex justify-between items-center w-full mt-6 pt-4 border-t border-[var(--sotf-border)]">
          <button className="sotf-btn hover:-translate-x-1 opacity-0 pointer-events-none">BACK</button>
          <div className="flex gap-8">
            <button onClick={() => deleteServer(activeServer.id)} className="sotf-btn hover:text-red-500">
              DELETE
            </button>
            <button onClick={() => activeServer.status === 'Online' ? stopServer(activeServer.id) : startServer(activeServer.id)} className={`sotf-btn ${activeServer.status === 'Online' ? 'hover:text-red-500' : 'hover:text-green-500'}`}>
              {activeServer.status === 'Online' ? 'STOP' : 'START'}
            </button>
            <button onClick={() => restartServer(activeServer.id)} className="sotf-btn hover:text-blue-400">
              RESTART
            </button>
          </div>
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </div>
  );
};
