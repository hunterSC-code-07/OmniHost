import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { PendingDownload } from '../DayzHub';

interface DayzModsTabProps {
  activeServerId: number;
  pendingDownloads?: Record<string, PendingDownload>;
  addPendingDownload?: (mod: any) => void;
  removePendingDownload?: (modId: string) => void;
  updatePendingProgress?: (modId: string, progress: number, msg: string) => void;
}

export const DayzModsTab: React.FC<DayzModsTabProps> = ({ 
  activeServerId,
  pendingDownloads,
  addPendingDownload,
  removePendingDownload,
  updatePendingProgress
}) => {
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
  const [steamCreds, setSteamCreds] = useState(() => {
    try {
      const saved = localStorage.getItem('omnihost_steam_creds');
      return saved ? JSON.parse(atob(saved)) : { username: '', password: '', steamGuard: '' };
    } catch {
      return { username: '', password: '', steamGuard: '' };
    }
  });
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('omnihost_steam_creds'));
  const [showCreds, setShowCreds] = useState(false);
  const [installingMod, setInstallingMod] = useState<string | null>(null);
  const [viewingMod, setViewingMod] = useState<any | null>(null);

  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const currentTagLabel = selectedTags.length > 0 
    ? modTypes.find(m => m.tag === selectedTags[0])?.label || 'All Mod Types'
    : 'All Mod Types';
