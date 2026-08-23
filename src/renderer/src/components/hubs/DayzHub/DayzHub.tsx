import React, { useState, useEffect, useRef } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import { DayzConsoleTab } from './tabs/DayzConsoleTab';
import { DayzOptionsTab } from './tabs/DayzOptionsTab';
import { DayzEconomyTab } from './tabs/DayzEconomyTab';
import { DayzModsTab } from './tabs/DayzModsTab';
import { DayzInstalledModsTab } from './tabs/DayzInstalledModsTab';
import { DayzFilesTab } from './tabs/DayzFilesTab';
import { motion, AnimatePresence } from 'motion/react';
import { DayzAnimatedBackground } from './DayzAnimatedBackground';

export interface PendingDownload {
  mod: any;
  progress: number;
  msg: string;
}

interface DayzHubProps {
  activeServerId: number;
  activeServer: any;
  setActiveServerId: React.Dispatch<React.SetStateAction<number | null>>;
  handleStart: (id: number) => void;
  handleStop: (id: number) => void;
  handleRestart: (id: number) => void;
  handleDelete: (id: number) => void;
  handleTunnel: () => void;
  radminIp: string | null;
  logs: any[];
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  onlinePlayers: Record<string, string[]>;
  statsHistory: Record<string, { cpu: number, ram: number }[]>;
}

