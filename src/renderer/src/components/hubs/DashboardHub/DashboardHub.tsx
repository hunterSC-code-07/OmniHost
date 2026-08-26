import { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { motion, AnimatePresence } from 'motion/react';

const DayzModStatus = ({ serverId }: { serverId: number }) => {
  const [modCount, setModCount] = useState<number | null>(null);
  useEffect(() => {
    // @ts-ignore
    window.api.dayz.getInstalledMods(serverId).then((mods: any[]) => {
      setModCount(mods.length);
    }).catch(() => setModCount(0));
  }, [serverId]);

  return (
    <span className="text-on-surface font-bold bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
      {modCount === null ? 'Checking...' : modCount > 0 ? `${modCount} Detected` : 'None'}
    </span>
  );
};

import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { useModalStore } from '../../../store/useModalStore';
import { useToastStore } from '../../../store/useToastStore';

export function DashboardHub({ getGameImageUrl, isGameSupported }: any) {
  const { servers, setActiveServerId, startServer, stopServer, restartServer, deleteServer } = useServerStore();
  const { activeGameHub, setHoveredGame, setActiveGameHub, tunnelIp, isDayzCached, setIsDayzCached } = useUiStore();
  const { setShowCreateModal, setShowSteamLoginModal, setSteamLoginAction } = useModalStore();
  const { showToast } = useToastStore();

  const handleStart = startServer;
  const handleStop = stopServer;
  const handleRestart = restartServer;
  const handleDelete = deleteServer;
  return (

    <div className="relative w-full h-full flex-1 min-h-0">
      <AnimatePresence>
        {activeGameHub === null ? (
                <motion.div 
            key="dashboard" 
            initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full flex flex-col min-h-0"
          >
            <OverlayScrollbarsComponent 
              className="flex-1 w-full block min-h-0"
              options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
              defer
            >
      <div className="w-full flex flex-col relative min-h-full pb-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Header */}
        <div className="px-gutter pt-stack-lg pb-stack-md relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
          <div>
            <p className="font-label-md text-label-md text-primary tracking-widest uppercase mb-2">Command Center</p>
            <h1 className="font-headline-xl text-headline-xl text-on-background mb-2">Welcome back, <span className="text-primary">Admin</span>.</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Select a Game Hub below to initiate configuration or view your active instances in the list.</p>
          </div>
        </div>

        {/* Game Hub Cards */}
        <div className="px-gutter py-stack-md relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Minecraft Hub */}
            <div onMouseEnter={() => setHoveredGame('Minecraft')} onMouseLeave={() => setHoveredGame(null)} onClick={() => setActiveGameHub('Minecraft')} className="group relative rounded-xl overflow-hidden bg-surface-container h-[250px] flex flex-col justify-end transition-all duration-300 hover:shadow-[0_0_30px_rgba(76,175,80,0.15)] ring-1 hover:ring-primary cursor-pointer ring-surface-container-high">
              <motion.div layoutId={`game-bg-Minecraft`} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: `url('${getGameImageUrl('Minecraft')}')`}}></motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-60"></div>
              <div className="relative z-20 p-6 flex flex-col gap-2 w-full">
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1 shadow-black drop-shadow-md">Game Hub</p>
                <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight group-hover:text-primary transition-colors drop-shadow-lg shadow-black">Minecraft</h2>
              </div>
            </div>

            {/* Palworld Hub */}
            <div onMouseEnter={() => setHoveredGame('Palworld')} onMouseLeave={() => setHoveredGame(null)} onClick={() => setActiveGameHub('Palworld')} className="group relative rounded-xl overflow-hidden bg-surface-container h-[250px] flex flex-col justify-end transition-all duration-300 hover:shadow-[0_0_30px_rgba(66,192,255,0.2)] ring-1 hover:ring-[#42c0ff] cursor-pointer ring-surface-container-high">
              <motion.div layoutId={`game-bg-Palworld`} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: `url('${getGameImageUrl('Palworld')}')`}}></motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-60"></div>
              <div className="relative z-20 p-6 flex flex-col gap-2 w-full">
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1 shadow-black drop-shadow-md">Game Hub</p>
                <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight group-hover:text-[#42c0ff] transition-colors drop-shadow-lg shadow-black">Palworld</h2>
              </div>
            </div>

            {/* DayZ Hub */}
            <div onMouseEnter={() => setHoveredGame('DayZ')} onMouseLeave={() => setHoveredGame(null)} onClick={() => setActiveGameHub('DayZ')} className="group relative rounded-xl overflow-hidden bg-surface-container h-[250px] flex flex-col justify-end transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] ring-1 hover:ring-red-500 cursor-pointer ring-surface-container-high">
              <motion.div layoutId={`game-bg-DayZ`} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: `url('${getGameImageUrl('DayZ')}')`}}></motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-60"></div>
              <div className="relative z-20 p-6 flex flex-col gap-2 w-full">
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1 shadow-black drop-shadow-md">Game Hub</p>
                <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight group-hover:text-red-400 transition-colors drop-shadow-lg shadow-black">DayZ</h2>
              </div>
            </div>

            {/* Satisfactory Hub */}
            <div onMouseEnter={() => setHoveredGame('Satisfactory')} onMouseLeave={() => setHoveredGame(null)} onClick={() => setActiveGameHub('Satisfactory')} className="group relative rounded-xl overflow-hidden bg-surface-container h-[250px] flex flex-col justify-end transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,149,73,0.2)] ring-1 hover:ring-[#fa9549] cursor-pointer ring-surface-container-high">
              <motion.div layoutId={`game-bg-Satisfactory`} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: `url('${getGameImageUrl('Satisfactory')}')`}}></motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-60"></div>
              <div className="relative z-20 p-6 flex flex-col gap-2 w-full">
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1 shadow-black drop-shadow-md">Game Hub</p>
                <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight group-hover:text-[#fa9549] transition-colors drop-shadow-lg shadow-black">Satisfactory</h2>
              </div>
            </div>

          </div>
        </div>

        {/* Server List */}
        <div className="px-gutter pt-stack-lg pb-stack-lg relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Active Deployments</h2>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-label-sm">
                <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
              </button>
            </div>
          </div>
          
          <div className="bg-surface-container/30 border border-outline-variant/30 rounded-2xl overflow-hidden backdrop-blur-md">
            {servers.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">dns</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">No servers found</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Select a Game Hub above to create and configure your first dedicated server instance.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Server Name</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Game</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Type / Version</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Address</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servers.map((server, idx) => (
                      <tr 
                        key={server.id} 
                        className={`border-b border-outline-variant/20 hover:bg-surface-container/50 transition-colors cursor-pointer group ${idx === servers.length - 1 ? 'border-none' : ''}`}
                        onClick={() => setActiveServerId(server.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${server.status === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500/50'}`}></span>
                            <span className={`font-label-sm tracking-widest uppercase ${server.status === 'Online' ? 'text-green-400' : 'text-on-surface-variant'}`}>{server.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">{server.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-surface-container-highest overflow-hidden border border-outline-variant/30">
                              <img src={getGameImageUrl(server.game)} className="w-full h-full object-cover" alt="Game Icon" />
                            </div>
                            <span className="font-body-md text-on-surface-variant">{server.game}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {server.game === 'DayZ' ? (
                            <span className="font-body-md text-on-surface-variant flex items-center gap-2">
                              Mods: <DayzModStatus serverId={server.id} />
                            </span>
                          ) : (
                            <span className="font-body-md text-on-surface-variant">{server.type} {server.version}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-label-sm tracking-wider font-mono text-on-surface">
                          {server.game === 'DayZ' ? (
                            <span className="opacity-30">--</span>
                          ) : (
                            `${tunnelIp}:${server.port || 25565}`
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            {server.status === 'Offline' ? (
                              <button onClick={() => handleStart(server.id)} className="w-8 h-8 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center justify-center transition-colors" title="Start Server">
                                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                              </button>
                            ) : (
                              <>
                                <button onClick={() => handleRestart(server.id)} className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-colors" title="Restart Server">
                                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                </button>
                                <button onClick={() => handleStop(server.id)} className="w-8 h-8 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Stop Server">
                                  <span className="material-symbols-outlined text-[18px]">stop</span>
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDelete(server.id)} className="w-8 h-8 rounded bg-surface-container-highest text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors ml-2" title="Delete Server">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
            </OverlayScrollbarsComponent>
          </motion.div>
        ) : (
          <motion.div 
            key="game-hub"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full flex flex-col min-h-0"
          >
            <OverlayScrollbarsComponent 
              className="flex-1 w-full block min-h-0"
              options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
              defer
            >
<div className="w-full flex flex-col relative min-h-full pb-8">
        <motion.div layoutId={`game-bg-${activeGameHub}`} initial={{ opacity: 1 }} animate={{ opacity: 0.15 }} exit={{ opacity: 1 }} className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{backgroundImage: `url('${getGameImageUrl(activeGameHub)}')`}}></motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40 z-0 pointer-events-none"></div>
        
        <div className="relative z-10 px-gutter pt-stack-lg pb-stack-lg flex flex-col gap-6">
          <button onClick={() => setActiveGameHub(null)} className="self-start flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md uppercase tracking-widest mb-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Dashboard
          </button>
          
          {isGameSupported(activeGameHub) ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-surface-container-high pb-6">
                <div>
                  <h1 className="font-headline-xl text-headline-xl text-on-background">{activeGameHub} Hub</h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-2">Manage your available {activeGameHub} servers or create a new one.</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="bg-primary text-on-primary hover:bg-primary/90 transition-all px-8 py-3 rounded-xl font-label-lg text-label-lg flex items-center gap-2 shadow-[0_0_20px_rgba(76,175,80,0.3)] hover:scale-105 active:scale-95">
                  <span className="material-symbols-outlined">add_box</span>
                  NEW {activeGameHub.toUpperCase()} SERVER
                </button>
              </div>

              {activeGameHub === 'DayZ' && (
                <div className="flex flex-col md:flex-row items-center gap-4 mt-4 bg-surface-container p-6 rounded-xl border border-outline-variant/30">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">DayZ Base Installation Cache</h3>
                    <p className="text-sm text-gray-400 mt-1">Download and manage the base server files here. Future servers will copy these files to avoid re-downloading.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center ml-auto">
                    {!isDayzCached ? (
                      <button 
                        onClick={() => { setSteamLoginAction('cache'); setShowSteamLoginModal(true); }} 
                        className="px-5 py-2.5 bg-brand/10 text-brand border border-brand/30 rounded-lg hover:bg-brand/20 font-bold transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Download Base
                      </button>
                    ) : (
                      <>
                        <div className="px-5 py-2.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg font-bold flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          Downloaded
                        </div>
                        <button 
                          onClick={() => { setSteamLoginAction('cache'); setShowSteamLoginModal(true); }} 
                          className="px-5 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 font-bold transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">sync</span>
                          Update Base
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete the cached DayZ base files?")) {
                               // @ts-ignore
                               await window.api.steam.deleteCache(223350);
                               setIsDayzCached(false);
                               showToast("DayZ Base Files Deleted.");
                            }
                          }} 
                          className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 font-bold transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Delete Base
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              
                {servers.filter((s: any) => s.game.includes(activeGameHub)).length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant">dns</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">No {activeGameHub} servers found</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Click the "NEW {activeGameHub.toUpperCase()} SERVER" button above to create one.</p>
                  </div>
                ) : (
                    <div className="flex flex-col gap-4">
                      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Available Servers</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {servers.filter((s: any) => s.game.includes(activeGameHub)).map((server: any) => (
                          <div key={server.id} onClick={() => setActiveServerId(server.id)} className="group relative rounded-xl overflow-hidden glass-panel p-6 flex flex-col gap-4 border border-surface-container-high hover:border-primary transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                            <div className="flex justify-between items-start">
                              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">{server.name}</h3>
                              <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-surface-container-highest">
                                {server.status === 'Online' ? (
                                  <><span className="w-2 h-2 rounded-full bg-[#4CAF50] shadow-[0_0_8px_rgba(76,175,80,0.8)]"></span><span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Online</span></>
                                ) : (
                                  <><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span><span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Offline</span></>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 mt-4">
                              {server.game !== 'DayZ' && (
                                <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
                                  <span className="material-symbols-outlined text-lg text-primary">cell_tower</span>
                                  <span className="font-mono text-on-surface tracking-wider">{tunnelIp}:{server.port || 25565}</span>
                                </div>
                              )}
                              
                              <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-container-high/60">
                                {server.game === 'DayZ' ? (
                                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-label-sm">
                                    <span className="flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-base opacity-70">extension</span>
                                      Mods:
                                    </span>
                                    <DayzModStatus serverId={server.id} />
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between text-xs text-on-surface-variant font-label-sm">
                                      <span className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base opacity-70">memory</span>
                                        Software:
                                      </span>
                                      <span className="text-on-surface font-bold bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
                                        {server.type || 'Vanilla'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-on-surface-variant font-label-sm">
                                      <span className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base opacity-70">tag</span>
                                        Version:
                                      </span>
                                      <span className="text-on-surface font-bold bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
                                        {server.version || '1.20.4'}{server.loaderVersion ? ` (${server.loaderVersion})` : ''}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-surface-container-high flex justify-end">
                              <button className="text-primary font-label-md text-label-md uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                                Manage <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                )}
            </>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-surface-container-high pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      Under Development
                    </span>
                  </div>
                  <h1 className="font-headline-xl text-headline-xl text-on-background">{activeGameHub} Hub</h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-1">
                    Dedicated server orchestration and automated deployment for {activeGameHub}.
                  </p>
                </div>
              </div>

              <div className="glass-panel p-8 md:p-12 rounded-2xl border border-surface-container-high flex flex-col items-center text-center max-w-3xl mx-auto my-6 relative overflow-hidden">
                <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center mb-6 ring-1 ring-outline-variant/40 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                  <span className="material-symbols-outlined text-4xl text-primary animate-pulse">engineering</span>
                </div>
                
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-3">
                  {activeGameHub} Hub is Under Development
                </h2>
                
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-8 leading-relaxed">
                  Dedicated server installation, live console telemetry, mod loading, and automatic port tunneling for {activeGameHub} are currently in active development and will be available in an upcoming update.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mb-8">
                  <div className="p-4 rounded-xl bg-surface-container/60 border border-surface-container-high">
                    <span className="material-symbols-outlined text-primary text-xl mb-2">dns</span>
                    <h4 className="font-bold text-sm text-on-surface">Automated Server</h4>
                    <p className="text-xs text-on-surface-variant mt-1">One-click server deployment and updates</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container/60 border border-surface-container-high">
                    <span className="material-symbols-outlined text-primary text-xl mb-2">tune</span>
                    <h4 className="font-bold text-sm text-on-surface">Configuration</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Full graphical server properties editor</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container/60 border border-surface-container-high">
                    <span className="material-symbols-outlined text-primary text-xl mb-2">monitoring</span>
                    <h4 className="font-bold text-sm text-on-surface">Live Telemetry</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Real-time metrics, logs, and player list</p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveGameHub(null)} 
                  className="bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-all px-8 py-3 rounded-xl font-label-md text-label-md flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
            </OverlayScrollbarsComponent>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
