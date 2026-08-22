import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

interface DayzInstalledModsTabProps {
  activeServerId: number;
}

export const DayzInstalledModsTab: React.FC<DayzInstalledModsTabProps> = ({ activeServerId }) => {
  const [mods, setMods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingMission, setDownloadingMission] = useState<string | null>(null);

  const [steamCreds, setSteamCreds] = useState({ username: '', password: '', steamGuard: '' });
  const [showCreds, setShowCreds] = useState(false);
  const [pendingDeps, setPendingDeps] = useState<any[]>([]);
  const [installingDep, setInstallingDep] = useState<string | null>(null);
  const [depProgress, setDepProgress] = useState<{ percent: number, msg: string } | null>(null);

  useEffect(() => {
    window.api.onDownloadProgress(activeServerId, (percent: number, msg?: string) => {
      setDepProgress(prev => {
        if (installingDep) {
          return { percent, msg: msg || '' };
        }
        return prev;
      });
    });
    return () => {};
  }, [activeServerId, installingDep]);

  const handleToggleMap = async (folderName: string, currentIsMap: boolean) => {
    await window.api.toggleDayzMapMod(activeServerId, folderName, !currentIsMap);
    loadInstalledMods();
  };

  const handleDownloadMission = async (modId: string) => {
    if (downloadingMission) return;
    setDownloadingMission(modId);
    try {
      await window.api.downloadDayzMission(activeServerId, modId);
    } catch (e: any) {
      console.error(e);
      alert('Failed to download mission files: ' + e.message);
    } finally {
      setDownloadingMission(null);
    }
  };

  const handleExtractLocalMission = async (modId: string, localMissionsPath: string) => {
    if (downloadingMission) return;
    setDownloadingMission(modId);
    try {
      await window.api.extractDayzLocalMission(activeServerId, localMissionsPath);
      alert('Mission files extracted and applied successfully!');
    } catch (e: any) {
      console.error(e);
      alert('Failed to extract mission files: ' + e.message);
    } finally {
      setDownloadingMission(null);
    }
  };

  const handleToggleModStatus = async (mod: any) => {
    const isEnabling = mod.isDisabled;
    await window.api.toggleDayzModStatus(activeServerId, mod.folderName, !isEnabling);

    if (isEnabling && mod.id && /^\d+$/.test(mod.id)) {
      try {
        const dependencies = await window.api.getModDependencies(mod.id);
        if (dependencies && dependencies.length > 0) {
          const installedDeps = mods.filter(m => dependencies.includes(m.id));
          const missingDepIds = dependencies.filter(depId => !mods.find(m => m.id === depId));
          
          let enabledCount = 0;
          for (const installedDep of installedDeps) {
            if (installedDep.isDisabled) {
              await window.api.toggleDayzModStatus(activeServerId, installedDep.folderName, false);
              enabledCount++;
            }
          }

          if (missingDepIds.length > 0) {
            const depDetails = await window.api.getWorkshopItemDetails(missingDepIds);
            if (depDetails && depDetails.length > 0) {
              const depNames = depDetails.map((d: any) => d.title).join(', ');
              const confirmInstall = confirm(`This mod requires the following missing dependencies:\n\n${depNames}\n\nDo you want to install them automatically?`);
              if (confirmInstall) {
                setPendingDeps(depDetails);
                if (!steamCreds.username || !steamCreds.password) {
                  setShowCreds(true);
                } else {
                  handleInstallDependencies(depDetails);
                }
                // Return early so we don't reload installed mods yet
                return;
              }
            }
          } else if (enabledCount > 0) {
            // Optional: alert(`Automatically enabled ${enabledCount} installed dependencies.`);
          }
        }
      } catch (e) {
        console.error("Failed to process dependencies", e);
      }
    }
    
    loadInstalledMods();
  };

  const handleInstallDependencies = async (depsToInstall: any[] = pendingDeps) => {
    setShowCreds(false);
    for (const m of depsToInstall) {
      setInstallingDep(m.id);
      setDepProgress({ percent: 0, msg: `Starting download: ${m.title}...` });

      try {
        await window.api.installDayzMod(
          activeServerId,
          m.id,
          m.title,
          steamCreds.username,
          steamCreds.password,
          steamCreds.steamGuard || undefined
        );
      } catch (e: any) {
        if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
          alert('Steam Guard code is required. Please check your email or Steam app for the code and enter it in the credentials box.');
          setShowCreds(true);
          return;
        } else if (e.message && e.message.includes('LOGIN_REQUIRED')) {
          alert(`SteamCMD Login Failed:\n${e.message}\n\nPlease check your credentials.`);
          setShowCreds(true);
          return;
        } else {
          alert(`Failed to install dependency ${m.title}: ${e.message}`);
        }
      }
    }
    
    setSteamCreds(prev => ({ ...prev, steamGuard: '' }));
    setInstallingDep(null);
    setDepProgress(null);
    setPendingDeps([]);
    await loadInstalledMods();
  };

  useEffect(() => {
    loadInstalledMods();
  }, [activeServerId]);

  const loadInstalledMods = async () => {
    setLoading(true);
    try {
      const basicMods = await window.api.getDayzInstalledMods(activeServerId);
      
      // Fetch rich details from Steam API for mods that have a Workshop ID
      const workshopIds = basicMods
        .filter((m: any) => m.id && /^\d+$/.test(m.id))
        .map((m: any) => m.id);

      let detailedMods: any[] = [];
      if (workshopIds.length > 0) {
        detailedMods = await window.api.getWorkshopItemDetails(workshopIds);
      }

      // Merge basic details with rich details and sort: enabled first, then alphabetically
      const mergedMods = basicMods.map((basicMod: any) => {
        const detail = detailedMods.find((d: any) => d.publishedfileid === basicMod.id);
        if (detail) {
          return {
            ...basicMod,
            title: detail.title || basicMod.title,
            preview_url: detail.preview_url,
            file_size: detail.file_size,
            tags: detail.tags,
            description: detail.description
          };
        }
        return basicMod;
      }).sort((a: any, b: any) => {
        if (a.isDisabled === b.isDisabled) {
           return (a.title || a.folderName || '').localeCompare(b.title || b.folderName || '', undefined, { sensitivity: 'base' });
        }
        return a.isDisabled ? 1 : -1;
      });

      setMods(mergedMods);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openWorkshopPage = (id: string) => {
    if (/^\d+$/.test(id)) {
      window.open(`https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-container-low">
      <div className="p-4 border-b border-white/10 bg-surface-container flex items-center justify-between">
        <h2 className="text-lg font-bold text-on-surface">Installed Mods ({mods.length})</h2>
        <button 
          onClick={loadInstalledMods}
          className="p-2 rounded-lg bg-surface-container-highest hover:bg-surface-container-high transition-colors"
          title="Refresh"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">refresh</span>
        </button>
      </div>

      {installingDep && depProgress && (
        <div className="mx-4 my-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-primary">Installing Dependencies...</span>
            <span className="text-xs text-primary">{Math.round(depProgress.percent)}%</span>
          </div>
          <div className="text-xs text-on-surface-variant mb-2 truncate">{depProgress.msg}</div>
          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${depProgress.percent}%` }}
            ></div>
          </div>
        </div>
      )}

      {showCreds && (
        <div className="p-4 bg-surface-container-high border border-primary/30 mx-4 my-2 rounded-xl flex flex-col gap-3 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-on-surface font-bold text-primary">Steam Login Required</span>
            <button onClick={() => setShowCreds(false)} className="text-xs text-on-surface-variant hover:text-white">Close</button>
          </div>
          <span className="text-on-surface-variant text-sm">
            Installing Workshop dependencies requires a Steam account that owns the game.
          </span>
          <div className="flex gap-2 items-center flex-wrap">
            <input type="text" placeholder="Username" value={steamCreds.username} onChange={e => setSteamCreds({...steamCreds, username: e.target.value})} className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[150px] text-on-surface outline-none focus:border-primary/50" />
            <input type="password" placeholder="Password" value={steamCreds.password} onChange={e => setSteamCreds({...steamCreds, password: e.target.value})} className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[150px] text-on-surface outline-none focus:border-primary/50" />
            <input type="text" placeholder="Steam Guard Code (if prompted)" value={steamCreds.steamGuard} onChange={e => setSteamCreds({...steamCreds, steamGuard: e.target.value})} className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm w-48 text-on-surface outline-none focus:border-primary/50" />
            <button 
              onClick={() => {
                if (steamCreds.username && steamCreds.password) {
                  handleInstallDependencies();
                } else {
                  alert('Username and password are required.');
                }
              }} 
              className="bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 text-sm font-bold shadow transition-colors"
            >
              Continue Installation
            </button>
          </div>
        </div>
      )}

      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : mods.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant text-center">
            <span className="material-symbols-outlined text-[48px] opacity-50 mb-4">folder_off</span>
            <p className="font-medium text-lg">No mods installed</p>
            <p className="text-sm opacity-70 mt-1">Install mods from the Workshop tab</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mods.map((mod, i) => (
              <div key={i} className={`bg-surface-container rounded-xl overflow-hidden border flex flex-col group transition-all relative ${mod.isDisabled ? 'border-red-500/30 opacity-75 grayscale-[50%]' : 'border-white/5 hover:border-white/20'}`}>
                {/* Mod Status Toggle (Top Right) */}
                <div className="absolute top-2 right-2 z-10 flex items-center bg-black/60 rounded-full pr-2 pl-1 py-1 gap-2">
                  <div 
                    onClick={() => handleToggleModStatus(mod)}
                    className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${mod.isDisabled ? 'bg-surface-container-highest' : 'bg-primary'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${mod.isDisabled ? 'translate-x-0' : 'translate-x-4'}`} />
                  </div>
                  <span className={`text-[10px] font-bold ${mod.isDisabled ? 'text-gray-400' : 'text-primary'}`}>
                    {mod.isDisabled ? 'DISABLED' : 'ENABLED'}
                  </span>
                </div>

                {mod.isMap && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-lg z-10 border border-green-500/30">
                    MAP
                  </div>
                )}
                {mod.preview_url ? (
                  <div 
                    className="h-32 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${mod.preview_url})` }}
                  />
                ) : (
                  <div className="h-32 bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-30">extension</span>
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-on-surface text-sm truncate mb-1" title={mod.title}>{mod.title}</h3>
                  <div className="text-xs text-on-surface-variant font-mono truncate mb-3" title={mod.folderName}>{mod.folderName}</div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {mod.tags && mod.tags.slice(0, 3).map((tag: any, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface-variant rounded text-[10px] uppercase font-bold">
                        {tag.tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 mt-auto mb-3">
                    <button 
                      onClick={() => handleToggleMap(mod.folderName, mod.isMap)}
                      className={`text-xs py-1.5 px-3 rounded-lg border transition-colors ${mod.isMap ? 'border-primary text-primary bg-primary/10 hover:bg-primary/20' : 'border-white/10 text-on-surface-variant hover:bg-white/5'}`}
                    >
                      {mod.isMap ? 'Unmark as Map' : 'Mark as Map'}
                    </button>
                    
                    {mod.isMap && ['2289456201', '1602372402', '2699824632'].includes(mod.id) && (
                      <button 
                        onClick={() => handleDownloadMission(mod.id)}
                        disabled={downloadingMission === mod.id}
                        className="text-xs py-1.5 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingMission === mod.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary"></div>
                        ) : (
                          <span className="material-symbols-outlined text-[14px]">download</span>
                        )}
                        Download Mission
                      </button>
                    )}

                    {mod.isMap && mod.hasLocalMissions && (
                      <button 
                        onClick={() => handleExtractLocalMission(mod.id, mod.localMissionsPath)}
                        disabled={downloadingMission === mod.id}
                        className="text-xs py-1.5 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-primary/30 text-primary"
                      >
                        {downloadingMission === mod.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary"></div>
                        ) : (
                          <span className="material-symbols-outlined text-[14px]">folder_zip</span>
                        )}
                        Extract Mission
                      </button>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    {mod.file_size && (
                      <span className="text-[10px] text-on-surface-variant opacity-70">
                        {(parseInt(mod.file_size) / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openWorkshopPage(mod.id)}
                        className="text-[10px] font-bold text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        WORKSHOP
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </OverlayScrollbarsComponent>
    </div>
  );
};