export const DayzHub: React.FC<DayzHubProps> = ({
  activeServerId,
  activeServer,
  setActiveServerId,
  handleStart,
  handleStop,
  handleRestart,
  handleDelete,
  handleTunnel,
  radminIp,
  logs,
  setLogs,
  onlinePlayers,
  statsHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'options' | 'economy' | 'mods' | 'installed' | 'files'>('console');
  const [tabDirection, setTabDirection] = useState(0);
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const handleTabChange = (newTab: typeof activeTab) => {
    if (newTab === activeTab) return;
    const TABS = ['console', 'options', 'economy', 'mods', 'installed', 'files'];
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    setTabDirection(newIndex > currentIndex ? 1 : -1);
    setIsTabTransitioning(true);
    setActiveTab(newTab);
    setTimeout(() => setIsTabTransitioning(false), 350);
  };

  const endOfLogsRef = useRef<HTMLDivElement>(null);

  const [pendingDownloads, setPendingDownloads] = useState<Record<string, PendingDownload>>(() => {
    try {
      const stored = sessionStorage.getItem(`pendingDownloads_${activeServerId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    sessionStorage.setItem(`pendingDownloads_${activeServerId}`, JSON.stringify(pendingDownloads));
  }, [pendingDownloads, activeServerId]);

  const addPendingDownload = (mod: any) => {
    setPendingDownloads(prev => ({
      ...prev,
      [mod.id || mod.publishedfileid]: { ...mod, progress: 0, msg: 'Starting download...' }
    }));
    if (activeTab !== 'installed') {
      handleTabChange('installed');
    }
  };

  const removePendingDownload = (modId: string) => {
    setPendingDownloads(prev => {
      const next = { ...prev };
      delete next[modId];
      return next;
    });
  };

  const updatePendingProgress = (modId: string, progress: number, msg: string) => {
    setPendingDownloads(prev => {
      if (!prev[modId]) return prev;
      return {
        ...prev,
        [modId]: { ...prev[modId], progress, msg }
      };
    });
  };

  useEffect(() => {
    window.api.onDownloadProgress(activeServerId, (percent: number, msg?: string) => {
      let currentModId: string | null = null;
      let cleanMsg = msg || '';
      
      const match = cleanMsg.match(/^\[MOD:(\d+)\]\s*(.*)$/);
      if (match) {
        currentModId = match[1];
        cleanMsg = match[2];
      }

      if (currentModId) {
        setPendingDownloads(prev => {
          if (!prev[currentModId!]) return prev;
          
          if (cleanMsg.includes('already downloaded')) {
            return {
              ...prev,
              [currentModId!]: { ...prev[currentModId!], progress: 100, msg: 'Cached, waiting for batch...' }
            };
          }
          
          return {
            ...prev,
            [currentModId!]: { ...prev[currentModId!], progress: percent, msg: cleanMsg }
          };
        });
      }
    });
    
    return () => { };
  }, [activeServerId]);

  useEffect(() => {
    // Scroll to bottom when logs change
    if (activeTab === 'console') {
      endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);



  const handleSendCommand = (cmd: string) => {
    window.api.sendCommand(activeServerId, cmd);
  };

  const handleClearLogs = () => {
    setLogs(prev => prev.filter(l => l.id !== activeServerId.toString() && l.id !== 'global'));
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden dayz-scrollbars">
      <DayzAnimatedBackground />

      <div className="glass-panel p-6 flex flex-col gap-6 z-10 border-b-0 rounded-b-none">
        <div className="flex justify-between items-center relative z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveServerId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center group" title="Back to Dashboard">
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeServer.name}</h2>
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ml-2">DayZ</span>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex glass-panel rounded-lg overflow-hidden transition-all duration-300 hover:border-white/30 hover:-translate-y-1 hover:scale-105">
              {radminIp && (
                <div className="px-4 py-2.5 flex items-center justify-center text-brand font-bold text-sm bg-brand/5 border-r border-white/10" title="Radmin VPN IP (Share with friends)">
                  IP: {radminIp}
                </div>
              )}
              <button onClick={handleTunnel} title="Open Radmin VPN" className="relative overflow-hidden group px-4 py-2.5 transition-all flex items-center justify-center text-brand hover:bg-brand/10">
                <span className="material-symbols-outlined text-[20px] leading-none">lan</span>
              </button>
            </div>
            <button onClick={() => handleDelete(activeServerId)} className="relative overflow-hidden group glass-panel px-6 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
              <span className="relative z-10">DELETE</span>
            </button>
            <button onClick={() => activeServer.status === 'Online' ? handleStop(activeServerId) : handleStart(activeServerId)} className={`relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 ${activeServer.status === 'Online' ? 'hover:border-red-500/60 text-red-400 hover:text-red-300 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2)]' : 'hover:border-green-500/60 text-green-400 hover:text-green-300 hover:shadow-[0_8px_32px_rgba(74,222,128,0.2)]'}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
              <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
            </button>
            <button onClick={() => handleRestart(activeServerId)} className="relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-brand/60 text-brand hover:text-green-300 hover:shadow-[0_8px_32px_rgba(74,222,128,0.2)]">
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
                { id: 'console', label: 'Console', icon: 'terminal' },
                { id: 'options', label: 'Options', icon: 'settings' },
                { id: 'economy', label: 'Economy', icon: 'storefront' },
                { id: 'mods', label: 'Workshop', icon: 'extension' },
                { id: 'installed', label: 'Installed Mods', icon: 'inventory_2' },
                { id: 'files', label: 'Files', icon: 'folder' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-300 ease-out whitespace-nowrap hover:-translate-y-1 hover:scale-105 ${activeTab === tab.id
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
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
              {activeTab === 'console' && (
                <DayzConsoleTab
                  logs={activeServerId ? logs.filter(l => l.id === activeServerId.toString() || l.id === 'global').map(l => l.msg) : []}
                  endOfLogsRef={endOfLogsRef}
                  handleSendCommand={handleSendCommand}
                  handleClearLogs={handleClearLogs}
                  onlinePlayers={onlinePlayers[activeServerId] || []}
                  onPlayerClick={() => { }}
                />
              )}
              {activeTab === 'options' && (
                <DayzOptionsTab activeServerId={activeServerId} />
              )}
              {activeTab === 'economy' && (
                <DayzEconomyTab activeServerId={activeServerId} />
              )}
              {activeTab === 'mods' && (
                <DayzModsTab 
                  activeServerId={activeServerId} 
                  pendingDownloads={pendingDownloads}
                  addPendingDownload={addPendingDownload}
                  removePendingDownload={removePendingDownload}
                  updatePendingProgress={updatePendingProgress}
                />
              )}
              {activeTab === 'installed' && (
                <DayzInstalledModsTab 
                  activeServerId={activeServerId} 
                  pendingDownloads={pendingDownloads}
                  addPendingDownload={addPendingDownload}
                  removePendingDownload={removePendingDownload}
                />
              )}
              {activeTab === 'files' && (
                <DayzFilesTab activeServerId={activeServerId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
