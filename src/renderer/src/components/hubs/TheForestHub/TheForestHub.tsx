import React, { useState, useMemo } from 'react';
import 'overlayscrollbars/overlayscrollbars.css';
import '../../../assets/theforest-ui.css';
import { motion, AnimatePresence } from 'motion/react';

import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { TunnelModal } from '../../modals/TunnelModal';

import { DayzFilesTab as FilesTab } from '../DayzHub/tabs/DayzFilesTab';
import { TheForestOverviewTab } from './tabs/TheForestOverviewTab';
import { TheForestConsoleTab } from './tabs/TheForestConsoleTab';
import { TheForestPlayersTab } from './tabs/TheForestPlayersTab';
import { TheForestOptionsTab } from './tabs/TheForestOptionsTab';
import { TheForestAdminTab } from './tabs/TheForestAdminTab';

export const TheForestHub: React.FC = () => {
  const { activeServerId, servers, setActiveServerId, startServer, stopServer, restartServer, deleteServer } = useServerStore();
  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false);

  const activeServer = useMemo(() => servers.find(s => s.id === activeServerId), [servers, activeServerId]);

  const handleTunnel = async () => {
    if (tunnelStatus === 'Offline' || tunnelStatus === '') {
      // @ts-ignore
      await window.api.system.startTunnel(tunnelIp, 'theforest');
    } else if (tunnelStatus === 'Online') {
      // @ts-ignore
      await window.api.system.stopTunnel();
    }
  };
  
  if (!activeServer) return null;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden dayz-scrollbars bg-black theforest-ui">
      
      <div className="p-10 flex flex-col gap-6 z-10">
        <div className="flex justify-between items-center relative z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveServerId(null)} className="p-2 text-white hover:text-[var(--forest-yellow)] transition-colors flex items-center justify-center group" title="Back to Dashboard">
              <span className="material-symbols-outlined text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <h2 className="text-4xl font-bold text-white uppercase tracking-wider">{activeServer.name}</h2>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex bg-[var(--forest-gray)] items-center">
              <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`relative overflow-hidden group px-4 py-2 transition-all flex items-center justify-center ${tunnelStatus === 'Online' ? 'text-[var(--forest-green)]' : tunnelStatus === 'Starting...' ? 'text-[var(--forest-gray-light)] cursor-not-allowed' : 'text-white hover:text-[var(--forest-yellow)]'}`}>
                <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
              </button>
              <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="px-3 text-white hover:text-[var(--forest-yellow)] transition-colors flex items-center justify-center" title="Tunnel IP Settings">
                <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
              </button>
            </div>
            <button onClick={() => deleteServer(activeServer.id)} className="forest-btn hover:!text-[var(--forest-red)]">
              DELETE
            </button>
            <button onClick={() => activeServer.status === 'Online' ? stopServer(activeServer.id) : startServer(activeServer.id)} className={`forest-btn ${activeServer.status === 'Online' ? 'hover:!text-[var(--forest-red)]' : 'hover:!text-[var(--forest-green)]'}`}>
              {activeServer.status === 'Online' ? 'STOP' : 'START'}
            </button>
            <button onClick={() => restartServer(activeServer.id)} className="forest-btn">
              RESTART
            </button>
          </div>
        </div>

            <div className="flex items-center gap-6 min-w-max pb-0 pt-2 px-2">
              {[
                { id: 'overview', label: 'DISPLAY' },
                { id: 'console', label: 'CONSOLE' },
                { id: 'players', label: 'PLAYERS' },
                { id: 'admin', label: 'ADMIN' },
                { id: 'options', label: 'OPTIONS' },
                { id: 'files', label: 'FILES' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`forest-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
        </div>

      <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col z-10 px-10 pb-10">
        <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col min-h-0 w-full h-full"
            >
              { activeTab === 'overview' && <TheForestOverviewTab />}
              { activeTab === 'console' && <TheForestConsoleTab />}
              { activeTab === 'players' && <TheForestPlayersTab serverId={activeServer.id} />}
              { activeTab === 'admin' && <TheForestAdminTab serverId={activeServer.id} />}
              { activeTab === 'options' && <TheForestOptionsTab />}
              { activeTab === 'files' && <FilesTab />}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </div>
  );
};
