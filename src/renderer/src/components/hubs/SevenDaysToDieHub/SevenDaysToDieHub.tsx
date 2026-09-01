import React, { useState, useMemo } from 'react';
import 'overlayscrollbars/overlayscrollbars.css';
import './sevendays-ui.css';
import { SevenDaysToDieConsoleTab } from './tabs/SevenDaysToDieConsoleTab';
import { motion, AnimatePresence } from 'motion/react';

import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { TunnelModal } from '../../modals/TunnelModal';

import { SevenDaysToDieFilesTab as FilesTab } from './tabs/SevenDaysToDieFilesTab';
import { SevenDaysToDieOptionsTab as OptionsTab } from './tabs/SevenDaysToDieOptionsTab';
import { SevenDaysToDiePlayersTab } from './tabs/SevenDaysToDiePlayersTab';
import { SevenDaysToDieOverviewTab } from './tabs/SevenDaysToDieOverviewTab';
import { SevenDaysToDieSpawnTab } from './tabs/SevenDaysToDieSpawnTab';
import { SevenDaysToDieInstalledModsTab } from './tabs/SevenDaysToDieInstalledModsTab';
import { SevenDaysToDieNexusTab } from './tabs/SevenDaysToDieNexusTab';
import { SevenDaysToDieCommunityModsTab } from './tabs/SevenDaysToDieCommunityModsTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'console', label: 'Console', icon: 'terminal' },
  { id: 'options', label: 'Options', icon: 'settings' },
  { id: 'players', label: 'Live Players', icon: 'group' },
  { id: 'spawn', label: 'Spawn Items', icon: 'inventory_2' },
  { id: 'installed_mods', label: 'Installed Mods', icon: 'extension' },
  { id: 'nexus_mods', label: 'Nexus Mods', icon: 'travel_explore' },
  { id: 'community_mods', label: 'Community Mods', icon: 'language' },
  { id: 'files', label: 'Config & Files', icon: 'folder' }
];

export const SevenDaysToDieHub: React.FC = () => {
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
      await window.api.system.startTunnel(tunnelIp, '7dtd');
    } else if (tunnelStatus === 'Online') {
      // @ts-ignore
      await window.api.system.stopTunnel();
    }
  };
  
  if (!activeServer) return null;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden dayz-scrollbars bg-black sevendays-ui">
      
      <div className="sevendays-bg"></div>

      <div className="p-8 flex flex-col gap-6 z-10 relative">
        <div className="flex justify-between items-center relative z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveServerId(null)} className="p-2 text-white/50 hover:text-white transition-colors flex items-center justify-center group" title="Back to Dashboard">
              <span className="material-symbols-outlined text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <h2 className="text-3xl font-bold sevendays-title tracking-wider">{activeServer.name}</h2>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex bg-[var(--7dtd-bg-panel-dark)] items-center border border-[var(--7dtd-border)]">
              <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`relative overflow-hidden group px-4 py-1.5 transition-all flex items-center justify-center ${tunnelStatus === 'Online' ? 'text-green-400' : tunnelStatus === 'Starting...' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
                <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
              </button>
              <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="px-3 border-l border-[var(--7dtd-border)] text-gray-400 hover:text-white transition-colors flex items-center justify-center" title="Tunnel IP Settings">
                <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
              </button>
            </div>
            <button onClick={() => deleteServer(activeServer.id)} className="sevendays-btn sevendays-btn-danger">
              DELETE
            </button>
            <button onClick={() => activeServer.status === 'Online' ? stopServer(activeServer.id) : startServer(activeServer.id)} className={`sevendays-btn ${activeServer.status === 'Online' ? 'sevendays-btn-danger' : ''}`}>
              {activeServer.status === 'Online' ? 'STOP' : 'START'}
            </button>
            <button onClick={() => restartServer(activeServer.id)} className="sevendays-btn">
              RESTART
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full flex justify-end pr-2 border-b-2 border-transparent relative -bottom-2 z-10 sevendays-tabs-container">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`sevendays-tab flex items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col z-10 px-8 pb-8">
        <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden sevendays-panel shadow-2xl">
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
              { activeTab === 'overview' && <SevenDaysToDieOverviewTab serverId={activeServer.id} />}
              { activeTab === 'console' && <SevenDaysToDieConsoleTab />}
              { activeTab === 'players' && <SevenDaysToDiePlayersTab serverId={activeServer.id} />}
              { activeTab === 'spawn' && <SevenDaysToDieSpawnTab serverId={activeServer.id} />}
              { activeTab === 'installed_mods' && <SevenDaysToDieInstalledModsTab serverId={activeServer.id} />}
              { activeTab === 'nexus_mods' && <SevenDaysToDieNexusTab serverId={activeServer.id} />}
              { activeTab === 'community_mods' && <SevenDaysToDieCommunityModsTab serverId={activeServer.id} />}
              { activeTab === 'options' && <OptionsTab />}
              { activeTab === 'files' && <FilesTab />}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </div>
  );
};
