import React, { useState } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'
import { Download, Search, ExternalLink, Trash2, Package, Layers } from 'lucide-react'
import { usePalworldMods } from '../../../hooks/usePalworldMods'

export const PalworldModsTab: React.FC = React.memo(() => {
  const {
    modSearchQuery,
    setModSearchQuery,
    modResults,
    isSearchingMods,
    handleSearchMods,
    searchError,
    installedMods,
    handleInstallMod,
    installingModId,
    handleDeleteMod
  } = usePalworldMods()

  const [activeTab, setActiveTab] = useState<'search' | 'installed'>('search')

  return (
    <div className="absolute inset-0 flex min-h-0">
      <OverlayScrollbarsComponent
        className="flex-1 min-h-0 min-w-0 w-full"
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
        defer
      >
        <div className="p-6 bg-transparent font-body flex flex-col gap-6 min-h-full pb-32">
          {/* Header Controls */}
          <div className="flex justify-between items-end sticky top-0 bg-background/80 backdrop-blur-xl z-20 py-4 -mt-6">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                Mods (CurseForge)
              </h2>
            </div>

            <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl border border-surface-container-highest">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'search' ? 'bg-blue-500 text-on-primary shadow-glow' : 'text-on-surface-variant hover:text-blue-400'}`}
              >
                <Search className="w-4 h-4" />
                Browse
              </button>
              <button
                onClick={() => setActiveTab('installed')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'installed' ? 'bg-blue-500 text-on-primary shadow-glow' : 'text-on-surface-variant hover:text-blue-400'}`}
              >
                <Package className="w-4 h-4" />
                Installed ({installedMods.length})
              </button>
            </div>
          </div>

          <div className="flex gap-6 min-h-[500px]">
            <div className="flex-1 flex flex-col gap-4">
              {activeTab === 'search' && (
                <div className="bg-surface-container-low border border-surface-container-highest rounded-2xl p-6 shadow-glass flex flex-col min-h-[400px]">
                  <div className="flex gap-4 items-center w-full mb-6 relative">
                    <Search className="w-5 h-5 text-on-surface-variant absolute left-4" />
                    <form onSubmit={(e) => handleSearchMods(e)} className="flex-1 flex gap-4">
                      <input
                        type="text"
                        placeholder="Search CurseForge for Palworld Mods..."
                        value={modSearchQuery}
                        onChange={(e) => setModSearchQuery(e.target.value)}
                        className="bg-surface-container border border-surface-container-highest text-on-surface rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 p-3 font-mono text-sm placeholder:text-on-surface-variant/50 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={isSearchingMods}
                        className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                      >
                        {isSearchingMods ? 'Searching...' : 'Search'}
                      </button>
                    </form>
                  </div>

                  <div className="flex flex-col gap-3 flex-1">
                    {modResults.map((mod) => (
                      <div
                        key={mod.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-lowest border border-white/5 hover:border-blue-500/30 transition-colors group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4 z-10 flex-1">
                          <img
                            src={mod.logo?.thumbnailUrl || 'https://via.placeholder.com/64'}
                            alt={mod.name}
                            className="w-16 h-16 rounded-xl object-cover bg-surface-container"
                          />
                          <div className="flex flex-col">
                            <span className="font-title-md text-on-surface group-hover:text-blue-400 transition-colors flex items-center gap-2">
                              {mod.name}
                            </span>
                            <span
                              className="text-sm text-on-surface-variant line-clamp-1 max-w-[500px] mt-1"
                              title={mod.summary}
                            >
                              {mod.summary}
                            </span>
                            <div className="flex gap-4 mt-2">
                              <span className="text-xs text-on-surface-variant/60">
                                By {mod.authors?.[0]?.name}
                              </span>
                              <span className="text-xs text-on-surface-variant/60">
                                {Math.floor(mod.downloadCount).toLocaleString()} DLs
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 z-10">
                          <a
                            href={mod.links?.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-lg text-on-surface-variant hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="View on CurseForge"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                          <button
                            onClick={() => handleInstallMod(mod)}
                            disabled={installingModId === mod.id}
                            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${installingModId === mod.id ? 'bg-surface-container text-on-surface-variant' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-on-primary hover:border-transparent hover:shadow-glow'}`}
                            title="Install Mod"
                          >
                            {installingModId === mod.id ? (
                              <Package className="w-5 h-5 animate-pulse" />
                            ) : (
                              <Download className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {!isSearchingMods && modResults.length === 0 && !searchError && (
                      <div className="flex flex-col items-center justify-center flex-1 text-on-surface-variant opacity-50 py-12">
                        <Package className="w-16 h-16 mb-4 opacity-50" />
                        <span className="font-label-lg tracking-widest uppercase">
                          Search for mods above
                        </span>
                      </div>
                    )}
                    {!isSearchingMods && searchError && (
                      <div className="flex flex-col items-center justify-center flex-1 text-error py-12 px-6 text-center bg-error/10 rounded-2xl border border-error/20">
                        <span className="material-symbols-outlined text-4xl mb-4 opacity-80">
                          error
                        </span>
                        <span className="font-bold text-lg mb-2">Failed to search mods</span>
                        <span className="text-on-surface-variant text-sm max-w-[400px]">
                          {searchError}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'installed' && (
                <div className="bg-surface-container-low border border-surface-container-highest rounded-2xl p-6 shadow-glass flex flex-col min-h-[400px]">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6">
                    Installed Mods
                  </h3>

                  <div className="flex flex-col gap-3">
                    {installedMods.map((mod, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-lowest border border-white/5 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
                            {mod.type === 'Pak' ? (
                              <Layers className="w-6 h-6 text-blue-400" />
                            ) : (
                              <Package className="w-6 h-6 text-[#00a2ff]" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-title-md text-on-surface">{mod.name}</span>
                            <span className="text-xs text-on-surface-variant">{mod.type} Mod</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteMod(mod.type, mod.name)}
                          className="p-2.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                          title="Delete Mod"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {installedMods.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant opacity-50">
                        <Package className="w-16 h-16 mb-4 opacity-50" />
                        <span className="font-label-lg tracking-widest uppercase">
                          No mods installed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </div>
  )
})

PalworldModsTab.displayName = 'PalworldModsTab'
