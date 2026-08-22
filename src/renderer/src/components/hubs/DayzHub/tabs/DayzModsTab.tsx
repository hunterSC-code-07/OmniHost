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
  const [workshopPath, setWorkshopPath] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = React.useRef(null);
  const [downloadProgress, setDownloadProgress] = useState<{ [id: string]: { percent: number, msg: string } }>({});
  const [steamCreds, setSteamCreds] = useState({ username: '', password: '', steamGuard: '' });
  const [showCreds, setShowCreds] = useState(false);
  const [installingMod, setInstallingMod] = useState<string | null>(null);

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

  const handleBrowseWorkshop = async () => {
    const path = await window.api.selectWorkshopFolder();
    if (path) {
      setWorkshopPath(path);
    }
  };

  const handleImportWorkshop = async () => {
    if (!workshopPath) return;
    setIsImporting(true);
    try {
      const count = await window.api.importLocalWorkshop(activeServerId, workshopPath);
      alert(`Successfully imported ${count} mods from your !Workshop folder!\n\nNote: They have been marked as 'DISABLED' by default so your server doesn't crash on startup. Go to the 'Installed Mods' tab to enable the ones you want.`);
      loadInstalledMods();
    } catch (e: any) {
      console.error(e);
      alert('Failed to import local workshop mods: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(undefined, undefined, 1, undefined)}
            placeholder="Search Steam Workshop..."
            className="flex-1 bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-on-surface"
          />
          <button 
            onClick={() => handleSearch(undefined, undefined, 1, undefined)}
            disabled={loading}
            className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded hover:bg-primary/30"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className="flex gap-4 border-b border-white/5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`pb-2 text-sm font-medium transition-colors ${
                activeCategory === cat.id 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {showCreds && (
        <div className="p-4 bg-surface-container-high border border-white/10 m-4 rounded flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-on-surface font-bold">Steam Login Required</span>
            <button onClick={() => setShowCreds(false)} className="text-xs text-gray-400 hover:text-white">Close</button>
          </div>
          <span className="text-on-surface-variant text-sm">
            DayZ Workshop mods require a Steam account that owns the game. Your credentials are used locally by SteamCMD.
          </span>
          <div className="flex gap-2 items-center flex-wrap">
            <input type="text" placeholder="Username" value={steamCreds.username} onChange={e => setSteamCreds({...steamCreds, username: e.target.value})} className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[200px] text-on-surface" />
            <input type="password" placeholder="Password" value={steamCreds.password} onChange={e => setSteamCreds({...steamCreds, password: e.target.value})} className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[200px] text-on-surface" />
            <input type="text" placeholder="Steam Guard (if needed)" value={steamCreds.steamGuard} onChange={e => setSteamCreds({...steamCreds, steamGuard: e.target.value})} className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm w-48 text-on-surface" />
            <button 
              onClick={() => {
                if (steamCreds.username && steamCreds.password) {
                  setShowCreds(false);
                } else {
                  alert('Username and password are required.');
                }
              }} 
              className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded hover:bg-primary/30 text-sm font-bold"
            >
              Save Credentials
            </button>
          </div>
        </div>
      )}

      {/* Local Workshop Import */}
      <div className="bg-surface-container rounded-xl p-4 border border-white/5 flex flex-col gap-3 mx-4 mb-4">
        <div>
          <h3 className="text-on-surface font-medium">Import Local Mods</h3>
          <p className="text-on-surface-variant text-sm mt-1">Select your DayZ game folder to automatically find and import your client mods.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text"
            className="flex-1 bg-surface-container-high text-on-surface px-4 py-2 rounded-lg border border-white/10 outline-none focus:border-primary/50 text-sm"
            placeholder="e.g. C:\Program Files (x86)\Steam\steamapps\common\DayZ"
            value={workshopPath}
            onChange={(e) => setWorkshopPath(e.target.value)}
          />
          <button 
            onClick={handleBrowseWorkshop}
            className="px-4 py-2 bg-surface-container-highest hover:bg-surface-container-highest/80 text-on-surface rounded-lg transition-colors border border-white/10 text-sm font-medium"
          >
            Browse
          </button>
          <button 
            onClick={handleImportWorkshop}
            disabled={!workshopPath || isImporting}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isImporting ? (
               <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-on-primary"></div>
            ) : (
               <span className="material-symbols-outlined text-[18px]">drive_folder_upload</span>
            )}
            Import All
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-row">
        {/* Sidebar */}
        <div className="w-56 bg-surface-container border-r border-white/5 flex flex-col hidden md:flex shrink-0">
          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} className="flex-1 p-4">
            <h3 className="text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Mod Type</h3>
            <div className="flex flex-col gap-3">
              {modTypes.map(({ label, tag }) => (
                <label key={tag} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-white/20 bg-surface-container-highest text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer"
                    checked={selectedTags.includes(tag)}
                    onChange={(e) => {
                      const newTags = e.target.checked 
                        ? [...selectedTags, tag] 
                        : selectedTags.filter(t => t !== tag);
                      setSelectedTags(newTags);
                      handleSearch(undefined, undefined, 1, newTags);
                    }}
                  />
                  <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </OverlayScrollbarsComponent>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} className="flex-1">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map(mod => {
              const isInstalled = installedMods.find(m => m.id === mod.id);
              const progress = downloadProgress[mod.id];

              return (
                <div key={mod.id} className="bg-surface-container-high border border-white/5 rounded p-3 flex gap-3">
                  {mod.thumbnail ? (
                    <img src={mod.thumbnail} alt={mod.title} className="w-16 h-16 object-cover rounded bg-black/50" />
                  ) : (
                    <div className="w-16 h-16 bg-surface-container-highest rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-500">extension</span>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface truncate" title={mod.title}>{mod.title}</h3>
                      <p className="text-xs text-on-surface-variant truncate">{mod.description || 'No description'}</p>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      {progress ? (
                        <div className="w-full">
                          <div className="text-[10px] text-primary mb-1 truncate">{progress.msg}</div>
                          <div className="h-1 w-full bg-surface-container-highest rounded overflow-hidden relative">
                            <div 
                              className={`h-full bg-primary transition-all duration-300 ${progress.percent === 0 ? 'animate-pulse w-full' : ''}`} 
                              style={{ width: progress.percent === 0 ? '100%' : `${progress.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => isInstalled ? handleUninstall(mod.id) : handleInstall(mod)}
                          disabled={installingMod !== null && installingMod !== mod.id}
                          className={`text-xs px-3 py-1 rounded font-bold ${
                            isInstalled 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {isInstalled ? 'Uninstall' : 'Install'}
                        </button>
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
    </div>
  );
};
