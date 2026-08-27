import React from 'react'
import { useServerStore } from '../../store/useServerStore'
import { useUiStore } from '../../store/useUiStore'
import { useToastStore } from '../../store/useToastStore'

const getGameThemeColor = (game: string | null) => {
  if (!game) return { omni: '#ffffff', host: '#cccccc' }
  const g = game.toLowerCase()
  if (g.includes('minecraft')) return { omni: '#4ade80', host: '#bbf7d0' }
  if (g.includes('palworld')) return { omni: '#3b82f6', host: '#bfdbfe' }
  if (g.includes('dayz')) return { omni: '#ef4444', host: '#fecaca' }
  if (g.includes('satisfactory')) return { omni: '#eab308', host: '#fef08a' }
  return { omni: '#ffffff', host: '#cccccc' }
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const TopNavbar: React.FC = () => {
  const { activeServerId, setActiveServerId } = useServerStore()
  const {
    activeGameHub,
    lastGameHub,
    setActiveGameHub,
    isClearingCache,
    setIsClearingCache,
    cacheSize,
    setCacheSize
  } = useUiStore()
  const { showToast } = useToastStore()

  const handleClearCache = async () => {
    setIsClearingCache(true)
    try {
      // @ts-ignore
      await window.api.system.clearCache()
      setCacheSize(0)
      showToast('Cache successfully cleared!')
    } catch (e: any) {
      showToast(`Failed to clear cache: ${e.message || e}`)
    } finally {
      setIsClearingCache(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#121212] to-[#050505] z-40 border-b border-white/5 shadow-lg">
      <div className="h-full px-gutter w-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-default group">
            <h1
              className="text-[34px] leading-none tracking-tight font-bold flex items-center whitespace-nowrap transition-transform duration-300 group-hover:scale-105"
              style={{ fontFamily: '"Oswald", sans-serif' }}
            >
              <span
                className={`mr-2 logo-sweep ${activeGameHub ? 'active' : ''}`}
                style={
                  {
                    '--logo-default-color': '#ffffff',
                    '--logo-game-color': getGameThemeColor(activeGameHub || lastGameHub).omni
                  } as React.CSSProperties
                }
              >
                Omni
              </span>
              <span
                className={`logo-sweep ${activeGameHub ? 'active' : ''}`}
                style={
                  {
                    '--logo-default-color': '#cccccc',
                    '--logo-game-color': getGameThemeColor(activeGameHub || lastGameHub).host
                  } as React.CSSProperties
                }
              >
                Host
              </span>
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => {
                setActiveServerId(null)
                setActiveGameHub(null)
              }}
              className={`flex items-center gap-2 font-bold transition-all ${activeServerId === null && activeGameHub === null ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="font-label-md text-label-md">Dashboard</span>
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          {activeServerId === null && activeGameHub === null && (
            <button
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="relative overflow-hidden group px-2.5 py-2 rounded-lg border bg-surface/40 border-outline-variant/30 text-on-surface-variant hover:text-red-400 hover:border-red-500/50 transition-all flex items-center justify-center"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${isClearingCache ? 'animate-spin' : ''}`}
              >
                {isClearingCache ? 'sync' : 'delete'}
              </span>
              <span className="max-w-0 overflow-hidden group-hover:max-w-[200px] transition-all duration-300 ease-out whitespace-nowrap ml-0 group-hover:ml-2 text-sm font-semibold opacity-0 group-hover:opacity-100">
                Clear {formatBytes(cacheSize)}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
