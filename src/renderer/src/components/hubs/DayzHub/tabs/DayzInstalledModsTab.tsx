import { useState } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useDayzInstalledMods } from '../../../../hooks/useDayzInstalledMods';
import { useDayzMissions } from '../../../../hooks/useDayzMissions';
import { useDayzModDependencies } from '../../../../hooks/useDayzModDependencies';
import { useDayzModOperations } from '../../../../hooks/useDayzModOperations';
import { useSteamCredentials } from '../../../../hooks/useSteamCredentials';
import { useDayzModStore } from '../../../../store/useDayzModStore';
import { DayzModModals } from './DayzModModals';

export const DayzInstalledModsTab: React.FC = () => {
  const [modalState, setModalState] = useState<{ type: string | null, data?: any }>({ type: null });
  const { pendingDownloads, removePendingDownload } = useDayzModStore();

  const { mods, loading, setLoading, loadInstalledMods, activeServerId } = useDayzInstalledMods();
  const { steamCreds, setSteamCreds, rememberMe, setRememberMe, showCreds, setShowCreds, saveCredentials } = useSteamCredentials();
  
  const { downloadingMission, handleDownloadMission, handleExtractLocalMission } = useDayzMissions(activeServerId, setModalState);
  
  const { installingDep, depProgress, checkingDeps, dependencyResult, setDependencyResult, handleInstallDependencies, executeMissingDepsInstall, handleCheckDependencies } = useDayzModDependencies(activeServerId, steamCreds, setShowCreds, setModalState, loadInstalledMods, mods);
  
  const { isRebuilding, handleToggleMap, handleToggleModStatus, handleUninstall, executeUninstall, handleUninstallAll, executeUninstallAll, handleRebuildLoadOrder, executeRebuildLoadOrder } = useDayzModOperations(
    activeServerId, 
    mods, 
    loadInstalledMods, 
    setLoading, 
    {
      onMissingDependencies: (depNames, depDetails) => setModalState({ type: 'MISSING_DEPS', data: { depNames, depDetails } }),
      onUninstallSingle: (modId, modName) => setModalState({ type: 'UNINSTALL_SINGLE', data: { modId, modName } }),
      onUninstallAll: () => setModalState({ type: 'UNINSTALL_ALL' }),
      onRebuildConfirm: () => setModalState({ type: 'REBUILD_CONFIRM' }),
      onRebuildSuccess: () => setModalState({ type: 'REBUILD_SUCCESS' }),
      onError: (message) => setModalState({ type: 'INFO', data: { message } })
    }
  );

  const openWorkshopPage = (id: string) => {
    if (/^\d+$/.test(id)) {
      window.open(`https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-body text-white">
      <div className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between shadow-sm">
        <h2 className="text-lg font-bold text-white">Installed Mods ({mods.length})</h2>
        <div className="flex gap-2">
          {mods.length > 0 && (
            <button
              onClick={handleUninstallAll}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-colors flex items-center gap-2 text-sm font-bold shadow"
              title="Delete All Installed Mods"
            >
              <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
              <span className="hidden sm:inline">Delete All</span>
            </button>
          )}
          <button
            onClick={handleRebuildLoadOrder}
            disabled={isRebuilding}
            className={`p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-colors flex items-center gap-2 text-sm font-bold shadow ${isRebuilding ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Fix Load Order (Rebuild Cache)"
          >
            <span className="material-symbols-outlined text-[20px]">{isRebuilding ? 'sync' : 'account_tree'}</span>
            <span className="hidden sm:inline">{isRebuilding ? 'Rebuilding...' : 'Fix Load Order'}</span>
          </button>
          <button
            onClick={loadInstalledMods}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="Refresh"
          >
            <span className="material-symbols-outlined text-[20px] text-gray-300">refresh</span>
          </button>
        </div>
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
            <input type="text" placeholder="Username" value={steamCreds.username} onChange={e => setSteamCreds({ ...steamCreds, username: e.target.value })} className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[150px] text-on-surface outline-none focus:border-primary/50" />
            <input type="password" placeholder="Password" value={steamCreds.password} onChange={e => setSteamCreds({ ...steamCreds, password: e.target.value })} className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[150px] text-on-surface outline-none focus:border-primary/50" />
            <input type="text" placeholder="Steam Guard Code (if prompted)" value={steamCreds.steamGuard} onChange={e => setSteamCreds({ ...steamCreds, steamGuard: e.target.value })} className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm w-48 text-on-surface outline-none focus:border-primary/50" />
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
                onClick={() => saveCredentials(
                  () => handleInstallDependencies(), 
                  (msg) => setModalState({ type: 'INFO', data: { message: msg } })
                )}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 text-sm font-bold shadow transition-colors"
              >
                Continue Installation
              </button>
            </div>
          </div>
        </div>
      )}

      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : mods.length === 0 && (!pendingDownloads || Object.keys(pendingDownloads).length === 0) ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center">
            <span className="material-symbols-outlined text-[48px] opacity-50 mb-4 text-red-500/50">folder_off</span>
            <p className="font-bold text-lg text-white">No mods installed</p>
            <p className="text-sm opacity-70 mt-1">Install mods from the Workshop tab</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeServerId && pendingDownloads[activeServerId] && Object.values(pendingDownloads[activeServerId]).map((pending: any) => {
              const mod = pending.mod || pending;
              const isInstalled = mods.some(m => String(m.id) === String(mod.id || mod.publishedfileid));
              if (isInstalled) return null; // Prevent duplicate rendering if installed list is updated early

              return (
                <div key={mod.id || mod.publishedfileid} className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-blue-500/50 flex flex-col group transition-all relative shadow-lg shadow-blue-500/10">
                  <div className="absolute top-2 right-2 z-10 flex items-center bg-black/60 rounded-full px-2 py-1 gap-2 border border-blue-500/30 animate-pulse">
                    <span className="text-[10px] font-bold text-blue-400">
                      DOWNLOADING...
                    </span>
                  </div>

                  {mod.preview_url || mod.thumbnail ? (
                    <div
                      className="h-32 bg-cover bg-center border-b border-white/5 opacity-70"
                      style={{ backgroundImage: `url(${mod.preview_url || mod.thumbnail})` }}
                    />
                  ) : (
                    <div className="h-32 bg-black/40 border-b border-white/5 flex items-center justify-center opacity-70">
                      <span className="material-symbols-outlined text-[48px] text-gray-500 opacity-30">extension</span>
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1 relative z-10 bg-inherit">
                    <h3 className="font-bold text-white text-sm truncate mb-3" title={mod.title}>{mod.title}</h3>
                    {mod.id && String(mod.id) !== '0' && (
                      <div className="text-[11px] text-gray-500 font-mono truncate bg-black/40 inline-block px-2 py-0.5 rounded border border-white/5 w-fit mb-3" title={`Mod ID: ${mod.id}`}>ID: {mod.id}</div>
                    )}
                    
                    <div className="w-full mt-auto mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-[10px] text-blue-400 font-bold truncate">{pending.msg}</div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (removePendingDownload && activeServerId) removePendingDownload(activeServerId, mod.id || mod.publishedfileid); 
                          }}
                          className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
                          title="Clear stuck download"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                      <div className="h-1.5 w-full bg-blue-900/30 rounded-full overflow-hidden border border-blue-500/20">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          style={{ width: `${pending.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {mods.map((mod, i) => (
              <div key={i} className={`bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border flex flex-col group transition-all relative shadow-lg ${mod.isDisabled ? 'border-red-500/30 opacity-75 grayscale-[50%]' : 'border-white/5 hover:border-red-500/30 hover:bg-black/50'}`}>
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
                    className="h-32 bg-cover bg-center border-b border-white/5 group-hover:scale-105 transition-transform origin-bottom"
                    style={{ backgroundImage: `url(${mod.preview_url})` }}
                  />
                ) : (
                  <div className="h-32 bg-black/40 border-b border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform origin-bottom">
                    <span className="material-symbols-outlined text-[48px] text-gray-500 opacity-30">extension</span>
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1 relative z-10 bg-inherit">
                  <h3 className="font-bold text-white text-sm truncate mb-1 group-hover:text-red-300 transition-colors" title={mod.title}>{mod.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="text-[11px] text-gray-500 font-mono truncate bg-black/40 inline-block px-2 py-0.5 rounded border border-white/5" title={mod.folderName}>{mod.folderName}</div>
                    {mod.id && String(mod.id) !== '0' && (
                      <div className="text-[11px] text-gray-500 font-mono truncate bg-black/40 inline-block px-2 py-0.5 rounded border border-white/5" title={`Mod ID: ${mod.id}`}>ID: {mod.id}</div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {mod.tags && mod.tags.slice(0, 3).map((tag: any, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-red-900/20 border border-red-500/20 text-red-300 rounded text-[10px] uppercase font-bold">
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

                    {mod.isMap && ['2289456201', '1602372402', '2699824632', '2938009193'].includes(mod.id) && (
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

                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
                    {mod.file_size && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        {(parseInt(mod.file_size) / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCheckDependencies(mod)}
                        disabled={checkingDeps === mod.id}
                        className="text-[10px] font-bold text-gray-300 hover:text-red-400 transition-colors flex items-center gap-1 bg-white/5 hover:bg-red-500/10 px-2 py-1 rounded border border-white/10 hover:border-red-500/30 disabled:opacity-50"
                      >
                        {checkingDeps === mod.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-500"></div>
                        ) : (
                          <span className="material-symbols-outlined text-[14px]">account_tree</span>
                        )}
                        CHECK DEPS
                      </button>
                      <button
                        onClick={() => openWorkshopPage(mod.id)}
                        className="text-[10px] font-bold text-gray-300 hover:text-red-400 transition-colors flex items-center gap-1 bg-white/5 hover:bg-red-500/10 px-2 py-1 rounded border border-white/10 hover:border-red-500/30"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        WORKSHOP
                      </button>
                      <button
                        onClick={() => handleUninstall(mod.folderName || mod.id, mod.title || mod.folderName || 'this mod')}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/20 hover:border-red-500/40"
                        title="Uninstall Mod"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        DELETE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </OverlayScrollbarsComponent>

      {dependencyResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.15)] rounded-xl w-full max-w-2xl max-h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">account_tree</span>
                Dependencies for {dependencyResult.modTitle}
              </h2>
              <button onClick={() => setDependencyResult(null)} className="text-gray-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} className="flex-1 p-6">
              <div className="flex flex-col gap-3">
                {dependencyResult.deps.map(dep => (
                  <div key={dep.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{dep.title}</span>
                      <span className="text-xs text-gray-500">ID: {dep.id}</span>
                    </div>
                    <div className="flex gap-2">
                      {dep.isInstalled ? (
                        dep.isDisabled ? (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            INSTALLED (DISABLED)
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            INSTALLED & ENABLED
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">cancel</span>
                          NOT INSTALLED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </OverlayScrollbarsComponent>
          </div>
        </div>
      )}

      {/* Cohesive UI Modals */}
      <DayzModModals
        modalState={modalState}
        setModalState={setModalState}
        executeMissingDepsInstall={executeMissingDepsInstall}
        executeUninstall={executeUninstall}
        executeRebuildLoadOrder={executeRebuildLoadOrder}
        executeUninstallAll={executeUninstallAll}
        modsCount={mods.length}
      />
    </div>
  );
};
