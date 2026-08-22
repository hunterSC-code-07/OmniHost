import { useState, useEffect } from "react";

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

export function CreateServerModal({ initialServerType, setShowCreateModal, setServers, servers, activeGameHub, showToast, setSteamLoginAction, setShowSteamLoginModal, steamUsername, steamPassword, setSteamPassword, steamGuardCode, setSteamGuardCode, isSteamGuardRequired, setIsSteamGuardRequired, setActiveServerId }: any) {
    const [newServerName, setNewServerName] = useState('')
    const [newServerType, setNewServerType] = useState(initialServerType || 'Vanilla')
    const [newServerVersion, setNewServerVersion] = useState('')
    const [availableVersions, setAvailableVersions] = useState<string[]>([])
    const [newServerLoaderVersion, setNewServerLoaderVersion] = useState('')
    const [availableLoaderVersions, setAvailableLoaderVersions] = useState<string[]>([])
    const [isNewServerTypeMenuOpen, setIsNewServerTypeMenuOpen] = useState(false)
    const [isNewServerVersionMenuOpen, setIsNewServerVersionMenuOpen] = useState(false)
    const [isNewServerLoaderMenuOpen, setIsNewServerLoaderMenuOpen] = useState(false)
    const [isCreatingServer, setIsCreatingServer] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [downloadText, setDownloadText] = useState('Downloading server.jar...')
    const [modpackSearch, setModpackSearch] = useState('')
    const [isSearchingPacks, setIsSearchingPacks] = useState(false)
    const [modpacks, setModpacks] = useState<any[]>([])
    const [selectedModpack, setSelectedModpack] = useState<any>(null)
    const [isModpackVersionMenuOpen, setIsModpackVersionMenuOpen] = useState(false)
    const [modpackVersionFilter, setModpackVersionFilter] = useState('')
    const [isModpackLoaderMenuOpen, setIsModpackLoaderMenuOpen] = useState(false)
    const [modpackLoaderFilter, setModpackLoaderFilter] = useState('')
    const handleCreateServer = async () => {
        if (!newServerName) return;
        if (activeGameHub !== 'DayZ') {
          if (newServerType !== 'CurseForge Modpack' && !newServerVersion) return;
          if (newServerType === 'CurseForge Modpack' && !selectedModpack) return;
        }
        
        setIsCreatingServer(true);
        setDownloadProgress(0);

        try {
          if (newServerType === 'CurseForge Modpack') {
            const versionFilter = modpackVersionFilter || selectedModpack.latestFiles[0].gameVersions.find(v => v.includes('.'));
            // @ts-ignore
            const newId = await window.api.createServer(newServerName, 'Minecraft', 'CurseForge', versionFilter);
            
            // @ts-ignore
            window.api.onDownloadProgress(newId, (progress: number, text?: string) => {
              setDownloadProgress(progress)
              if (text) setDownloadText(text)
            });

            // @ts-ignore
            const result = await window.api.installCurseforgeModpack(newId, selectedModpack.id, versionFilter);
            
            if (result && result.isClientPack) {
              // @ts-ignore
              window.api.onDownloadProgress(newId, (progress: number, text?: string) => {
                setDownloadProgress(progress)
                if (text) setDownloadText(text)
              });
              // @ts-ignore
              await window.api.downloadServerJar(newId, result.modloader, result.version);
            }
          } else if (activeGameHub === 'DayZ') {
            // @ts-ignore
            const isCached = await window.api.checkSteamCache(223350);

            if (!isCached && (!steamUsername || !steamPassword)) {
              setSteamLoginAction('create');
              setShowSteamLoginModal(true);
              return;
            }

            setIsCreatingServer(true);
            // @ts-ignore
            const newId = await window.api.createServer(newServerName, 'DayZ', 'Vanilla', 'Latest');
            
            // @ts-ignore
            window.api.onDownloadProgress(newId, (progress: number, text?: string) => {
              setDownloadProgress(progress)
              if (text) setDownloadText(text)
            });

            try {
              let success = false;
              if (isCached) {
                showToast("Server files found in cache! Copying...");
                // @ts-ignore
                success = await window.api.copySteamCache(newId, 223350);
              } else {
                // @ts-ignore
                success = await window.api.installSteamApp(newId, 223350, steamUsername, steamPassword, steamGuardCode);
              }

              if (success) {
                setShowCreateModal(false);
                setShowSteamLoginModal(false);
                setNewServerName('');
                setSteamPassword('');
                setSteamGuardCode('');
                setIsSteamGuardRequired(false);
                // Refresh list
                // @ts-ignore
                const data = await window.api.getServers();
                setServers(data);
                setActiveServerId(newId);
                showToast("DayZ Server created successfully!");
                return;
              }
            } catch (err: any) {
              if (err.message && err.message.includes('STEAM_GUARD_REQUIRED')) {
                setIsSteamGuardRequired(true);
                setSteamLoginAction('create');
                setShowSteamLoginModal(true);
                showToast("Steam Guard Code required!");
              } else {
                alert('Failed to download DayZ Server via SteamCMD: ' + err.message);
              }
              return;
            } finally {
              setIsCreatingServer(false);
              // @ts-ignore
              window.api.removeDownloadProgressListener && window.api.removeDownloadProgressListener(newId);
            }
          } else {
            // @ts-ignore
            const newId = await window.api.createServer(newServerName, 'Minecraft', newServerType, newServerVersion, newServerLoaderVersion);
            
            // @ts-ignore
            window.api.onDownloadProgress(newId, (progress: number, text?: string) => {
              setDownloadProgress(progress)
              if (text) setDownloadText(text)
            });

            // @ts-ignore
            await window.api.downloadServerJar(newId, newServerType, newServerVersion, newServerLoaderVersion);
          }

          showToast('Server Created Successfully!');
          setShowCreateModal(false);
          // @ts-ignore
          const data = await window.api.getServers();
          setServers(data);

          setNewServerName('');
          setNewServerType('Vanilla');
          setNewServerVersion('');
          setSelectedModpack(null);
        } catch (e: any) {
          alert("Error creating server: " + e.message);
        } finally {
          setIsCreatingServer(false);
        }
      }
      useEffect(() => {
        const fetchModpacks = async () => {
          if (newServerType !== 'CurseForge Modpack') return;
          setIsSearchingPacks(true);
          try {
            const typeStr = modpackLoaderFilter || 'Any';
            const versionStr = modpackVersionFilter || '';
            // @ts-ignore
            const results = await window.api.searchCurseforgeMods(modpackSearch, typeStr, versionStr, 0, 4471, 2);
            setModpacks(results || []);
          } catch (e) {
            console.error(e);
            setModpacks([]);
          } finally {
            setIsSearchingPacks(false);
          }
        };
        
        const timer = setTimeout(() => {
          fetchModpacks();
        }, 500);
        return () => clearTimeout(timer);
      }, [modpackSearch, modpackVersionFilter, modpackLoaderFilter, newServerType]);

    useEffect(() => {
          const fetchVersions = async () => {
            let versions: string[] = []
            // @ts-ignore
            if (newServerType === 'Vanilla') versions = await window.api.getVanillaVersions();
            // @ts-ignore
            else if (newServerType === 'Paper') versions = await window.api.getPaperVersions();
            // @ts-ignore
            else if (newServerType === 'Fabric') versions = await window.api.getFabricVersions();
            // @ts-ignore
            else if (newServerType === 'Forge') versions = await window.api.getForgeVersions();
            // @ts-ignore
            else if (newServerType === 'NeoForge') versions = await window.api.getNeoForgeVersions();
            
            setAvailableVersions(versions);
            if (versions.length > 0) {
               setNewServerVersion(prev => versions.includes(prev) ? prev : versions[0]);
            }
          }
          
          if (newServerType !== 'CurseForge Modpack') {
            fetchVersions()
          } else {
            setAvailableVersions([]);
          }
      }, [newServerType])

      useEffect(() => {
        const fetchLoaderVersions = async () => {
          if (!newServerVersion) return;
          if (['Forge', 'Fabric', 'NeoForge'].includes(newServerType)) {
            setAvailableLoaderVersions([]);
            // @ts-ignore
            const versions = await window.api.getLoaderVersions(newServerType, newServerVersion);
            setAvailableLoaderVersions(versions);
            if (versions && versions.length > 0) {
              setNewServerLoaderVersion(prev => versions.includes(prev) ? prev : versions[0]);
            }
          } else {
            setAvailableLoaderVersions([]);
            setNewServerLoaderVersion('');
          }
        }
        fetchLoaderVersions();
      }, [newServerType, newServerVersion])


  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className={`bg-[#0a0a0a] p-8 rounded-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)] w-full relative ${newServerType === 'CurseForge Modpack' ? 'max-w-4xl' : 'max-w-md'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-md">Create New Server</h2>
              
              <div className={`flex gap-8 ${newServerType === 'CurseForge Modpack' ? 'flex-row' : 'flex-col'}`}>
                
                {/* Left Column (Always visible) */}
                <div className={`space-y-4 ${newServerType === 'CurseForge Modpack' ? 'w-1/3' : 'w-full'}`}>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Server Name</label>
                    <input 
                      type="text" 
                      value={newServerName}
                      onChange={e => setNewServerName(e.target.value)}
                      className="w-full bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand shadow-inner"
                      placeholder="My Awesome Server"
                      disabled={isCreatingServer}
                    />
                  </div>

                  {activeGameHub !== 'DayZ' && (
                    <div className="relative z-50">
                      <label className="block text-sm font-bold text-gray-400 mb-1">Software Type</label>
                      <button 
                        onClick={() => setIsNewServerTypeMenuOpen(!isNewServerTypeMenuOpen)}
                        className="w-full flex justify-between items-center bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand shadow-inner font-bold"
                        disabled={isCreatingServer}
                      >
                        {newServerType}
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </button>
                      {isNewServerTypeMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                          {(activeGameHub === 'DayZ' ? [
                              { val: 'Vanilla', label: 'Vanilla (DayZ)' },
                              { val: 'Experimental', label: 'Experimental (DayZ)' }
                            ] : [
                              { val: 'Vanilla', label: 'Vanilla (Official)' },
                              { val: 'Paper', label: 'Paper (Optimized)' },
                              { val: 'Fabric', label: 'Fabric (Mods)' },
                              { val: 'Forge', label: 'Forge (Mods)' },
                              { val: 'NeoForge', label: 'NeoForge (Mods)' },
                              { val: 'CurseForge Modpack', label: 'CurseForge Modpack' }
                            ]).map(opt => (
                            <div key={opt.val} onClick={() => { setNewServerType(opt.val); setIsNewServerTypeMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${newServerType === opt.val ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                              {opt.label} {newServerType === opt.val && <span className="float-right text-brand">✓</span>}
                            </div>
                          ))}
                          </OverlayScrollbarsComponent>
                        </div>
                      )}
                    </div>
                  )}

                {activeGameHub !== 'DayZ' && newServerType !== 'CurseForge Modpack' && (
                  <div className="relative z-40">
                    <label className="block text-sm font-bold text-gray-400 mb-1">Minecraft Version</label>
                    <button 
                      onClick={() => { if (!isCreatingServer && availableVersions.length > 0) setIsNewServerVersionMenuOpen(!isNewServerVersionMenuOpen) }}
                      className={`w-full flex justify-between items-center bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand font-bold ${(isCreatingServer || availableVersions.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {availableVersions.length === 0 ? 'Loading...' : (newServerVersion || 'Select version')}
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </button>
                    {isNewServerVersionMenuOpen && availableVersions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                        <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                        {availableVersions.map(opt => (
                          <div key={opt} onClick={() => { setNewServerVersion(opt); setIsNewServerVersionMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${newServerVersion === opt ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                            {opt} {newServerVersion === opt && <span className="float-right text-brand">✓</span>}
                          </div>
                        ))}
                        </OverlayScrollbarsComponent>
                      </div>
                    )}
                  </div>
                )}
                {activeGameHub !== 'DayZ' && ['Forge', 'Fabric', 'NeoForge'].includes(newServerType) && (
                  <div className="relative z-30">
                    <label className="block text-sm font-bold text-gray-400 mb-1">Loader Version</label>
                    <button 
                      onClick={() => { if (!isCreatingServer && availableLoaderVersions.length > 0) setIsNewServerLoaderMenuOpen(!isNewServerLoaderMenuOpen) }}
                      className={`w-full flex justify-between items-center bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand font-bold ${(isCreatingServer || availableLoaderVersions.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {availableLoaderVersions.length === 0 ? 'Loading...' : (newServerLoaderVersion || 'Select version')}
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </button>
                    {isNewServerLoaderMenuOpen && availableLoaderVersions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                        <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                        {availableLoaderVersions.map(opt => (
                          <div key={opt} onClick={() => { setNewServerLoaderVersion(opt); setIsNewServerLoaderMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${newServerLoaderVersion === opt ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                            {opt} {newServerLoaderVersion === opt && <span className="float-right text-brand">✓</span>}
                          </div>
                        ))}
                        </OverlayScrollbarsComponent>
                      </div>
                    )}
                  </div>
                )}
                  </div>
                
                {/* Right Column (Modpack Browser) */}
              {activeGameHub !== 'DayZ' && newServerType === 'CurseForge Modpack' && (
                <div className="w-2/3 flex flex-col border-l border-gray-800/50 pl-8">
                  <div className="flex gap-4 mb-4">
                    <input 
                      type="text" 
                      placeholder="Search Modpacks..." 
                      className="flex-1 bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand"
                      value={modpackSearch}
                      onChange={e => setModpackSearch(e.target.value)}
                    />
                    <div className="relative z-50 flex-1">
                      <button 
                        onClick={() => setIsModpackVersionMenuOpen(!isModpackVersionMenuOpen)}
                        className="w-full flex justify-between items-center bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand font-bold"
                      >
                        {modpackVersionFilter || 'All Versions'}
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </button>
                      {isModpackVersionMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                          {[
                            { val: '', label: 'All Versions' },
                            { val: '1.20.1', label: '1.20.1' },
                            { val: '1.19.2', label: '1.19.2' },
                            { val: '1.18.2', label: '1.18.2' },
                            { val: '1.16.5', label: '1.16.5' }
                          ].map(opt => (
                            <div key={opt.val} onClick={() => { setModpackVersionFilter(opt.val); setIsModpackVersionMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${modpackVersionFilter === opt.val ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                              {opt.label} {modpackVersionFilter === opt.val && <span className="float-right text-brand">✓</span>}
                            </div>
                          ))}
                          </OverlayScrollbarsComponent>
                        </div>
                      )}
                    </div>

                    <div className="relative z-50 flex-1">
                      <button 
                        onClick={() => setIsModpackLoaderMenuOpen(!isModpackLoaderMenuOpen)}
                        className="w-full flex justify-between items-center bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand font-bold"
                      >
                        {modpackLoaderFilter || 'Any Loader'}
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </button>
                      {isModpackLoaderMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                          {[
                            { val: '', label: 'Any Loader' },
                            { val: 'Forge', label: 'Forge' },
                            { val: 'Fabric', label: 'Fabric' },
                            { val: 'NeoForge', label: 'NeoForge' }
                          ].map(opt => (
                            <div key={opt.val} onClick={() => { setModpackLoaderFilter(opt.val); setIsModpackLoaderMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${modpackLoaderFilter === opt.val ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                              {opt.label} {modpackLoaderFilter === opt.val && <span className="float-right text-brand">✓</span>}
                            </div>
                          ))}
                          </OverlayScrollbarsComponent>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 bg-[#050505] rounded-lg border border-gray-800 relative flex flex-col min-h-[400px] max-h-[400px]">
                    <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="flex-1 w-full block min-h-0">
                      <div className="p-2 space-y-2">
                        {isSearchingPacks && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <span className="text-white font-bold">Searching...</span>
                          </div>
                        )}
                        {modpacks.length === 0 && !isSearchingPacks && (
                          <div className="text-gray-500 text-center py-8">No modpacks found.</div>
                        )}
                        {modpacks.map(pack => (
                          <div 
                            key={pack.id} 
                            onClick={() => setSelectedModpack(pack)}
                            className={`flex gap-4 p-3 rounded-lg cursor-pointer transition-colors border ${selectedModpack?.id === pack.id ? 'bg-brand/20 border-brand' : 'hover:bg-gray-800/50 border-transparent'}`}
                          >
                            <img src={pack.logo?.thumbnailUrl || undefined} alt={pack.name} className="w-16 h-16 rounded-md object-cover" />
                            <div className="flex-1 overflow-hidden">
                              <h3 className="text-white font-bold truncate">{pack.name}</h3>
                              <p className="text-xs text-gray-400 truncate">{pack.summary}</p>
                              <div className="flex gap-2 mt-2">
                                <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">{pack.downloadCount.toLocaleString()} DLs</span>
                                {pack.latestFiles[0]?.gameVersions[0] && (
                                  <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded">{pack.latestFiles[0].gameVersions[0]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </OverlayScrollbarsComponent>
                  </div>
                </div>
              )}
            </div>

            {isCreatingServer && (
              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{downloadText}</span>
                  <span>{downloadProgress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-brand h-2 rounded-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={isCreatingServer}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateServer}
                disabled={isCreatingServer || !newServerName || (activeGameHub !== 'DayZ' && (newServerType === 'CurseForge Modpack' ? !selectedModpack : !newServerVersion))}
                className="bg-brand hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-bold shadow-lg transition-colors"
              >
                {isCreatingServer ? 'Creating...' : 'Create Server'}
              </button>
            </div>
          </div>
        </div>
        </div>
  );
}
