import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

import { useServerStore } from '../../store/useServerStore';
import { useMinecraftMods } from '../../hooks/useMinecraftMods';

const classOptions = [
  { id: 6, name: 'Mods' },
  { id: 6945, name: 'Data Packs' },
  { id: 12, name: 'Resource Packs' },
  { id: 6552, name: 'Shaders' },
  { id: 17, name: 'Worlds' },
  { id: 4559, name: 'Addons' },
  { id: 5, name: 'Bukkit Plugins' },
  { id: 4546, name: 'Customization' }
];

interface ModsTabProps {
  serverMeta: any;
}

export const ModsTab: React.FC<ModsTabProps> = React.memo(({ serverMeta }) => {
  const { activeServerId } = useServerStore();
  
  const {
    modSearchQuery, setModSearchQuery, modResults, isSearchingMods,
    installedMods, installingModId, installProgressText,
    modViewType, setModViewType, activeClassId, setActiveClassId, activeSortField, setActiveSortField,
    isClassMenuOpen, setIsClassMenuOpen, isSortMenuOpen, setIsSortMenuOpen, totalModCount,
    handleSearchMods, handleInstallMod, handleDeleteMod
  } = useMinecraftMods(activeServerId, serverMeta, 'mods');

  return (
    <div className="absolute inset-0 flex flex-col p-8 min-h-0">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h3 className="text-xl font-bold text-white">Mod Manager</h3>
          <p className="text-gray-400 text-sm mt-1">
            {serverMeta ? `Server Type: ${serverMeta.type} ${serverMeta.version}` : 'Loading server info...'}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/5 flex shadow-inner">
             <button onClick={() => setModViewType('browse')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${modViewType === 'browse' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>Browse</button>
             <button onClick={() => setModViewType('installed')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${modViewType === 'installed' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>Installed ({installedMods.length})</button>
          </div>
        </div>
      </div>

      {serverMeta && (
        <>
          {modViewType === 'browse' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              {/* TOP CONTROLS */}
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
                  
                  <div className="flex items-center gap-2 border-l border-white/10 pl-4 cursor-default font-bold text-[#bfbfbf]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                    Filters
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
                             {mod.latestFiles?.[0]?.fileLength && <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg> {(mod.latestFiles[0].fileLength / 1024).toFixed(2)} KB</span>}
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

          {modViewType === 'installed' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              <OverlayScrollbarsComponent 
                className="flex-1 min-h-0" 
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                defer
              >
              {installedMods.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">No mods installed yet.</div>
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
                          <td className="px-6 py-4 text-gray-500">{(mod.size / 1024 / 1024).toFixed(2)} MB</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteMod(mod.name)} className="text-red-400 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded text-xs font-bold transition-colors">Delete</button>
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
        </>
      )}
    </div>
  );
});
