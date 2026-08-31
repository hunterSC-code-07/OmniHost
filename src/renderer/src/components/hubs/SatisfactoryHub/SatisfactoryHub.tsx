import React, { useState, useMemo } from 'react';
import 'overlayscrollbars/overlayscrollbars.css';
import { motion, AnimatePresence } from 'motion/react';
import { SatisfactoryAnimatedBackground } from './SatisfactoryAnimatedBackground';
import './satisfactory-ui.css';

import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { TunnelModal } from '../../modals/TunnelModal';

import { SatisfactoryConsoleTab } from './tabs/SatisfactoryConsoleTab';
import { SatisfactoryPlayersTab } from './tabs/SatisfactoryPlayersTab';
import { SatisfactoryModsTab } from './tabs/SatisfactoryModsTab';
import { SatisfactoryInstalledModsTab } from './tabs/SatisfactoryInstalledModsTab';

export const SatisfactoryHub: React.FC = () => {
  const { activeServerId, servers, setActiveServerId, startServer, stopServer, restartServer, deleteServer } = useServerStore();
  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore();
  const [activeTab, setActiveTab] = useState('console');
  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false);

  const activeServer = useMemo(() => servers.find(s => s.id === activeServerId), [servers, activeServerId]);

  const handleTunnel = async () => {
    if (tunnelStatus === 'Offline' || tunnelStatus === '') {
      // @ts-ignore
      await window.api.system.startTunnel(tunnelIp, 'satisfactory');
    } else if (tunnelStatus === 'Online') {
      // @ts-ignore
      await window.api.system.stopTunnel();
    }
  };
  
  if (!activeServer) return null;

  const TABS = [
    { id: 'console', label: 'CONSOLE', icon: 'terminal' },
    { id: 'players', label: 'PLAYERS', icon: 'group' },
    { id: 'installed-mods', label: 'INSTALLED MODS', icon: 'folder' },
    { id: 'mods', label: 'BROWSE MODS', icon: 'travel_explore' }
  ];

  const currentTabLabel = TABS.find(t => t.id === activeTab)?.label;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden satisfactory-ui satisfactory-scrollbars">
      <SatisfactoryAnimatedBackground />

      <div className="flex flex-col z-10 w-full h-full pointer-events-none">
        
        {/* Main UI Window */}
        <div className="bg-[rgba(20,20,20,0.85)] flex-1 flex flex-col relative pointer-events-auto backdrop-blur-md w-full">
          
          {/* Top Header Tabs */}
          <div className="flex bg-[rgba(10,10,10,0.9)] border-b-2 border-black">
            <div className="flex items-center px-4 py-2 text-gray-400 font-bold text-sm tracking-wide gap-2 border-r border-black">
              {activeServer.name.toUpperCase()}
            </div>
            
            <div className="flex px-2 pt-1 gap-1 items-end">
              {TABS.map(tab => (
                <div 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`sf-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {tab.label}
                </div>
              ))}
            </div>

            <div className="ml-auto flex">
               <button onClick={() => setActiveServerId(null)} className="px-4 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center">
                 <span className="material-symbols-outlined text-[20px]">close</span>
               </button>
            </div>
          </div>

          {/* Sub Header */}
          <div className="sf-sub-header">
            <div className="flex items-center text-gray-400 font-bold gap-2 text-sm">
               <span className="material-symbols-outlined text-[18px]">chevron_left</span>
               <span className="text-white">{currentTabLabel}</span>
               <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </div>
            <div className="flex gap-4 items-center">
              <span className={`text-xs font-bold px-2 py-1 border ${activeServer.status === 'Online' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                {activeServer.status.toUpperCase()}
              </span>
              <button onClick={handleTunnel} title="Tunnel" className={`flex items-center justify-center ${tunnelStatus === 'Online' ? 'text-green-500' : tunnelStatus === 'Starting...' ? 'text-gray-500' : 'text-gray-400 hover:text-white'}`}>
                <span className={`material-symbols-outlined text-[18px] ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
              </button>
              <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="text-gray-400 hover:text-white transition-colors" title="Tunnel IP Settings">
                <span className="material-symbols-outlined text-[18px]">settings</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col p-6 pr-2">
            <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col min-h-0 w-full h-full"
                >
                  {activeTab === 'console' && <SatisfactoryConsoleTab />}
                  {activeTab === 'players' && <SatisfactoryPlayersTab />}
                  {activeTab === 'installed-mods' && <SatisfactoryInstalledModsTab />}
                  {activeTab === 'mods' && <SatisfactoryModsTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center bg-black/40 border-t border-[var(--sf-border)] p-4">
            <button onClick={() => deleteServer(activeServer.id)} className="text-red-400 hover:text-red-300 font-bold text-sm tracking-widest px-4 py-2 border border-transparent hover:border-red-500 transition-colors">
              DELETE SERVER
            </button>
            <div className="flex gap-4">
              <button onClick={() => activeServer.status === 'Online' ? stopServer(activeServer.id) : startServer(activeServer.id)} className="sf-btn-secondary">
                {activeServer.status === 'Online' ? 'STOP' : 'START'}
              </button>
              <button onClick={() => restartServer(activeServer.id)} className="sf-btn-primary">
                RESTART
              </button>
            </div>
          </div>

        </div>
      </div>
      
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </div>
  );
};