useEffect(() => {
    // Load installed mods and popular mods only once on mount or when server changes
    loadInstalledMods();
    setPage(1);
    setSelectedTags([]);
    handleSearch('', 9, 1, []);
    setActiveCategory(9);
  }, [activeServerId]);

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
    { id: 99, label: 'Import Local Mods' },
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

      setInstallingMod(mod.id);
      const startMsg = `Starting batch download for ${modsToInstall.length} mods...`;
      setDownloadProgress(prev => ({
        ...prev,
        [mod.id]: { percent: 0, msg: startMsg }
      }));
      
      if (addPendingDownload) {
        // Add all mods in the batch to pending downloads
        modsToInstall.forEach((m: any) => addPendingDownload(m));
      }

      const batchMods = modsToInstall.map((m: any) => ({
        modId: m.id || m.publishedfileid,
        modTitle: m.title
      }));

      await window.api.installDayzMods(
        activeServerId,
        batchMods,
        steamCreds.username,
        steamCreds.password,
        steamCreds.steamGuard || undefined
      );

      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[mod.id];
        return next;
      });

      // Clear steam guard code after use since it's a one-time thing
      setSteamCreds(prev => ({ ...prev, steamGuard: '' }));

      // Refresh installed mods
      await loadInstalledMods();
      
      if (removePendingDownload) {
        modsToInstall.forEach((m: any) => removePendingDownload(m.id || m.publishedfileid));
      }
    } catch (e: any) {
      if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
        alert('Steam Guard code is required. Please check your email or Steam app for the code and enter it in the credentials box.');
        setShowCreds(true);
      } else if (e.message?.includes('LOGIN_REQUIRED')) {
        setInstallingMod(null);
        setShowCreds(true);
        return;
      } else if (e.message?.includes('ENOSPC')) {
        alert("Installation failed: Your hard drive has run out of space.\n\nDayZ mods require significant storage. Please free up some space on your disk and try again. The installation will instantly resume where it left off!");
        return;
      } else {
        alert(`Failed to install mods: ${e.message}`);
      }
      
      // Cleanup pending downloads on error
      if (removePendingDownload) {
        modsToInstall.forEach((m: any) => removePendingDownload(m.id || m.publishedfileid));
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
          <div className="relative min-w-[200px]" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-red-500/50 shadow-inner cursor-pointer transition-all"
            >
              <span className="font-medium text-sm">{currentTagLabel}</span>
              <span className="material-symbols-outlined text-[20px] text-gray-400 transition-transform duration-200" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212]/95 backdrop-blur-xl border border-red-500/30 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.2)] overflow-hidden z-[100] flex flex-col">
                <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="max-h-[300px] flex flex-col">
                  <button
                    onClick={() => {
                      setSelectedTags([]);
                      setIsDropdownOpen(false);
                      handleSearch(undefined, undefined, 1, []);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-white/5 ${selectedTags.length === 0 ? 'bg-red-500/20 text-red-400 font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    All Mod Types
                  </button>
                  {modTypes.map(({ label, tag }) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags([tag]);
                        setIsDropdownOpen(false);
                        handleSearch(undefined, undefined, 1, [tag]);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-white/5 last:border-b-0 ${selectedTags.includes(tag) ? 'bg-red-500/20 text-red-400 font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </OverlayScrollbarsComponent>
              </div>
            )}
          </div>
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
              className={`pb-3 text-sm font-bold transition-colors relative ${activeCategory === cat.id
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
            <input type="text" placeholder="Username" value={steamCreds.username} onChange={e => setSteamCreds({ ...steamCreds, username: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm flex-1 min-w-[200px] text-white outline-none focus:border-red-500/50" />
            <input type="password" placeholder="Password" value={steamCreds.password} onChange={e => setSteamCreds({ ...steamCreds, password: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm flex-1 min-w-[200px] text-white outline-none focus:border-red-500/50" />
            <input type="text" placeholder="Steam Guard (if needed)" value={steamCreds.steamGuard} onChange={e => setSteamCreds({ ...steamCreds, steamGuard: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm w-48 text-white outline-none focus:border-red-500/50" />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-white/10 bg-surface-container-highest text-primary focus:ring-primary focus:ring-offset-surface-container-high"
                />
                Remember Me
              </label>
              <button
                onClick={() => {
                  if (steamCreds.username && steamCreds.password) {
                    if (rememberMe) {
                      localStorage.setItem('omnihost_steam_creds', btoa(JSON.stringify({ username: steamCreds.username, password: steamCreds.password, steamGuard: '' })));
                    } else {
                      localStorage.removeItem('omnihost_steam_creds');
                    }
                    setShowCreds(false);
                    if (installingMod) {
                      const mod = viewingMod || results.find(r => r.id === installingMod);
                      if (mod) executeInstall(mod);
                    }
                  } else {
                    alert('Username and password are required.');
                  }
                }}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 text-sm font-bold shadow transition-colors"
              >
                Start Download
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        
        
        {activeCategory === 99 ? (
          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 custom-scrollbar p-6">
            <div className="bg-black/60 backdrop-blur-xl border border-red-500/30 rounded-xl p-8 flex flex-col gap-6 shadow-[0_0_30px_rgba(220,38,38,0.15)] max-w-4xl mx-auto mt-8">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-3"><span className="material-symbols-outlined text-red-500">drive_folder_upload</span> Import Local Mods</h3>
                <p className="text-gray-400 text-sm mt-2">Select your DayZ game folder to automatically find and import your client mods. This is useful if you are moving a server or already have mods downloaded via the DayZ Launcher.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  className="flex-1 bg-black/40 text-white px-4 py-3 rounded-lg border border-white/10 outline-none focus:border-red-500/50 text-sm shadow-inner"
                  placeholder="e.g. C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ"
                  value={workshopPath}
                  onChange={(e) => setWorkshopPath(e.target.value)}
                />
                <button
                  onClick={handleBrowseWorkshop}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10 text-sm font-bold"
                >
                  Browse
                </button>
                <button
                  onClick={handleImportWorkshop}
                  disabled={!workshopPath || isImporting}
                  className="px-6 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors border border-red-500/30 hover:border-red-400 text-sm font-bold disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.15)]"
                >
                  {isImporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">drive_folder_upload</span>
                  )}
                  Import All
                </button>
              </div>
            </div>
          </OverlayScrollbarsComponent>
        ) : (
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map(mod => {
                const isInstalled = installedMods.find(m => String(m.id) === String(mod.id));
                const progress = pendingDownloads?.[mod.id] || downloadProgress[mod.id];

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
                          <div className="w-full mt-auto">
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-[10px] text-red-400 font-bold truncate">{progress?.msg || 'Downloading...'}</div>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (removePendingDownload) removePendingDownload(mod.id);
                                }}
                                className="text-[10px] text-red-400 hover:text-red-300 ml-2"
                                title="Clear stuck download"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </div>
                            <div className="h-1 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                              <div
                                className={`h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all duration-300 ${ (progress?.progress ?? progress?.percent ?? 0) === 0 ? 'animate-pulse w-full' : ''}`}
                                style={{ width: `${(progress?.progress ?? progress?.percent ?? 0)}%` }}
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
                              className={`text-xs px-4 py-1.5 rounded-lg font-bold transition-all flex-1 text-center ${isInstalled
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
        )}
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
