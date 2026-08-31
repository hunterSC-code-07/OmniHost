import React, { useState, useMemo } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'
import { Download, Search, ExternalLink, Trash2, Package, Layers, Globe, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react'
import { usePalworldMods } from '../../../hooks/usePalworldMods'

const formatBytes = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '--'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

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
    handleDeleteMod,
    modDependencies,
    isLoadingDependencies,
    isInstallingAllDeps,
    installAllProgress,
    fetchModDependencies,
    handleInstallMissingDependency,
    handleInstallAllMissingDependencies
  } = usePalworldMods()

  const [activeTab, setActiveTab] = useState<'search' | 'installed' | 'nexus' | 'dependencies'>('search')
  const [depSearchFilter, setDepSearchFilter] = useState('')

  // Calculate dependency stats
  const depStats = useMemo(() => {
    let totalDeps = 0
    let satisfiedDeps = 0
    let missingDeps = 0

    for (const mod of modDependencies) {
      for (const dep of mod.dependencies || []) {
        totalDeps++
        if (dep.satisfied) {
          satisfiedDeps++
        } else {
          missingDeps++
        }
      }
    }

    return { totalDeps, satisfiedDeps, missingDeps }
  }, [modDependencies])

  const filteredDependencies = useMemo(() => {
    if (!depSearchFilter.trim()) return modDependencies
    const q = depSearchFilter.toLowerCase()
    return modDependencies.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.fileName?.toLowerCase().includes(q) ||
        m.modId?.toLowerCase().includes(q) ||
        (m.dependencies || []).some(
          (d: any) => d.name?.toLowerCase().includes(q) || d.id?.toLowerCase().includes(q)
        )
    )
  }, [modDependencies, depSearchFilter])

  return (
    <div className="absolute inset-0 flex min-h-0">
      <OverlayScrollbarsComponent
        className="flex-1 min-h-0 min-w-0 w-full"
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
        defer
      >
        <div className="p-6 bg-transparent font-body flex flex-col gap-6 min-h-full pb-32">
          {/* Header Controls */}
          <div className="flex justify-between items-end z-20 py-4">
            <div>
              <h2 className="pal-title">
                Mods
              </h2>
            </div>

            <div className="flex gap-2 p-1 pal-panel-dark">
              <button
                onClick={() => setActiveTab('search')}
                className={`pal-btn ${activeTab === 'search' ? 'pal-btn-active' : ''}`}
              >
                <Search className="w-4 h-4" />
                Browse
              </button>
              <button
                onClick={() => setActiveTab('installed')}
                className={`pal-btn ${activeTab === 'installed' ? 'pal-btn-active' : ''}`}
              >
                <Package className="w-4 h-4" />
                Installed ({installedMods.length})
              </button>
              <button
                onClick={() => setActiveTab('dependencies')}
                className={`pal-btn ${activeTab === 'dependencies' ? 'pal-btn-active' : ''}`}
              >
                <Layers className="w-4 h-4" />
                Dependencies
                {depStats.missingDeps > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('nexus')}
                className={`pal-btn ${activeTab === 'nexus' ? 'pal-btn-active' : ''}`}
              >
                <Globe className="w-4 h-4" />
                Nexus
              </button>
            </div>
          </div>

          <div className="flex gap-6 min-h-[500px]">
            <div className="flex-1 flex flex-col gap-4">
              {activeTab === 'search' && (
                <div className="pal-panel p-6 flex flex-col min-h-[400px]">
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
                        className="pal-btn pal-btn-blue h-12"
                      >
                        {isSearchingMods ? 'Searching...' : 'Search'}
                      </button>
                    </form>
                  </div>

                  <div className="flex flex-col gap-3 flex-1">
                    {modResults.map((mod) => (
                      <div
                        key={mod.id}
                        className="pal-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-500/50 transition-colors group relative"
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
                          {(() => {
                            const isInstalled = installedMods.some(m => {
                              const cleanModName = mod.name.toLowerCase().replace(/[^a-z0-9]/g, '')
                              const cleanInstalledName = m.name.toLowerCase().replace(/(_p)?\.(pak|zip)$/g, '').replace(/[^a-z0-9]/g, '')
                              return cleanModName.includes(cleanInstalledName) || cleanInstalledName.includes(cleanModName)
                            })
                            
                            if (isInstalled) {
                              return (
                                <div
                                  className="px-4 py-2.5 rounded-lg flex items-center justify-center bg-green-500/10 text-green-400 border border-green-500/30"
                                  title="Mod is installed"
                                >
                                  <span className="font-bold text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                    Installed
                                  </span>
                                </div>
                              )
                            }
                            
                            return (
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
                            )
                          })()}
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

              {activeTab === 'dependencies' && (
                <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
                  {/* Summary Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
                    <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-4 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Total Mods
                        </p>
                        <h4 className="text-2xl font-bold text-on-surface mt-0.5">{installedMods.length}</h4>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                        <Package className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-4 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Satisfied Dependencies
                        </p>
                        <h4 className="text-2xl font-bold text-emerald-400 mt-0.5">
                          {depStats.satisfiedDeps}
                        </h4>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    </div>

                    <div
                      className={`bg-surface-container-low border rounded-xl p-4 flex items-center justify-between shadow-sm transition-all ${depStats.missingDeps > 0 ? 'border-amber-500/30' : 'border-surface-container-highest'}`}
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Missing Dependencies
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <h4
                            className={`text-2xl font-bold ${depStats.missingDeps > 0 ? 'text-amber-400' : 'text-on-surface-variant'}`}
                          >
                            {depStats.missingDeps}
                          </h4>
                          {depStats.missingDeps > 0 && (
                            <button
                              onClick={handleInstallAllMissingDependencies}
                              disabled={isInstallingAllDeps || installingModId !== null}
                              className="px-3 py-1 bg-blue-500 hover:brightness-110 text-on-primary font-bold text-xs rounded-lg transition-all shadow-glow flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                              title="Install all missing dependencies automatically"
                            >
                              <Download
                                className={`w-3.5 h-3.5 ${isInstallingAllDeps ? 'animate-bounce' : ''}`}
                              />
                              {isInstallingAllDeps
                                ? `Installing (${installAllProgress.current}/${installAllProgress.total})...`
                                : 'Install All'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${depStats.missingDeps > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-surface-container text-on-surface-variant'}`}
                      >
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Batch progress banner */}
                  {isInstallingAllDeps && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 mb-4 flex items-center gap-3 text-blue-400 text-xs font-semibold animate-pulse shrink-0">
                      <Download className="w-4 h-4 animate-bounce shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-sm">
                          Installing Missing Dependencies ({installAllProgress.current}/
                          {installAllProgress.total})...
                        </p>
                        <p className="text-blue-400/80">
                          {installAllProgress.text ||
                            'Resolving and installing missing mod packages...'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Filter & Refresh Header */}
                  <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filter installed mods or dependencies by name..."
                        value={depSearchFilter}
                        onChange={(e) => setDepSearchFilter(e.target.value)}
                        className="w-full bg-surface-container border border-surface-container-highest rounded-lg pl-11 pr-4 py-2.5 text-on-surface outline-none focus:border-blue-500/50 text-sm shadow-glass"
                      />
                    </div>
                    {depStats.missingDeps > 0 && (
                      <button
                        onClick={handleInstallAllMissingDependencies}
                        disabled={isInstallingAllDeps || installingModId !== null}
                        className="px-4 py-2.5 bg-blue-500 hover:brightness-110 text-on-primary rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-glow disabled:opacity-50 shrink-0"
                      >
                        <Download
                          className={`w-4 h-4 ${isInstallingAllDeps ? 'animate-bounce' : ''}`}
                        />
                        {isInstallingAllDeps
                          ? `Installing (${installAllProgress.current}/${installAllProgress.total})...`
                          : `Install All Missing (${depStats.missingDeps})`}
                      </button>
                    )}
                    <button
                      onClick={() => fetchModDependencies()}
                      disabled={isLoadingDependencies}
                      className="px-4 py-2.5 bg-surface-container border border-surface-container-highest hover:bg-surface-container-highest rounded-lg text-sm font-bold text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-2 disabled:opacity-50"
                      title="Re-scan installed mod dependencies"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isLoadingDependencies ? 'animate-spin text-blue-400' : ''}`}
                      />
                      Refresh
                    </button>
                  </div>

                  {/* Dependencies List */}
                  <div className="bg-surface-container-low border border-surface-container-highest rounded-2xl p-6 shadow-glass flex flex-col flex-1 min-h-[400px]">
                    {isLoadingDependencies ? (
                      <div className="flex flex-col items-center justify-center flex-1 py-12">
                        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                        <p className="text-on-surface-variant text-sm">
                          Inspecting mod manifests and dependency trees...
                        </p>
                      </div>
                    ) : filteredDependencies.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
                        <Layers className="w-12 h-12 text-on-surface-variant opacity-50 mb-4 stroke-1" />
                        <h4 className="text-lg font-bold text-on-surface">
                          {installedMods.length === 0 ? 'No Mods Installed' : 'No Matching Mods Found'}
                        </h4>
                        <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
                          {installedMods.length === 0
                            ? 'Install mods in the Browse tab to inspect their dependencies.'
                            : 'Try clearing your filter search.'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 pb-6">
                        {filteredDependencies.map((mod: any, idx: number) => {
                          const deps = mod.dependencies || []
                          const hasMissing = deps.some((d: any) => !d.satisfied && d.mandatory)

                          return (
                            <div
                              key={idx}
                              className={`bg-surface-container-lowest border rounded-xl p-5 transition-all shadow-sm ${
                                hasMissing
                                  ? 'border-amber-500/30 hover:border-amber-500/50 bg-amber-500/[0.02]'
                                  : 'border-white/5 hover:border-blue-500/30'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                                <div>
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <h4 className="font-bold text-on-surface text-base">{mod.name}</h4>
                                    {mod.version && (
                                      <span className="text-xs font-mono bg-white/10 text-on-surface-variant px-2 py-0.5 rounded">
                                        v{mod.version}
                                      </span>
                                    )}
                                    <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-semibold border border-blue-500/30">
                                      {mod.type || 'Pak'} Mod
                                    </span>
                                  </div>
                                  <p className="text-xs font-mono text-on-surface-variant mt-1 truncate">
                                    {mod.fileName} • {formatBytes(mod.size)}
                                  </p>
                                </div>

                                <div className="text-xs text-on-surface-variant shrink-0 font-semibold flex items-center gap-2">
                                  <span>
                                    {deps.length} {deps.length === 1 ? 'dependency' : 'dependencies'}
                                  </span>
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
                                  <p className="text-xs text-on-surface-variant italic">
                                    No external dependencies declared.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2.5">
                                    {deps.map((dep: any, dIdx: number) => {
                                      const isInstalling = installingModId === dep.id

                                      return (
                                        <div
                                          key={dIdx}
                                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                                            dep.satisfied
                                              ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'
                                              : dep.mandatory
                                                ? 'bg-amber-900/20 border-amber-500/30 text-amber-300'
                                                : 'bg-surface-container border-white/10 text-on-surface-variant'
                                          }`}
                                        >
                                          {dep.satisfied ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                          ) : (
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                          )}

                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-on-surface">{dep.name}</span>
                                            {dep.version && dep.version !== '*' && (
                                              <span className="text-[11px] font-mono text-on-surface-variant opacity-80">
                                                ({dep.version})
                                              </span>
                                            )}
                                            <span
                                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                                                dep.mandatory
                                                  ? 'bg-white/10 text-on-surface'
                                                  : 'bg-white/5 text-on-surface-variant'
                                              }`}
                                            >
                                              {dep.mandatory ? 'Required' : 'Optional'}
                                            </span>
                                          </div>

                                          {!dep.satisfied && (
                                            <button
                                              onClick={() => handleInstallMissingDependency(dep.id)}
                                              disabled={isInstalling || installingModId !== null}
                                              className="ml-2 px-2.5 py-1 bg-blue-500 hover:brightness-110 text-on-primary font-bold rounded text-[11px] transition-all disabled:opacity-50 shadow-sm flex items-center gap-1"
                                            >
                                              {isInstalling ? (
                                                <>
                                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                                  Installing...
                                                </>
                                              ) : (
                                                <>
                                                  <Download className="w-3 h-3" />
                                                  Install
                                                </>
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'nexus' && (
                <div className="bg-surface-container-low border border-surface-container-highest rounded-2xl shadow-glass flex flex-col min-h-[600px] overflow-hidden">
                  <webview
                    src="https://www.nexusmods.com/palworld"
                    className="w-full h-full border-none flex-1 bg-surface-container-lowest min-h-[600px]"
                  />
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
