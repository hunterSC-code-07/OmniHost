import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import { ConsoleTab } from '../../tabs/ConsoleTab';
import { OptionsTab } from '../../tabs/OptionsTab';
import { PlayersTab } from '../../tabs/PlayersTab';
import { FilesTab } from '../../tabs/FilesTab';
import { BackupsTab } from '../../tabs/BackupsTab';
import { OverviewTab } from '../../tabs/OverviewTab';
import { AnimatedBackground } from '../../AnimatedBackground';

import { ModsTab } from '../../tabs/ModsTab';
import { SoftwareTab } from '../../tabs/SoftwareTab';

import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';

import { useModalStore } from '../../../store/useModalStore';

export function MinecraftHub() {
  const activeServerId = useServerStore(s => s.activeServerId);
  const servers = useServerStore(s => s.servers);
  const startServer = useServerStore(s => s.startServer);
  const stopServer = useServerStore(s => s.stopServer);
  const restartServer = useServerStore(s => s.restartServer);
  const deleteServer = useServerStore(s => s.deleteServer);
  
  const currentServer = servers.find(s => s.id === activeServerId);
  const prevServerRef = useRef(currentServer);
  if (currentServer) {
    prevServerRef.current = currentServer;
  }
  const activeServer = currentServer || prevServerRef.current;
  
  if (!activeServer) return null;
  const tunnelStatus = useUiStore(s => s.tunnelStatus);
  const tunnelIp = useUiStore(s => s.tunnelIp);
  const setTempTunnelIp = useUiStore(s => s.setTempTunnelIp);
  const setShowTunnelModal = useModalStore(s => s.setShowTunnelModal);
  const handleStart = startServer;
  const handleStop = stopServer;
  const handleRestart = restartServer;
  const handleDelete = deleteServer;
  const handleTunnel = async () => {};
  const onRedirectToCreateModpack = () => {};

        const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'options' | 'players' | 'software' | 'mods' | 'files' | 'backups'>('overview');
        const [tabDirection, setTabDirection] = useState(0);
        const handleTabChange = (newTab: typeof activeTab) => {
          if (newTab === activeTab) return;
          const TABS = ['overview', 'console', 'options', 'players', 'mods', 'software', 'files', 'backups'];
          const currentIndex = TABS.indexOf(activeTab);
          const newIndex = TABS.indexOf(newTab);
          setTabDirection(newIndex > currentIndex ? 1 : -1);
          setActiveTab(newTab);
        };


  const [showModpackPrompt, setShowModpackPrompt] = useState(false);
  const [serverMeta, setServerMeta] = useState<any>(null);

  const fetchServerMeta = async () => {
    if (activeServerId === null) return;
    // @ts-ignore
    const meta = await window.api.server.getServerMeta(activeServerId);
    setServerMeta(meta);
  };

  useEffect(() => {
    if (activeServerId !== null) {
      fetchServerMeta();
    } else {
      setServerMeta(null);
    }
  }, [activeServerId]);

  useEffect(() => {
    if (activeTab === 'mods' && serverMeta?.type === 'Vanilla') {
      setActiveTab('overview');
    }
  }, [activeTab, serverMeta?.type]);

  return (
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* MODPACK REDIRECT PROMPT MODAL */}
        {showModpackPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">
              
              {/* Glow effects */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand/20 rounded-full blur-[60px] pointer-events-none"></div>
  
              <div className="p-8 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-brand shadow-[inset_0_0_15px_rgba(76,175,80,0.2)]">
                    <span className="material-symbols-outlined text-3xl">info</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Change to Modpack</h2>
                    <p className="text-gray-400 text-sm">Action Recommended</p>
                  </div>
                </div>
                
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Moving existing vanilla or lightly-modded worlds into heavy CurseForge modpacks can be complicated and cause corruption. Would you like to create a <span className="text-white font-bold">new server</span> for your modpack instead?
                </p>
  
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowModpackPrompt(false)}
                    className="px-6 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-bold text-gray-400"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowModpackPrompt(false);
                      if (onRedirectToCreateModpack) onRedirectToCreateModpack();
                    }}
                    className="px-6 py-2.5 rounded-lg bg-brand hover:brightness-110 text-black transition-all font-bold shadow-[0_0_15px_rgba(76,175,80,0.3)]"
                  >
                    Create New Server
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
            <AnimatedBackground />
            
            <div className="glass-panel p-6 flex flex-col gap-6 z-10 border-b-0 rounded-b-none">
              <div className="flex justify-between items-center relative z-20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveServerId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center group" title="Back to Dashboard">
                    <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                  </button>
                  <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeServer.name}</h2>
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
                  <button onClick={() => handleDelete(activeServer.id)} className="relative overflow-hidden group glass-panel px-6 py-2.5 rounded-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
                    <span className="relative z-10">DELETE</span>
                  </button>
                  <button onClick={() => activeServer.status === 'Online' ? handleStop(activeServer.id) : handleStart(activeServer.id)} className={`relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 ${activeServer.status === 'Online' ? 'hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300' : 'hover:border-green-500/60 hover:shadow-[0_8px_32px_rgba(74,222,128,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-green-400 hover:text-green-300'}`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
                    <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
                  </button>
                  <button onClick={() => handleRestart(activeServer.id)} className="relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:border-brand/60 hover:shadow-[0_8px_32px_rgba(76,175,80,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-brand hover:text-green-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
                    <span className="relative z-10">RESTART</span>
                  </button>
                </div>
              </div>

              {/* Sub Top Nav Bar for Server Tabs */}
              <div className="w-full pb-1">
                <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer>
                  <div className="flex items-center gap-2 min-w-max pt-2 pb-2 px-1">
                    {[
                      { id: 'overview', label: 'Overview', icon: 'dashboard' },
                      { id: 'console', label: 'Console', icon: 'terminal' },
                      { id: 'options', label: 'Options', icon: 'settings' },
                      { id: 'players', label: 'Players', icon: 'group' },
                      { id: 'mods', label: 'Mods', icon: 'extension' },
                      { id: 'software', label: 'Software', icon: 'memory' },
                      { id: 'files', label: 'Files', icon: 'folder' },
                      { id: 'backups', label: 'Backups', icon: 'save' }
                    ].map(tab => {
                      const isModsTab = tab.id === 'mods';
                      const isVanilla = serverMeta?.type === 'Vanilla';
                      const isDisabled = isModsTab && isVanilla;

                      return (
                        <button
                          key={tab.id}
                          disabled={isDisabled}
                          onClick={() => handleTabChange(tab.id as any)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-300 ease-out whitespace-nowrap ${
                            isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:-translate-y-1 hover:scale-105'
                          } ${
                            activeTab === tab.id 
                            ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(76,175,80,0.1)]' 
                            : 'text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                          {tab.label}
                        </button>
                      );
                    })}
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
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <OverviewTab 
                  serverVersion={serverMeta ? `${serverMeta.type} ${serverMeta.version}` : 'Loading...'}
                  maxPlayers={activeServer.maxPlayers || 20}
                  maxRam={serverMeta?.ram ? Number(serverMeta.ram) : 4}
                  maxCpu={serverMeta?.cpu ? Number(serverMeta.cpu) : 4}
                />
              )}

              {/* TAB: CONSOLE */}
              {activeTab === 'console' && (
                <ConsoleTab 
                  isActive={activeTab === 'console'}
                  onPlayerClick={() => {
                    handleTabChange('players');
                  }}
                />
              )}

              {activeTab === 'options' && (
                <OptionsTab 
                  serverId={activeServer.id}
                  onConfigSaved={fetchServerMeta}
                />
              )}

              {activeTab === 'players' && (
                <PlayersTab />
              )}
              {/* TAB: FILES */}
              {activeTab === 'files' && (
                <FilesTab />
              )}
              {activeTab === 'backups' && (
                <BackupsTab />
              )}

              {activeTab === 'mods' && (
                <ModsTab serverMeta={serverMeta} />
              )}

              {/* TAB: SOFTWARE */}
              {activeTab === 'software' && (
                <SoftwareTab 
                  serverMeta={serverMeta} 
                  onSoftwareChanged={fetchServerMeta} 
                />
              )}
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
              </div>
  );
}