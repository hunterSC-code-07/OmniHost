import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

interface DayzModsTabProps {
  activeServerId: number;
}

export const DayzModsTab: React.FC<DayzModsTabProps> = ({ activeServerId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number>(9);
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [installedMods, setInstalledMods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = React.useRef(null);
  const [downloadProgress, setDownloadProgress] = useState<{ [id: string]: { percent: number, msg: string } }>({});
  const [steamCreds, setSteamCreds] = useState({ username: '', password: '', steamGuard: '' });
  const [showCreds, setShowCreds] = useState(false);
  const [installingMod, setInstallingMod] = useState<string | null>(null);
  const [viewingMod, setViewingMod] = useState<any | null>(null);

  useEffect(() => {
    // Load installed mods and popular mods only once on mount or when server changes
    loadInstalledMods();
    setPage(1);
    setSelectedTags([]);
    handleSearch('', 9, 1, []);
    setActiveCategory(9);
  }, [activeServerId]);

  useEffect(() => {
    // Listen to download progress
    window.api.onDownloadProgress(activeServerId, (percent: number, msg?: string) => {
      setDownloadProgress(prev => {
        if (installingMod) {
          return {
            ...prev,
            [installingMod]: { percent, msg: msg || '' }
          };
        }
        return prev;
      });
    });

    return () => {};
  }, [activeServerId, installingMod]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore && results.length > 0) {
        handleSearch(undefined, undefined, page + 1, undefined);
      }
    }, { threshold: 0.1 });
    
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, page, results.length]);

  const loadInstalledMods = async () => {
    // We would ask the main process for installed mods here.
    // For now we'll just implement a basic version.
    const mods = await window.api.getDayzInstalledMods(activeServerId);
    if (mods) {
      setInstalledMods(mods);
    }
  };

  const handleSearch = async (queryOverride?: string, categoryOverride?: number, pageOverride: number = 1, tagsOverride?: string[]) => {
    const queryToUse = queryOverride !== undefined ? queryOverride : searchQuery;
    const categoryToUse = categoryOverride !== undefined ? categoryOverride : activeCategory;
    const tagsToUse = tagsOverride !== undefined ? tagsOverride : selectedTags;
    
    if (pageOverride === 1) {
      setResults([]);
      setHasMore(true);
    }
    
    setLoading(true);
    const res = await window.api.searchSteamWorkshop(queryToUse, categoryToUse, pageOverride, tagsToUse);
    
    if (res && res.length > 0) {
      if (pageOverride === 1) {
        setResults(res);
      } else {
        setResults(prev => [...prev, ...res]);
      }
      setPage(pageOverride);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  };

  const handleCategoryChange = (categoryId: number) => {
    setActiveCategory(categoryId);
    handleSearch(undefined, categoryId, 1, undefined);
  };

  const categories = [
    { id: 9, label: 'Most Popular' },
    { id: 14, label: 'Most Subscribed' },
    { id: 1, label: 'New' },
  ];

  const modTypes = [
    { label: 'Animation', tag: 'Animation' },
    { label: 'Character', tag: 'Character' },
    { label: 'Economy', tag: 'Economy' },
    { label: 'Environment', tag: 'Environment' },
    { label: 'Equipment', tag: 'Equipment' },
    { label: 'Mechanics', tag: 'Mechanics' },
    { label: 'Sound', tag: 'Sound' },
    { label: 'Props', tag: 'Props' },
    { label: 'Vehicle', tag: 'Vehicle' },
    { label: 'Weapon', tag: 'Weapon' },
    { label: 'Map / Terrain', tag: 'Terrain' }
  ];

  const handleInstall = async (mod: any) => {
    if (!steamCreds.username || !steamCreds.password) {
      setShowCreds(true);
      return;
    }

    setInstallingMod(mod.id);
    setDownloadProgress(prev => ({
      ...prev,
      [mod.id]: { percent: 0, msg: 'Starting download...' }
    }));

    try {
      // Fetch dependencies
      const dependencies = await window.api.getModDependencies(mod.id);
      let modsToInstall = [mod];
      
      if (dependencies && dependencies.length > 0) {
        // Exclude already installed mods
        const missingDeps = dependencies.filter(depId => !installedMods.find(m => m.id === depId));
        
        if (missingDeps.length > 0) {
          const depDetails = await window.api.getWorkshopItemDetails(missingDeps);
          if (depDetails && depDetails.length > 0) {
            const depNames = depDetails.map((d: any) => d.title).join(', ');
            const confirmInstall = confirm(`This mod requires the following dependencies:\n\n${depNames}\n\nDo you want to install them automatically?`);
            if (confirmInstall) {
               // Install dependencies BEFORE the main mod
               modsToInstall = [...depDetails, mod]; 
            }
          }
        }
      }

      for (const m of modsToInstall) {
        setInstallingMod(m.id);
        setDownloadProgress(prev => ({
          ...prev,
          [m.id]: { percent: 0, msg: `Starting download: ${m.title}...` }
        }));

        await window.api.installDayzMod(
          activeServerId,
          m.id,
          m.title,
          steamCreds.username,
          steamCreds.password,
          steamCreds.steamGuard || undefined
        );
        
        setDownloadProgress(prev => {
          const next = { ...prev };
          delete next[m.id];
          return next;
        });
      }
      
      // Clear steam guard code after use since it's a one-time thing
      setSteamCreds(prev => ({ ...prev, steamGuard: '' }));

      // Refresh installed mods
      await loadInstalledMods();
    } catch (e: any) {
      if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
        alert('Steam Guard code is required. Please check your email or Steam app for the code and enter it in the credentials box.');
        setShowCreds(true);
      } else if (e.message && e.message.includes('LOGIN_REQUIRED')) {
        alert(`SteamCMD Login Failed:\n${e.message}\n\nPlease check your credentials. Note: You MUST own DayZ on this Steam account to download mods!`);
        setShowCreds(true);
      } else {
        alert(`Failed to install mod: ${e.message}`);
      }
    } finally {
      setInstallingMod(null);
      // Clean up any remaining progress in case of error
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[mod.id];
        return next;
      });
    }
  };

  const handleUninstall = async (modId: string) => {
    if (confirm('Are you sure you want to uninstall this mod?')) {
      await window.api.uninstallDayzMod(activeServerId, modId);
      await loadInstalledMods();
    }
  };

  const stripBBCode = (text: string) => {
    if (!text) return '';
    return text.replace(/\[\/?(b|i|u|s|h\d|url|img|list|code|quote|spoiler|\*|hr)(?:=[^\]]+)?\]/gi, '');
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-body text-white">
      <div className="p-6 flex flex-col gap-4">
        <div className="flex gap-3">
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(undefined, undefined, 1, undefined)}
            placeholder="Search Steam Workshop..."
            className="flex-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-xl px-4 py-2.5 text-white outline-none focus:border-red-500/50 shadow-inner"
          />
          <button 
            onClick={() => handleSearch(undefined, undefined, 1, undefined)}
            disabled={loading}
            className="bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 hover:border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.1)] px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className="flex gap-6 border-b border-white/5 mt-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`pb-3 text-sm font-bold transition-colors relative ${
                activeCategory === cat.id 
                  ? 'text-red-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
              {activeCategory === cat.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {showCreds && (
        <div className="p-6 bg-black/60 backdrop-blur-xl border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.15)] m-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">lock</span>
              <span className="text-white font-bold text-lg">Steam Login Required</span>
            </div>
            <button onClick={() => setShowCreds(false)} className="text-gray-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            DayZ Workshop mods require a Steam account that owns the game. Your credentials are used locally by SteamCMD.
          </p>
          <div className="flex gap-3 items-center flex-wrap mt-2">
            <input type="text" placeholder="Username" value={steamCreds.username} onChange={e => setSteamCreds({...steamCreds, username: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm flex-1 min-w-[200px] text-white outline-none focus:border-red-500/50" />
            <input type="password" placeholder="Password" value={steamCreds.password} onChange={e => setSteamCreds({...steamCreds, password: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm flex-1 min-w-[200px] text-white outline-none focus:border-red-500/50" />
            <input type="text" placeholder="Steam Guard (if needed)" value={steamCreds.steamGuard} onChange={e => setSteamCreds({...steamCreds, steamGuard: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm w-48 text-white outline-none focus:border-red-500/50" />
            <button 
              onClick={() => {
                if (steamCreds.username && steamCreds.password) {
                  setShowCreds(false);
                } else {
                  alert('Username and password are required.');
                }
              }} 
              className="bg-red-500 text-black border border-red-400 px-6 py-2.5 rounded-lg hover:bg-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] text-sm font-bold transition-all"
            >
              Save Credentials
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden flex flex-row">
        {/* Sidebar */}
        <div className="w-64 bg-black/20 backdrop-blur-md border-r border-white/5 flex flex-col hidden md:flex shrink-0">
          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-6">
            <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">Mod Type</h3>
            <div className="flex flex-col gap-4">
              {modTypes.map(({ label, tag }) => (
                <label key={tag} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-white/20 bg-black/40 text-red-500 focus:ring-red-500 focus:ring-offset-0 cursor-pointer appearance-none transition-all checked:bg-red-500/20 checked:border-red-500/50"
                      checked={selectedTags.includes(tag)}
                      onChange={(e) => {
                        const newTags = e.target.checked 
                          ? [...selectedTags, tag] 
                          : selectedTags.filter(t => t !== tag);
                        setSelectedTags(newTags);
                        handleSearch(undefined, undefined, 1, newTags);
                      }}
                    />
                    {selectedTags.includes(tag) && <span className="material-symbols-outlined absolute text-[14px] text-red-400 pointer-events-none">check</span>}
                  </div>
                  <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </OverlayScrollbarsComponent>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map(mod => {
              const isInstalled = installedMods.find(m => m.id === mod.id);
              const progress = downloadProgress[mod.id];

              return (
                <div key={mod.id} className="bg-black/30 backdrop-blur-sm border border-white/5 hover:border-red-500/30 hover:bg-black/50 transition-colors shadow-lg rounded-xl p-4 flex gap-4 group">
                  {mod.thumbnail ? (
                    <img src={mod.thumbnail} alt={mod.title} className="w-20 h-20 object-cover rounded-lg bg-black/50 shadow-md group-hover:scale-105 transition-transform shrink-0" />
                  ) : (
                    <div className="w-20 h-20 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                      <span className="material-symbols-outlined text-gray-500 text-3xl">extension</span>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between overflow-hidden min-w-0">
                    <div>
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-red-300 transition-colors" title={mod.title}>{mod.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">{stripBBCode(mod.description) || 'No description'}</p>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      {progress ? (
                        <div className="w-full">
                          <div className="text-[10px] text-red-400 mb-1 font-bold truncate">{progress.msg}</div>
                          <div className="h-1 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                            <div 
                              className={`h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all duration-300 ${progress.percent === 0 ? 'animate-pulse w-full' : ''}`} 
                              style={{ width: progress.percent === 0 ? '100%' : `${progress.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <button 
                            onClick={() => setViewingMod(mod)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10 flex items-center justify-center"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-[16px]">info</span>
                          </button>
                          <button 
                            onClick={() => isInstalled ? handleUninstall(mod.id) : handleInstall(mod)}
                            disabled={installingMod !== null && installingMod !== mod.id}
                            className={`text-xs px-4 py-1.5 rounded-lg font-bold transition-all flex-1 text-center ${
                              isInstalled 
                              ? 'bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30' 
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 hover:border-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                            } disabled:opacity-50`}
                          >
                            {isInstalled ? 'Uninstall' : 'Install'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {results.length === 0 && !loading && (
              <div className="col-span-full text-center text-on-surface-variant py-8 opacity-50">
                <span className="material-symbols-outlined text-4xl mb-2">search</span>
                <p>Search for DayZ mods on Steam Workshop</p>
              </div>
            )}
            
            {hasMore && results.length > 0 && (
              <div ref={loadMoreRef} className="col-span-full py-6 flex justify-center items-center">
                {loading && <span className="text-primary text-sm font-medium animate-pulse">Loading more mods...</span>}
              </div>
            )}
          </div>
        </OverlayScrollbarsComponent>
        </div>
      </div>

      {/* Mod Details Modal */}
      {viewingMod && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.15)] rounded-xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">info</span>
                Mod Details
              </h2>
              <button onClick={() => setViewingMod(null)} className="text-gray-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {viewingMod.thumbnail ? (
                  <img src={viewingMod.thumbnail} alt={viewingMod.title} className="w-full md:w-64 md:h-64 object-cover rounded-lg bg-black/50 shadow-md shrink-0 border border-white/5" />
                ) : (
                  <div className="w-full md:w-64 md:h-64 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center shadow-md shrink-0">
                    <span className="material-symbols-outlined text-gray-500 text-6xl">extension</span>
                  </div>
                )}
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 truncate">{viewingMod.title}</h3>
                    <div className="flex gap-2">
                      <span className="text-xs bg-red-900/30 text-red-400 border border-red-500/30 px-2 py-1 rounded">Workshop Mod</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed mt-2 bg-black/20 p-4 rounded-lg border border-white/5 font-mono">
                    {stripBBCode(viewingMod.description) || 'No description available for this mod.'}
                  </div>
                </div>
              </div>
            </OverlayScrollbarsComponent>
            
            <div className="p-4 border-t border-white/5 flex justify-end shrink-0 bg-black/20">
              <button 
                onClick={() => setViewingMod(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
