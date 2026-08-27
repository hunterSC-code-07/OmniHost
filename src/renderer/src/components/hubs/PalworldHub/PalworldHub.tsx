import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

import { ConsoleTab } from '../../tabs/ConsoleTab';
import { PalworldOptionsTab } from './PalworldOptionsTab';
import { PalworldPlayersTab } from './PalworldPlayersTab';
import { PalworldModsTab } from './PalworldModsTab';
import { FilesTab } from '../../tabs/FilesTab';
import { BackupsTab } from '../../tabs/BackupsTab';
import { OverviewTab } from '../../tabs/OverviewTab';
import { AnimatedBackground } from '../../AnimatedBackground';

import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { useModalStore } from '../../../store/useModalStore';
import { useShallow } from 'zustand/react/shallow';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'console', label: 'Console', icon: 'terminal' },
  { id: 'options', label: 'Options', icon: 'settings' },
  { id: 'players', label: 'Players', icon: 'group' },
  { id: 'mods', label: 'Mods', icon: 'extension' },
  { id: 'files', label: 'Files', icon: 'folder' },
  { id: 'backups', label: 'Backups', icon: 'save' }
] as const;

export const PalworldHub: React.FC = () => {
  const activeServerId = useServerStore(s => s.activeServerId);
  const currentServer = useServerStore(s => s.servers.find(srv => srv.id === activeServerId));
  
  const { startServer, stopServer, restartServer, deleteServer } = useServerStore(
    useShallow(s => ({
      startServer: s.startServer,
      stopServer: s.stopServer,
      restartServer: s.restartServer,
      deleteServer: s.deleteServer
    }))
  );

  const prevServerRef = useRef(currentServer);
  if (currentServer) {
    prevServerRef.current = currentServer;
  }
  const activeServer = currentServer || prevServerRef.current;

  if (!activeServer) return null;

  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore(
    useShallow(s => ({
      tunnelStatus: s.tunnelStatus,
      tunnelIp: s.tunnelIp,
      setTempTunnelIp: s.setTempTunnelIp
    }))
  );
  const setShowTunnelModal = useModalStore(s => s.setShowTunnelModal);

  const handleTunnel = async () => {}; // Stub for tunnel functionality if needed

  const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'options' | 'players' | 'mods' | 'files' | 'backups'>('overview');
  const [tabDirection, setTabDirection] = useState(0);

  const handleTabChange = (newTab: typeof activeTab) => {
    if (newTab === activeTab) return;
    const tabIds = TABS.map(t => t.id);
    const currentIndex = tabIds.indexOf(activeTab);
    const newIndex = tabIds.indexOf(newTab);
    setTabDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <AnimatedBackground />

      <div className="glass-panel p-6 flex flex-col gap-6 z-10 border-b-0 rounded-b-none">
        <div className="flex justify-between items-center relative z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => useServerStore.getState().setActiveServerId(null)} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center group" 
              title="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeServer.name}</h2>
            <span className="bg-[#f0c14b]/20 text-[#f0c14b] border border-[#f0c14b]/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ml-2">Palworld</span>
          </div>
          
          <div className="flex gap-3 items-center">
            <div className="flex glass-panel rounded-lg overflow-hidden transition-all duration-300 ease-out hover:border-white/30 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`relative overflow-hidden group px-4 py-2.5 transition-all flex items-center justify-center ${tunnelStatus === 'Online' ? 'bg-brand/10 text-brand hover:bg-brand/20' : tunnelStatus === 'Starting...' ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
                <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
              </button>
              <button onClick={() => { setTempTunnelIp(tunnelIp); setShowTunnelModal(true); }} className="px-3 border-l border-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center" title="Tunnel IP Settings">
                <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
              </button>
            </div>
            
            <button onClick={() => deleteServer(activeServer.id)} className="relative overflow-hidden group glass-panel px-6 py-2.5 rounded-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
              <span className="relative z-10">DELETE</span>
            </button>
            
            <button onClick={() => activeServer.status === 'Online' ? stopServer(activeServer.id) : startServer(activeServer.id)} className={`relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 ${activeServer.status === 'Online' ? 'hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300' : 'hover:border-green-500/60 hover:shadow-[0_8px_32px_rgba(74,222,128,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-green-400 hover:text-green-300'}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
              <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
            </button>
            
            <button onClick={() => restartServer(activeServer.id)} className="relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:border-brand/60 hover:shadow-[0_8px_32px_rgba(76,175,80,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-brand hover:text-green-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
              <span className="relative z-10">RESTART</span>
            </button>
          </div>
        </div>

        {/* Sub Top Nav Bar for Server Tabs */}
        <div className="w-full pb-1">
          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer>
            <div className="flex items-center gap-2 min-w-max pt-2 pb-2 px-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-300 ease-out whitespace-nowrap hover:-translate-y-1 hover:scale-105 ${
                    activeTab === tab.id 
                    ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(76,175,80,0.1)]' 
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
    </div>
  );
};
