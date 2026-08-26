import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

import { useServerStore } from '../../../../store/useServerStore';
import { useDayzModStore } from '../../../../store/useDayzModStore';
import { useDayzMods } from '../../../../hooks/useDayzMods';

interface DayzModsTabProps {
  onNavigateToInstalled: () => void;
}

export const DayzModsTab: React.FC<DayzModsTabProps> = ({ onNavigateToInstalled }) => {
  const { activeServerId } = useServerStore();
  const { pendingDownloads, removePendingDownload } = useDayzModStore();

  const {
    searchQuery, setSearchQuery,
    activeCategory,
    results,
    hasMore,
    selectedTags, setSelectedTags,
    installedMods,
    workshopPath, setWorkshopPath,
    isImporting,
    loading,
    loadMoreRef,
    downloadProgress,
    steamCreds, setSteamCreds,
    rememberMe, setRememberMe,
    showCreds, setShowCreds,
    installingMod,
    viewingMod, setViewingMod,
    handleSearch,
    handleCategoryChange,
    handleInstall,
    handleUninstall,
    handleBrowseWorkshop,
    handleImportWorkshop,
    stripBBCode
  } = useDayzMods(onNavigateToInstalled);

  const categories = [
    { id: 9, label: 'Most Popular' },
    { id: 14, label: 'Most Subscribed' },
    { id: 1, label: 'New' },
    { id: 99, label: 'Import Local Mods' },
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
          <select 
            value={selectedTags.length > 0 ? selectedTags[0] : ''}
            onChange={(e) => {
              const val = e.target.value;
              const newTags = val ? [val] : [];
              setSelectedTags(newTags);
              handleSearch(undefined, undefined, 1, newTags);
            }}
            className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl px-4 py-2.5 text-white outline-none focus:border-red-500/50 shadow-inner min-w-[200px] cursor-pointer"
          >
            <option value="" className="bg-[#1a1a1a] text-white">All Mod Types</option>
            {modTypes.map(({ label, tag }) => (
              <option key={tag} value={tag} className="bg-[#1a1a1a] text-white">{label}</option>
            ))}
          </select>
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
                      if (mod) handleInstall(mod);
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
                const progress = activeServerId ? (pendingDownloads[activeServerId]?.[mod.id] || downloadProgress[mod.id]) : downloadProgress[mod.id];

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
                                  if (removePendingDownload && activeServerId) removePendingDownload(activeServerId, mod.id);
                                }}
                                className="text-[10px] text-red-400 hover:text-red-300 ml-2"
                                title="Clear stuck download"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </div>
                            <div className="h-1 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                              <div
                                className={`h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all duration-300 ${ ((progress as any)?.progress ?? (progress as any)?.percent ?? 0) === 0 ? 'animate-pulse w-full' : ''}`}
                                style={{ width: `${((progress as any)?.progress ?? (progress as any)?.percent ?? 0)}%` }}
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
