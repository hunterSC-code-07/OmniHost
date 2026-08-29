import React, { useState, useMemo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
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
    <div className="flex-1 flex flex-col relative overflow-hidden dayz-scrollbars bg-black/60">
      
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000)', backgroundSize: 'cover', backgroundPosition: 'center' }} />

      <div className="glass-panel p-6 flex flex-col gap-6 z-10 border-b-0 rounded-b-none backdrop-blur-md bg-black/40">
        <div className="flex justify-between items-center relative z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveServerId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center group" title="Back to Dashboard">
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeServer.name}</h2>
            <span className="bg-[#16a34a]/20 text-[#4ade80] border border-[#16a34a]/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ml-2">The Forest</span>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex glass-panel rounded-lg overflow-hidden transition-all duration-300 hover:border-white/30 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`relative overflow-hidden group px-4 py-2.5 transition-all flex items-center justify-center ${tunnelStatus === 'Online' ? 'bg-brand/20 text-brand shadow-[0_0_15px_rgba(74,222,128,0.4)] hover:bg-brand/30' : tunnelStatus === 'Starting...' ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
                <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
              </button>
              <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="px-3 border-l border-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center" title="Tunnel IP Settings">
                <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
              </button>
            </div>
            <button onClick={() => deleteServer(activeServer.id)} className="relative overflow-hidden group glass-panel px-6 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
              <span className="relative z-10">DELETE</span>
            </button>
            <button onClick={() => activeServer.status === 'Online' ? stopServer(activeServer.id) : startServer(activeServer.id)} className={`relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 ${activeServer.status === 'Online' ? 'hover:border-red-500/60 text-red-400 hover:text-red-300 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2)]' : 'hover:border-green-500/60 text-green-400 hover:text-green-300 hover:shadow-[0_8px_32px_rgba(74,222,128,0.2)]'}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
              <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
            </button>
            <button onClick={() => restartServer(activeServer.id)} className="relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-[#16a34a]/60 text-[#4ade80] hover:text-[#4ade80] hover:shadow-[0_8px_32px_rgba(22,163,74,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
              <span className="relative z-10">RESTART</span>
            </button>
          </div>
        </div>

        {/* Sub Top Nav Bar for Server Tabs */}
        <div className="w-full pb-1">
          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer>
            <div className="flex items-center gap-2 min-w-max pb-2 pt-2 px-1">
              {[
                { id: 'overview', label: 'Overview', icon: 'dashboard' },
                { id: 'console', label: 'Console', icon: 'terminal' },
                { id: 'players', label: 'Live Players', icon: 'group' },
                { id: 'admin', label: 'Admin Actions', icon: 'admin_panel_settings' },
                { id: 'options', label: 'Options', icon: 'settings' },
                { id: 'files', label: 'Config & Files', icon: 'folder' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-300 ease-out whitespace-nowrap hover:-translate-y-1 hover:scale-105 ${activeTab === tab.id
                      ? 'bg-[#16a34a]/20 text-[#4ade80] border border-[#16a34a]/50 shadow-[0_0_15px_rgba(22,163,74,0.15)]'
                      : 'text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent'
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col min-h-0 w-full h-full"
            >
              { activeTab === 'overview' && <TheForestOverviewTab serverId={activeServer.id} />}
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
