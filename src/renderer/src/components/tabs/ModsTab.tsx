import React, { useState, useMemo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import { 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Package, 
  Layers, 
  RefreshCw, 
  Trash2, 
  Box, 
  ShieldCheck,
  Search,
  ExternalLink,
  Palette
} from 'lucide-react';

import { useServerStore } from '../../store/useServerStore';
import { useMinecraftMods } from '../../hooks/useMinecraftMods';

const classOptions = [
  { id: 6, name: 'Mods' },
  { id: 4471, name: 'Modpacks' },
  { id: 6945, name: 'Data Packs' },
  { id: 12, name: 'Resource Packs' },
  { id: 6552, name: 'Shaders' },
  { id: 17, name: 'Worlds' },
  { id: 4559, name: 'Addons' },
  { id: 5, name: 'Bukkit Plugins' },
  { id: 4546, name: 'Customization' }
];

const formatBytes = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '--';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface ModsTabProps {
  serverMeta: any;
}

export const ModsTab: React.FC<ModsTabProps> = React.memo(({ serverMeta }) => {
  const { activeServerId } = useServerStore();
  const [depSearchFilter, setDepSearchFilter] = useState('');
  
  const {
    modSearchQuery, setModSearchQuery, modResults, isSearchingMods,
    installedMods, installingModId, installProgressText,
    modViewType, setModViewType, activeClassId, setActiveClassId, activeSortField, setActiveSortField,
    isClassMenuOpen, setIsClassMenuOpen, isSortMenuOpen, setIsSortMenuOpen, totalModCount,
    handleSearchMods, handleInstallMod, handleDeleteMod,

    // Dependencies
    modDependencies, isLoadingDependencies, fetchModDependencies, handleInstallMissingDependency,
    isInstallingAllDeps, installAllProgress, handleInstallAllMissingDependencies,

    // Modpacks
    modpackSearchQuery, setModpackSearchQuery,
    modpackResults, isSearchingModpacks,
    installingModpackId, modpackProgressText,
    handleSearchModpacks, handleInstallModpack,

    // Shaders
    shaderSearchQuery, setShaderSearchQuery,
    shaderResults, isSearchingShaders,
    handleSearchShaders,

    // Resource Packs
    resourcePackSearchQuery, setResourcePackSearchQuery,
    resourcePackResults, isSearchingResourcePacks,
    handleSearchResourcePacks
  } = useMinecraftMods(activeServerId, serverMeta, 'mods');

  // Calculate dependency stats
  const depStats = useMemo(() => {
    let totalDeps = 0;
    let satisfiedDeps = 0;
    let missingDeps = 0;

    for (const mod of modDependencies) {
      for (const dep of mod.dependencies || []) {
        totalDeps++;
        if (dep.satisfied) {
          satisfiedDeps++;
        } else {
          missingDeps++;
        }
      }
    }

    return { totalDeps, satisfiedDeps, missingDeps };
  }, [modDependencies]);

  const filteredDependencies = useMemo(() => {
    if (!depSearchFilter.trim()) return modDependencies;
    const q = depSearchFilter.toLowerCase();
    return modDependencies.filter(m => 
      m.name?.toLowerCase().includes(q) || 
      m.fileName?.toLowerCase().includes(q) ||
      m.modId?.toLowerCase().includes(q) ||
      (m.dependencies || []).some((d: any) => d.name?.toLowerCase().includes(q) || d.id?.toLowerCase().includes(q))
    );
  }, [modDependencies, depSearchFilter]);

  return (
    <div className="absolute inset-0 flex flex-col p-8 min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 shrink-0">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Box className="w-5 h-5 text-brand" /> Mod Manager
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {serverMeta ? `Server Type: ${serverMeta.type} ${serverMeta.version}` : 'Loading server info...'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 items-center">
          <div className="bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/5 flex shadow-inner">
             <button 
               onClick={() => setModViewType('browse')} 
               className={`px-3.5 py-1.5 rounded-md font-bold text-sm transition-all flex items-center gap-1.5 ${modViewType === 'browse' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
             >
               <Search className="w-3.5 h-3.5" /> Browse
             </button>
             <button 
               onClick={() => setModViewType('installed')} 
               className={`px-3.5 py-1.5 rounded-md font-bold text-sm transition-all flex items-center gap-1.5 ${modViewType === 'installed' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
             >
               <Package className="w-3.5 h-3.5" /> Installed ({installedMods.length})
             </button>
             <button 
               onClick={() => setModViewType('dependencies')} 
               className={`px-3.5 py-1.5 rounded-md font-bold text-sm transition-all flex items-center gap-1.5 ${modViewType === 'dependencies' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
             >
               <Layers className="w-3.5 h-3.5" /> Dependencies
               {depStats.missingDeps > 0 && (
                 <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
               )}
             </button>
             <button 
               onClick={() => setModViewType('modpacks')} 
               className={`px-3.5 py-1.5 rounded-md font-bold text-sm transition-all flex items-center gap-1.5 ${modViewType === 'modpacks' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
             >
               <Download className="w-3.5 h-3.5" /> Modpacks
             </button>
             <button 
               onClick={() => setModViewType('shaders')} 
               className={`px-3.5 py-1.5 rounded-md font-bold text-sm transition-all flex items-center gap-1.5 ${modViewType === 'shaders' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
             >
               <Box className="w-3.5 h-3.5" /> Shaders
             </button>
             <button 
               onClick={() => setModViewType('resourcepacks')} 
               className={`px-3.5 py-1.5 rounded-md font-bold text-sm transition-all flex items-center gap-1.5 ${modViewType === 'resourcepacks' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
             >
               <Palette className="w-3.5 h-3.5" /> Resource Packs
             </button>
          </div>
        </div>
      </div>

      {serverMeta && (
        <>
          {/* TAB 1: BROWSE MODS */}
          {modViewType === 'browse' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              {/* Controls Bar */}
              <div className="flex flex-col md:flex-row justify-between items-center bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/5 mb-4 text-[#bfbfbf] text-sm shrink-0 shadow-inner relative z-50">
                <div className="relative">
                  <button onClick={() => setIsClassMenuOpen(!isClassMenuOpen)} className="flex items-center gap-2 hover:text-white px-3 py-1 font-bold">
                    {classOptions.find(c => c.id === activeClassId)?.name || 'Mods'}
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </button>
                  {isClassMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                      {classOptions.map(cls => (
                        <div key={cls.id} onClick={() => { setActiveClassId(cls.id); setIsClassMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${activeClassId === cls.id ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                          {cls.name} {activeClassId === cls.id && <span className="float-right text-brand">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden md:block">
                  {totalModCount > 0 ? '10,000+ Projects found' : '0 Projects found'}
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className="flex items-center gap-2 hover:text-white px-3 py-1 font-bold bg-transparent text-[#bfbfbf]">
                      {[{id:1, name:'Sort: Featured'},{id:2, name:'Sort: Popularity'},{id:3, name:'Sort: Last Updated'},{id:4, name:'Sort: Name'}].find(o => o.id === activeSortField)?.name || 'Sort: Popularity'}
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </button>
                    {isSortMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                        {[{id:1, name:'Sort: Featured'},{id:2, name:'Sort: Popularity'},{id:3, name:'Sort: Last Updated'},{id:4, name:'Sort: Name'}].map(opt => (
                          <div key={opt.id} onClick={() => { setActiveSortField(opt.id); setIsSortMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${activeSortField === opt.id ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                            {opt.name} {activeSortField === opt.id && <span className="float-right text-brand">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => handleSearchMods(e)} className="mb-6 flex gap-3 shrink-0 relative z-40">
                <input type="text" placeholder={`Search ${serverMeta?.type} ${classOptions.find(c => c.id === activeClassId)?.name.toLowerCase()}...`} value={modSearchQuery} onChange={(e) => setModSearchQuery(e.target.value)} className="flex-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg px-6 py-3 text-white outline-none focus:border-brand/50 shadow-inner text-base" disabled={isSearchingMods} />
                <button type="submit" disabled={isSearchingMods} className="px-8 bg-black/40 backdrop-blur-md border border-white/5 hover:bg-white/10 rounded-lg font-bold transition-all disabled:opacity-50 text-white shadow-lg">{isSearchingMods ? 'Searching...' : 'Search'}</button>
              </form>

              <OverlayScrollbarsComponent 
                className="flex-1 min-h-0" 
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                defer
              >
                <>
                  {modResults.length === 0 && !isSearchingMods && modSearchQuery && (
                    <div className="text-center text-gray-500 mt-20">No projects found. Try a different search.</div>
                  )}

                  <div className="flex flex-col gap-[1px] bg-white/5 border border-white/5 rounded overflow-hidden shadow-lg pb-4">
                    {modResults.map((mod: any) => {
                       const isInstalled = installedMods.some(m => m.name.toLowerCase().includes(mod.slug?.replace(/-/g, '') || mod.name.toLowerCase().replace(/ /g, '')));
                       return (
                        <React.Fragment key={mod.id}>
                          <div className="bg-black/30 backdrop-blur-sm p-4 flex gap-4 group transition-colors hover:bg-black/50">
                            <img src={mod.logo?.thumbnailUrl || 'https://via.placeholder.com/128'} alt={mod.name} className="w-[84px] h-[84px] rounded shadow-md bg-black/50 object-cover flex-shrink-0" />
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-[#e0e0e0] text-lg truncate group-hover:text-white transition-colors">{mod.name}</h4>
                                <span className="text-sm text-[#888888]">by <span className="text-[#cccccc]">{mod.authors?.[0]?.name}</span></span>
                              </div>
                              <p className="text-sm text-[#aaaaaa] line-clamp-1 mb-3">{mod.summary}</p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto w-full">
                               <div className="flex flex-wrap items-center gap-1.5">
                                 <span className="text-[11px] bg-[#333333] text-[#cccccc] px-2 py-0.5 rounded border border-[#444444] font-semibold">{classOptions.find(c => c.id === activeClassId)?.name || 'Mods'}</span>
                                 {mod.categories?.slice(0, 3).map((cat: any) => (
                                   <span key={cat.id} className="text-[11px] text-[#aaaaaa] px-1 font-semibold">{cat.name}</span>
                                 ))}
                                 {mod.categories?.length > 3 && <span className="text-[11px] text-[#888888]">+{mod.categories.length - 3}</span>}
                               </div>

                               <div className="flex items-center gap-4 text-xs text-[#888888] shrink-0 font-semibold">
                                 <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9.5 14h1v1h-1v-1zm1-8h-1v6h1V6z"/></svg> {(mod.downloadCount / 1000000).toFixed(1)}M</span>
                                 <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> {new Date(mod.dateModified).toLocaleDateString()}</span>
                                 {mod.latestFiles?.[0]?.fileLength && <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg> {formatBytes(mod.latestFiles[0].fileLength)}</span>}
                                 {serverMeta && <span className="flex items-center gap-1.5 text-[#aaaaaa]"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v-1z"></path></svg> {serverMeta.version} • {serverMeta.type}</span>}
                               </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center ml-4 shrink-0">
                            <button onClick={() => handleInstallMod(mod)} disabled={installingModId !== null || isInstalled} className={`px-5 py-2 rounded-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(0,0,0,0.5)] ${isInstalled ? 'bg-black/40 text-gray-400 border border-white/5' : 'bg-brand hover:brightness-110 text-black shadow-[0_0_15px_rgba(76,175,80,0.3)]'}`}>
                              {isInstalled ? 'Installed' : installingModId === mod.id ? 'Installing...' : 'Install'}
                            </button>
                          </div>
                        </div>
                        {installingModId === mod.id && (
                          <div className="bg-black/40 px-4 py-2 text-xs text-brand border-b border-white/5 animate-pulse">
                            {installProgressText}
                          </div>
                        )}
                      </React.Fragment>
                    )})}
                  </div>
                </>
              </OverlayScrollbarsComponent>
            </div>
          )}

          {/* TAB 2: INSTALLED MODS */}
          {modViewType === 'installed' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              <OverlayScrollbarsComponent 
                className="flex-1 min-h-0" 
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                defer
              >
              {installedMods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Package className="w-12 h-12 text-gray-600 mb-4 stroke-1" />
                  <h4 className="text-lg font-bold text-gray-300">No Mods Installed</h4>
                  <p className="text-gray-500 text-sm mt-1 max-w-sm">Browse mods in the Browse tab or install a modpack to get started.</p>
                </div>
              ) : (
                <div className="bg-black/30 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden shadow-lg">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-black/40 border-b border-white/5 text-gray-400 uppercase font-bold text-xs">
                      <tr>
                        <th className="px-6 py-4">File Name</th>
                        <th className="px-6 py-4 w-32">Size</th>
                        <th className="px-6 py-4 w-24 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installedMods.map((mod: any, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-gray-200">{mod.name}</td>
                          <td className="px-6 py-4 text-gray-500">{formatBytes(mod.size)}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteMod(mod.name)} className="text-red-400 hover:text-white hover:bg-red-500/80 px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ml-auto">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </OverlayScrollbarsComponent>
            </div>
          )}

          {/* TAB 3: DEPENDENCIES TAB (REQUESTED) */}
          {modViewType === 'dependencies' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
                <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Mods</p>
                    <h4 className="text-2xl font-bold text-white mt-0.5">{installedMods.length}</h4>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Satisfied Dependencies</p>
                    <h4 className="text-2xl font-bold text-emerald-400 mt-0.5">{depStats.satisfiedDeps}</h4>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className={`bg-surface-container-low border rounded-xl p-4 flex items-center justify-between shadow-sm transition-all ${depStats.missingDeps > 0 ? 'border-amber-500/30' : 'border-surface-container-highest'}`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Missing Dependencies</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <h4 className={`text-2xl font-bold ${depStats.missingDeps > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                        {depStats.missingDeps}
                      </h4>
                      {depStats.missingDeps > 0 && (
                        <button
                          onClick={handleInstallAllMissingDependencies}
                          disabled={isInstallingAllDeps || installingModId !== null}
                          className="px-3 py-1 bg-brand hover:brightness-110 text-black font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(255,215,0,0.35)] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          title="Install all missing dependencies automatically"
                        >
                          <Download className={`w-3.5 h-3.5 ${isInstallingAllDeps ? 'animate-bounce' : ''}`} />
                          {isInstallingAllDeps ? `Installing (${installAllProgress.current}/${installAllProgress.total})...` : 'Install All'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${depStats.missingDeps > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-gray-400'}`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Batch progress banner */}
              {isInstallingAllDeps && (
                <div className="bg-brand/10 border border-brand/30 rounded-xl p-3.5 mb-4 flex items-center gap-3 text-brand text-xs font-semibold animate-pulse shrink-0">
                  <Download className="w-4 h-4 animate-bounce shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Installing Missing Dependencies ({installAllProgress.current}/{installAllProgress.total})...</p>
                    <p className="text-brand/80">{installAllProgress.text || 'Resolving and installing missing mod packages...'}</p>
                  </div>
                </div>
              )}

              {/* Filter & Refresh Header */}
              <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter installed mods or dependencies by name..."
                    value={depSearchFilter}
                    onChange={(e) => setDepSearchFilter(e.target.value)}
                    className="w-full bg-black/40 backdrop-blur-md border border-white/5 rounded-lg pl-11 pr-4 py-2.5 text-white outline-none focus:border-brand/50 text-sm shadow-inner"
                  />
                </div>
                {depStats.missingDeps > 0 && (
                  <button
                    onClick={handleInstallAllMissingDependencies}
                    disabled={isInstallingAllDeps || installingModId !== null}
                    className="px-4 py-2.5 bg-brand hover:brightness-110 text-black rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.3)] disabled:opacity-50 shrink-0"
                  >
                    <Download className={`w-4 h-4 ${isInstallingAllDeps ? 'animate-bounce' : ''}`} />
                    {isInstallingAllDeps ? `Installing (${installAllProgress.current}/${installAllProgress.total})...` : `Install All Missing (${depStats.missingDeps})`}
                  </button>
                )}
                <button
                  onClick={() => fetchModDependencies()}
                  disabled={isLoadingDependencies}
                  className="px-4 py-2.5 bg-black/40 border border-white/5 hover:bg-white/10 rounded-lg text-sm font-bold text-gray-300 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                  title="Re-scan installed mod dependencies"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDependencies ? 'animate-spin text-brand' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Dependencies List */}
              <OverlayScrollbarsComponent 
                className="flex-1 min-h-0" 
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                defer
              >
                {isLoadingDependencies ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
                    <p className="text-gray-400 text-sm">Inspecting mod manifests and dependency trees...</p>
                  </div>
                ) : filteredDependencies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Layers className="w-12 h-12 text-gray-600 mb-4 stroke-1" />
                    <h4 className="text-lg font-bold text-gray-300">
                      {installedMods.length === 0 ? 'No Mods Installed' : 'No Matching Mods Found'}
                    </h4>
                    <p className="text-gray-500 text-sm mt-1 max-w-sm">
                      {installedMods.length === 0 ? 'Install mods in the Browse tab to inspect their dependencies.' : 'Try clearing your filter search.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-6">
                    {filteredDependencies.map((mod: any, idx: number) => {
                      const deps = mod.dependencies || [];
                      const hasMissing = deps.some((d: any) => !d.satisfied && d.mandatory);

                      return (
                        <div 
                          key={idx}
                          className={`bg-surface-container-low border rounded-xl p-5 transition-all shadow-sm ${
                            hasMissing 
                              ? 'border-amber-500/30 hover:border-amber-500/50 bg-amber-500/[0.02]' 
                              : 'border-surface-container-highest hover:border-brand/40'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                            <div>
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h4 className="font-bold text-white text-base">{mod.name}</h4>
                                {mod.version && (
                                  <span className="text-xs font-mono bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                                    v{mod.version}
                                  </span>
                                )}
                                <span className="text-xs bg-brand/15 text-brand px-2 py-0.5 rounded font-semibold border border-brand/30">
                                  {mod.loaderType || 'Mod'}
                                </span>
                              </div>
                              <p className="text-xs font-mono text-gray-500 mt-1 truncate">
                                {mod.fileName} • {formatBytes(mod.size)}
                              </p>
                            </div>

                            <div className="text-xs text-gray-400 shrink-0 font-semibold flex items-center gap-2">
                              <span>{deps.length} {deps.length === 1 ? 'dependency' : 'dependencies'}</span>
                              {deps.length > 0 && !hasMissing && (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> All satisfied
                                </span>
                              )}
                              {hasMissing && (
                                <span className="text-amber-400 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> Missing dependencies
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Declared Dependencies Badges */}
                          <div className="mt-4">
                            {deps.length === 0 ? (
                              <p className="text-xs text-gray-500 italic">No external dependencies declared.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2.5">
                                {deps.map((dep: any, dIdx: number) => {
                                  const isInstalling = installingModId === dep.id;

                                  return (
                                    <div
                                      key={dIdx}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                                        dep.satisfied 
                                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                                          : dep.mandatory
                                            ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                                            : 'bg-black/30 border-white/10 text-gray-400'
                                      }`}
                                    >
                                      {dep.satisfied ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      ) : (
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      )}

                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-white">{dep.name}</span>
                                        {dep.version && dep.version !== '*' && (
                                          <span className="text-[11px] font-mono text-gray-400 opacity-80">({dep.version})</span>
                                        )}
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                                          dep.mandatory ? 'bg-white/10 text-gray-300' : 'bg-white/5 text-gray-500'
                                        }`}>
                                          {dep.mandatory ? 'Required' : 'Optional'}
                                        </span>
                                      </div>

                                      {!dep.satisfied && (
                                        <button
                                          onClick={() => handleInstallMissingDependency(dep.id)}
                                          disabled={isInstalling || installingModId !== null}
                                          className="ml-2 px-2.5 py-1 bg-brand hover:brightness-110 text-black font-bold rounded text-[11px] transition-all disabled:opacity-50 shadow-sm flex items-center gap-1"
                                        >
                                          <Download className="w-3 h-3" />
                                          {isInstalling ? 'Installing...' : 'Install'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </OverlayScrollbarsComponent>
            </div>
          )}

          {/* TAB 4: MODPACKS TAB (REQUESTED) */}
          {modViewType === 'modpacks' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              {/* Modpacks Search Bar */}
              <form onSubmit={(e) => handleSearchModpacks(e)} className="mb-6 flex gap-3 shrink-0 relative z-40">
                <input 
                  type="text" 
                  placeholder={`Search ${serverMeta?.type} modpacks (e.g. Fabulously Optimized, Cobblemon, Better MC)...`} 
                  value={modpackSearchQuery} 
                  onChange={(e) => setModpackSearchQuery(e.target.value)} 
                  className="flex-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg px-6 py-3 text-white outline-none focus:border-brand/50 shadow-inner text-base" 
                  disabled={isSearchingModpacks} 
                />
                <button 
                  type="submit" 
                  disabled={isSearchingModpacks} 
                  className="px-8 bg-black/40 backdrop-blur-md border border-white/5 hover:bg-white/10 rounded-lg font-bold transition-all disabled:opacity-50 text-white shadow-lg flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {isSearchingModpacks ? 'Searching...' : 'Search Modpacks'}
                </button>
              </form>

              {/* Progress alert when installing modpack */}
              {installingModpackId !== null && (
                <div className="bg-brand/10 border border-brand/30 rounded-xl p-4 mb-4 flex items-center gap-3 animate-pulse text-brand shrink-0">
                  <Download className="w-5 h-5 animate-bounce" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Installing Modpack...</p>
                    <p className="text-xs text-brand/80">{modpackProgressText || 'Downloading archive and extracting server mods...'}</p>
                  </div>
                </div>
              )}

              {/* Modpack Cards List */}
              <OverlayScrollbarsComponent 
                className="flex-1 min-h-0" 
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                defer
              >
                {isSearchingModpacks ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
                    <p className="text-gray-400 text-sm">Searching modpacks repository...</p>
                  </div>
                ) : modpackResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Box className="w-12 h-12 text-gray-600 mb-4 stroke-1" />
                    <h4 className="text-lg font-bold text-gray-300">No Modpacks Found</h4>
                    <p className="text-gray-500 text-sm mt-1 max-w-sm">Try searching for popular modpacks like Fabulously Optimized or Cobblemon.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 pb-6">
                    {modpackResults.map((pack: any) => {
                      const isInstalling = installingModpackId === pack.id;

                      return (
                        <div 
                          key={pack.id} 
                          className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl p-5 flex flex-col md:flex-row gap-5 hover:bg-black/50 transition-all shadow-md group"
                        >
                          <img 
                            src={pack.logo?.thumbnailUrl || 'https://via.placeholder.com/128'} 
                            alt={pack.name} 
                            className="w-24 h-24 rounded-lg shadow-md bg-black/60 object-cover shrink-0 border border-white/10" 
                          />

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                <h4 className="font-bold text-white text-xl truncate group-hover:text-brand transition-colors">
                                  {pack.name}
                                </h4>
                                {pack.authors?.[0]?.name && (
                                  <span className="text-xs text-gray-400">
                                    by <span className="text-gray-200 font-semibold">{pack.authors[0].name}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                                {pack.summary || 'A Minecraft modpack.'}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs bg-white/10 text-brand px-2.5 py-0.5 rounded font-semibold border border-brand/20">
                                  Modpack
                                </span>
                                {pack.categories?.slice(0, 4).map((c: any) => (
                                  <span key={c.id} className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded border border-white/5">
                                    {c.name}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center gap-4 text-xs text-gray-400 font-semibold">
                                {pack.downloadCount && (
                                  <span className="flex items-center gap-1">
                                    <Download className="w-3.5 h-3.5" /> {(pack.downloadCount / 1000000).toFixed(1)}M
                                  </span>
                                )}
                                {serverMeta && (
                                  <span className="text-gray-300">
                                    {serverMeta.version} • {serverMeta.type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex md:flex-col justify-end items-end md:justify-center shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-5">
                            <button
                              onClick={() => handleInstallModpack(pack)}
                              disabled={installingModpackId !== null}
                              className="px-6 py-2.5 bg-brand hover:brightness-110 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(76,175,80,0.25)] flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              {isInstalling ? 'Installing...' : 'Install Modpack'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </OverlayScrollbarsComponent>
            </div>
          )}

          {/* TAB 5: SHADERS */}
          {modViewType === 'shaders' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              <form onSubmit={handleSearchShaders} className="flex gap-3 bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/5 mb-4 shrink-0 shadow-inner">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search shaders (e.g. Complementary, BSL, Iris...)"
                    value={shaderSearchQuery}
                    onChange={(e) => setShaderSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingShaders}
                  className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-white font-bold rounded-lg border border-white/10 transition-colors disabled:opacity-50 whitespace-nowrap shadow-md"
                >
                  {isSearchingShaders ? 'Searching...' : 'Search Shaders'}
                </button>
              </form>

              {/* Progress alert when installing shader */}
              {installingModId !== null && (
                <div className="bg-brand/10 border border-brand/30 rounded-xl p-4 mb-4 flex items-center gap-3 animate-pulse text-brand shrink-0">
                  <Download className="w-5 h-5 animate-bounce" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Installing Shader...</p>
                    <p className="text-xs text-brand/80">{installProgressText || 'Downloading and installing shaderpack...'}</p>
                  </div>
                </div>
              )}

              <OverlayScrollbarsComponent 
                className="flex-1 min-h-0" 
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                defer
              >
                {isSearchingShaders ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
                    <p className="text-gray-400 text-sm">Searching shaders...</p>
                  </div>
                ) : shaderResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Box className="w-12 h-12 text-gray-600 mb-4 stroke-1" />
                    <h4 className="text-lg font-bold text-gray-300">No Shaders Found</h4>
                    <p className="text-gray-500 text-sm mt-1 max-w-sm">Try searching for popular shaders like Complementary, BSL, or MakeUp.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                    {shaderResults.map((shader: any) => {
                      const isInstalled = installedMods.some(m => m.id === shader.id);
                      const isInstalling = installingModId === shader.id;

                      return (
                        <div 
                          key={shader.id} 
                          className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col hover:bg-black/50 transition-all shadow-md group relative overflow-hidden"
                        >
                          {isInstalled && (
                            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                              <div className="absolute top-4 -right-5 bg-brand text-black text-[10px] font-bold py-0.5 px-6 rotate-45 shadow-sm">
                                INSTALLED
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-4 mb-3">
                            <img 
                              src={shader.logo?.thumbnailUrl || 'https://via.placeholder.com/64'} 
                              alt={shader.name} 
                              className="w-14 h-14 rounded-lg shadow-md bg-black/60 object-cover shrink-0 border border-white/10" 
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-bold text-white truncate pr-6">{shader.name}</h4>
                              <p className="text-xs text-brand font-medium truncate mb-1">
                                By {shader.authors?.[0]?.name || 'Unknown'}
                              </p>
                              {shader.downloadCount && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Download className="w-3 h-3" /> {(shader.downloadCount / 1000000).toFixed(1)}M
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1" dangerouslySetInnerHTML={{ __html: shader.summary || '' }}></p>

                          <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                            <button
                              onClick={() => handleInstallMod(shader)}
                              disabled={isInstalled || isInstalling || installingModId !== null}
                              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                                isInstalled 
                                  ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                                  : 'bg-brand hover:brightness-110 text-black shadow-[0_0_15px_rgba(76,175,80,0.25)]'
                              }`}
                            >
                              {isInstalled ? (
                                <><CheckCircle2 className="w-4 h-4" /> Installed</>
                              ) : isInstalling ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" /> Installing...</>
                              ) : (
                                <><Download className="w-4 h-4" /> Install</>
                              )}
                            </button>
                            {shader.links?.websiteUrl && (
                              <a href={shader.links.websiteUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </OverlayScrollbarsComponent>
            </div>
          )}

          {/* TAB 6: RESOURCE PACKS */}
          {modViewType === 'resourcepacks' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              <form onSubmit={handleSearchResourcePacks} className="flex gap-3 bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/5 mb-4 shrink-0 shadow-inner">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search resource packs (e.g. Faithful, Sphax, Bare Bones...)"
                    value={resourcePackSearchQuery}
                    onChange={(e) => setResourcePackSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingResourcePacks}
                  className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-white font-bold rounded-lg border border-white/10 transition-colors disabled:opacity-50 whitespace-nowrap shadow-md"
                >
                  {isSearchingResourcePacks ? 'Searching...' : 'Search Packs'}
                </button>
              </form>

              {/* Progress alert when installing resource pack */}
              {installingModId !== null && (
                <div className="bg-brand/10 border border-brand/30 rounded-xl p-4 mb-4 flex items-center gap-3 animate-pulse text-brand shrink-0">
                  <Download className="w-5 h-5 animate-bounce" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Installing Resource Pack...</p>
                    <p className="text-xs text-brand/80">{installProgressText || 'Downloading and installing resource pack...'}</p>
                  </div>
                </div>
              )}

              <OverlayScrollbarsComponent 
                className="flex-1 min-h-0" 
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                defer
              >
                {isSearchingResourcePacks ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
                    <p className="text-gray-400 text-sm">Searching resource packs...</p>
                  </div>
                ) : resourcePackResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Palette className="w-12 h-12 text-gray-600 mb-4 stroke-1" />
                    <h4 className="text-lg font-bold text-gray-300">No Resource Packs Found</h4>
                    <p className="text-gray-500 text-sm mt-1 max-w-sm">Try searching for popular resource packs like Faithful, Sphax PureBDcraft, or Bare Bones.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                    {resourcePackResults.map((pack: any) => {
                      const isInstalled = installedMods.some(m => m.id === pack.id);
                      const isInstalling = installingModId === pack.id;

                      return (
                        <div 
                          key={pack.id} 
                          className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col hover:bg-black/50 transition-all shadow-md group relative overflow-hidden"
                        >
                          {isInstalled && (
                            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                              <div className="absolute top-4 -right-5 bg-brand text-black text-[10px] font-bold py-0.5 px-6 rotate-45 shadow-sm">
                                INSTALLED
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-4 mb-3">
                            <img 
                              src={pack.logo?.thumbnailUrl || 'https://via.placeholder.com/64'} 
                              alt={pack.name} 
                              className="w-14 h-14 rounded-lg shadow-md bg-black/60 object-cover shrink-0 border border-white/10" 
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-bold text-white truncate pr-6">{pack.name}</h4>
                              <p className="text-xs text-brand font-medium truncate mb-1">
                                By {pack.authors?.[0]?.name || 'Unknown'}
                              </p>
                              {pack.downloadCount && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Download className="w-3 h-3" /> {(pack.downloadCount / 1000000).toFixed(1)}M
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1" dangerouslySetInnerHTML={{ __html: pack.summary || '' }}></p>

                          <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                            <button
                              onClick={() => handleInstallMod(pack)}
                              disabled={isInstalled || isInstalling || installingModId !== null}
                              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                                isInstalled 
                                  ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                                  : 'bg-brand hover:brightness-110 text-black shadow-[0_0_15px_rgba(76,175,80,0.25)]'
                              }`}
                            >
                              {isInstalled ? (
                                <><CheckCircle2 className="w-4 h-4" /> Installed</>
                              ) : isInstalling ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" /> Installing...</>
                              ) : (
                                <><Download className="w-4 h-4" /> Install</>
                              )}
                            </button>
                            {pack.links?.websiteUrl && (
                              <a href={pack.links.websiteUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </OverlayScrollbarsComponent>
            </div>
          )}
        </>
      )}
    </div>
  );
});
