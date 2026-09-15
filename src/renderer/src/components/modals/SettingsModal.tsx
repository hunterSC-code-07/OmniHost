import { useCallback, useEffect, useState } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import type { SteamCacheStorageInfo } from '@shared/steamCacheStorage'
import { useToastStore } from '../../store/useToastStore'
import { useUiStore } from '../../store/useUiStore'

type SettingsTab = 'general' | 'storage' | 'diagnostics' | 'integrations'

function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'Unavailable'
  if (bytes === 0) return '0 Bytes'

  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [logs, setLogs] = useState<string>('Loading logs...')
  const [logPath, setLogPath] = useState<string>('')
  const [storageInfo, setStorageInfo] = useState<SteamCacheStorageInfo | null>(null)
  const [serverStorageInfo, setServerStorageInfo] = useState<any | null>(null)
  const [storageLoading, setStorageLoading] = useState(true)
  const [storageAction, setStorageAction] = useState<'browse' | 'reset' | null>(null)
  const [serverStorageAction, setServerStorageAction] = useState<'browse' | 'reset' | null>(null)
  const [discordToken, setDiscordToken] = useState('')
  const [discordAutoStart, setDiscordAutoStart] = useState(false)
  const [discordRunning, setDiscordRunning] = useState(false)
  const [discordLoading, setDiscordLoading] = useState(false)
  const [isSelectingSound, setIsSelectingSound] = useState(false)
  const { showToast } = useToastStore()
  const { playBootSound, setPlayBootSound, bootSoundVolume, setBootSoundVolume, useCustomBootSound, setUseCustomBootSound } = useUiStore()

  const loadLogs = useCallback(async () => {
    try {
      const fetchedLogs = await window.api.log.getLogs()
      setLogs(fetchedLogs || 'No logs found.')
      const path = await window.api.log.getLogPath()
      setLogPath(path)
    } catch {
      setLogs('Failed to load logs.')
    }
  }, [])

  const loadStorageInfo = useCallback(async () => {
    setStorageLoading(true)
    try {
      setStorageInfo(await window.api.steam.getCacheStorage())
      setServerStorageInfo(await window.api.system.getServerStorage())
    } catch (error) {
      showToast(`Could not load storage settings: ${getErrorMessage(error)}`, 'error')
    } finally {
      setStorageLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (activeTab === 'storage') {
      void loadStorageInfo()
    } else if (activeTab === 'diagnostics') {
      void loadLogs()
    } else if (activeTab === 'integrations') {
      void window.api.discord.getSettings().then((settings: any) => {
        setDiscordToken(settings.token)
        setDiscordAutoStart(settings.autoStart)
      })
      void window.api.discord.getBotStatus().then((status: boolean) => {
        setDiscordRunning(status)
      })
    }
  }, [activeTab, loadLogs, loadStorageInfo])

  const browseForStorage = async (): Promise<void> => {
    setStorageAction('browse')
    try {
      const selectedStorage =
        (await window.api.steam.selectCacheStorage()) as SteamCacheStorageInfo | null
      if (selectedStorage) {
        setStorageInfo(selectedStorage)
        showToast('Steam base-cache folder updated.', 'success')
      }
    } catch (error) {
      showToast(`Could not change the cache folder: ${getErrorMessage(error)}`, 'error')
    } finally {
      setStorageAction(null)
    }
  }

  const resetStorage = async (): Promise<void> => {
    setStorageAction('reset')
    try {
      const defaultStorage = (await window.api.steam.resetCacheStorage()) as SteamCacheStorageInfo
      setStorageInfo(defaultStorage)
      showToast('Steam base-cache folder reset to default.', 'success')
    } catch (error) {
      showToast(`Could not reset the cache folder: ${getErrorMessage(error)}`, 'error')
    } finally {
      setStorageAction(null)
    }
  }

  const browseForServerStorage = async (): Promise<void> => {
    setServerStorageAction('browse')
    try {
      const selectedStorage = await window.api.system.selectServerStorage()
      if (selectedStorage) {
        setServerStorageInfo(selectedStorage)
        showToast('Server instances folder updated.', 'success')
      }
    } catch (error) {
      showToast(`Could not change the server instances folder: ${getErrorMessage(error)}`, 'error')
    } finally {
      setServerStorageAction(null)
    }
  }

  const resetServerStorage = async (): Promise<void> => {
    setServerStorageAction('reset')
    try {
      const defaultStorage = await window.api.system.resetServerStorage()
      setServerStorageInfo(defaultStorage)
      showToast('Server instances folder reset to default.', 'success')
    } catch (error) {
      showToast(`Could not reset the server instances folder: ${getErrorMessage(error)}`, 'error')
    } finally {
      setServerStorageAction(null)
    }
  }

  const copyToClipboard = (): void => {
    void navigator.clipboard.writeText(logs)
    showToast('Logs copied to clipboard!')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in [-webkit-app-region:no-drag]">
      <div className="relative flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface/95 shadow-2xl backdrop-blur-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/30 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
              <span className="material-symbols-outlined text-2xl text-primary">settings</span>
            </div>
            <div>
              <h2 className="mb-1 text-xl font-bold text-white">Global Settings</h2>
              <p className="text-sm text-on-surface-variant">
                Manage application preferences and diagnostics
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-bright/50 hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex w-64 shrink-0 flex-col gap-2 border-r border-outline-variant/30 p-4">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 font-bold transition-colors ${
                activeTab === 'general'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-transparent text-on-surface-variant hover:bg-surface-bright/50 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 font-bold transition-colors ${
                activeTab === 'storage'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-transparent text-on-surface-variant hover:bg-surface-bright/50 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">hard_drive</span>
              Storage
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diagnostics')}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 font-bold transition-colors ${
                activeTab === 'diagnostics'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-transparent text-on-surface-variant hover:bg-surface-bright/50 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">bug_report</span>
              Diagnostics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('integrations')}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 font-bold transition-colors ${
                activeTab === 'integrations'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-transparent text-on-surface-variant hover:bg-surface-bright/50 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">integration_instructions</span>
              Integrations
            </button>
          </div>

          <div className="flex min-w-0 flex-1 flex-col p-6">
            {activeTab === 'general' && (
              <div className="flex h-full flex-col overflow-y-auto pr-2">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">General Settings</h3>
                    <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
                      Manage basic application preferences.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-outline-variant/30 bg-surface-container/50 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Play Boot Sound</h4>
                        <p className="text-xs text-on-surface-variant">Play an audio greeting when OmniHost is launched.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlayBootSound(!playBootSound)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          playBootSound ? 'bg-primary' : 'bg-surface-bright'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            playBootSound ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {playBootSound && (
                      <div className="mt-4 border-t border-outline-variant/20 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-bold text-white">Volume</label>
                          <span className="text-xs text-on-surface-variant font-mono">{Math.round(bootSoundVolume * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.01" 
                          value={bootSoundVolume}
                          onChange={(e) => setBootSoundVolume(parseFloat(e.target.value))}
                          className="w-full accent-primary bg-surface-bright h-2 rounded-lg appearance-none cursor-pointer mb-6"
                        />

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-bold text-white">Custom Audio File</label>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={async () => {
                                setIsSelectingSound(true)
                                try {
                                  // @ts-ignore
                                  const success = await window.api.system.selectCustomBootSound()
                                  if (success) {
                                    setUseCustomBootSound(true)
                                    showToast('Custom boot sound selected successfully.', 'success')
                                  }
                                } catch (e) {
                                  showToast(`Could not select audio file: ${getErrorMessage(e)}`, 'error')
                                } finally {
                                  setIsSelectingSound(false)
                                }
                              }}
                              disabled={isSelectingSound}
                              className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/20 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[19px]">
                                {isSelectingSound ? 'progress_activity' : 'audio_file'}
                              </span>
                              {useCustomBootSound ? 'Change Custom Audio...' : 'Select Custom Audio...'}
                            </button>
                            
                            {useCustomBootSound && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    // @ts-ignore
                                    await window.api.system.clearCustomBootSound()
                                    setUseCustomBootSound(false)
                                    showToast('Reset to default boot sound.', 'success')
                                  } catch (e) {
                                    showToast(`Could not reset audio file: ${getErrorMessage(e)}`, 'error')
                                  }
                                }}
                                className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-bright/30 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-surface-bright/60"
                              >
                                <span className="material-symbols-outlined text-[19px]">restart_alt</span>
                                Reset to Default
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="flex h-full flex-col overflow-y-auto pr-2">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Steam Base Cache</h3>
                    <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
                      Choose where SteamCMD stores reusable dedicated-server base files.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Refresh storage information"
                    onClick={() => void loadStorageInfo()}
                    disabled={storageLoading || storageAction !== null}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      className={`material-symbols-outlined text-[19px] ${storageLoading ? 'animate-spin' : ''}`}
                    >
                      refresh
                    </span>
                  </button>
                </div>

                {storageLoading && !storageInfo ? (
                  <div className="flex flex-1 items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined mr-2 animate-spin">
                      progress_activity
                    </span>
                    Loading storage information…
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-outline-variant/30 bg-surface-container/50 p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                          Current folder
                        </span>
                        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                          {storageInfo?.isCustom ? 'Custom' : 'Default'}
                        </span>
                      </div>
                      <p
                        title={storageInfo?.path}
                        className="select-all break-all rounded-lg border border-outline-variant/20 bg-black/20 px-3 py-3 font-mono text-sm text-white"
                      >
                        {storageInfo?.path ?? 'Storage information unavailable'}
                      </p>

                      <div className="mt-4 flex items-center gap-3 rounded-lg bg-black/15 px-3 py-3">
                        <span className="material-symbols-outlined text-primary">database</span>
                        <div>
                          <p className="text-xs text-on-surface-variant">Available space</p>
                          <p className="font-bold text-white">
                            {formatBytes(storageInfo?.freeBytes ?? null)}
                          </p>
                        </div>
                      </div>

                      {storageInfo?.isCustom && (
                        <p className="mt-4 break-all text-xs text-on-surface-variant">
                          Default: <span className="font-mono">{storageInfo.defaultPath}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void browseForStorage()}
                        disabled={storageAction !== null}
                        className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/20 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {storageAction === 'browse' ? 'progress_activity' : 'folder_open'}
                        </span>
                        Browse…
                      </button>
                      <button
                        type="button"
                        onClick={() => void resetStorage()}
                        disabled={!storageInfo?.isCustom || storageAction !== null}
                        className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-bright/30 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-surface-bright/60 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-[19px]">restart_alt</span>
                        Reset to Default
                      </button>
                    </div>

                    <div className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined shrink-0 text-amber-300">
                        info
                      </span>
                      <p>
                        Changing this folder does not move or delete existing caches. New downloads
                        use the selected folder; switch back to a previous location to use files
                        left there. Avoid changing it while a Steam download is running.
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="my-8 border-t border-outline-variant/30"></div>

                    {/* Server Instances Storage */}
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">Server Instances Folder</h3>
                        <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
                          Choose where OmniHost stores the game server files.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-outline-variant/30 bg-surface-container/50 p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                          Current folder
                        </span>
                        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                          {serverStorageInfo?.isCustom ? 'Custom' : 'Default'}
                        </span>
                      </div>
                      <p
                        title={serverStorageInfo?.path}
                        className="select-all break-all rounded-lg border border-outline-variant/20 bg-black/20 px-3 py-3 font-mono text-sm text-white"
                      >
                        {serverStorageInfo?.path ?? 'Storage information unavailable'}
                      </p>

                      <div className="mt-4 flex items-center gap-3 rounded-lg bg-black/15 px-3 py-3">
                        <span className="material-symbols-outlined text-primary">database</span>
                        <div>
                          <p className="text-xs text-on-surface-variant">Available space</p>
                          <p className="font-bold text-white">
                            {formatBytes(serverStorageInfo?.freeBytes ?? null)}
                          </p>
                        </div>
                      </div>

                      {serverStorageInfo?.isCustom && (
                        <p className="mt-4 break-all text-xs text-on-surface-variant">
                          Default: <span className="font-mono">{serverStorageInfo.defaultPath}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => void browseForServerStorage()}
                        disabled={serverStorageAction !== null}
                        className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/20 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {serverStorageAction === 'browse' ? 'progress_activity' : 'folder_open'}
                        </span>
                        Browse…
                      </button>
                      <button
                        type="button"
                        onClick={() => void resetServerStorage()}
                        disabled={!serverStorageInfo?.isCustom || serverStorageAction !== null}
                        className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-bright/30 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-surface-bright/60 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-[19px]">restart_alt</span>
                        Reset to Default
                      </button>
                    </div>
                    
                    <div className="flex gap-3 mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined shrink-0 text-red-400">
                        warning
                      </span>
                      <p className="text-red-300">
                        Important: Changing this folder does not automatically move your existing servers. 
                        Your existing servers will disappear from the UI until you manually move the files to the new location.
                      </p>
                    </div>

                  </div>
                )}
              </div>
            )}

            {activeTab === 'diagnostics' && (
              <div className="flex h-full flex-col">
                <div className="mb-4 flex shrink-0 items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Application Logs</h3>
                    <p className="mt-1 select-all font-mono text-xs text-on-surface-variant">
                      {logPath}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void loadLogs()}
                      className="flex items-center gap-2 rounded-lg bg-surface-bright/50 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-surface-bright"
                    >
                      <span className="material-symbols-outlined text-[18px]">refresh</span> Refresh
                    </button>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/20 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/30"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>{' '}
                      Copy
                    </button>
                  </div>
                </div>

                <div className="relative min-h-0 flex-1 rounded-xl border border-outline-variant/30 bg-[#050505]">
                  <OverlayScrollbarsComponent
                    options={{ scrollbars: { theme: 'os-theme-light', autoHide: 'leave' } }}
                    className="custom-scrollbar h-full w-full"
                  >
                    <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs text-on-surface-variant">
                      {logs}
                    </pre>
                  </OverlayScrollbarsComponent>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="flex h-full flex-col overflow-y-auto pr-2">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Discord Bot</h3>
                    <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
                      Allow users to start and stop OmniHost servers directly from Discord.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${discordRunning ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500/50'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {discordRunning ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-outline-variant/30 bg-surface-container/50 p-5">
                    <label className="mb-2 block text-sm font-bold text-white">
                      Bot Token
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        value={discordToken}
                        onChange={(e) => {
                          setDiscordToken(e.target.value)
                          window.api.discord.setToken(e.target.value)
                        }}
                        placeholder="Paste your Discord Bot Token here..."
                        className="flex-1 rounded-lg border border-outline-variant/30 bg-black/20 px-4 py-2.5 font-mono text-sm text-white focus:border-primary/50 focus:outline-none"
                      />
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Create a bot on the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-primary hover:underline">Discord Developer Portal</a> to get your token.
                    </p>

                    <div className="mt-6 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Auto-Start with OmniHost</h4>
                        <p className="text-xs text-on-surface-variant">Automatically connect the bot when OmniHost launches.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = !discordAutoStart
                          setDiscordAutoStart(newVal)
                          window.api.discord.setAutoStart(newVal)
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          discordAutoStart ? 'bg-primary' : 'bg-surface-bright'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            discordAutoStart ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-6 flex gap-3 pt-6 border-t border-outline-variant/20">
                      {!discordRunning ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!discordToken) {
                              showToast('Please enter a Discord Bot Token first', 'error')
                              return
                            }
                            setDiscordLoading(true)
                            try {
                              const isRunning = await window.api.discord.startBot(discordToken)
                              setDiscordRunning(isRunning)
                              if (isRunning) showToast('Discord Bot started successfully!', 'success')
                            } catch (e) {
                              showToast(`Failed to start bot: ${getErrorMessage(e)}`, 'error')
                            } finally {
                              setDiscordLoading(false)
                            }
                          }}
                          disabled={discordLoading}
                          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {discordLoading ? 'progress_activity' : 'play_arrow'}
                          </span>
                          Start Bot
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            setDiscordLoading(true)
                            try {
                              await window.api.discord.stopBot()
                              setDiscordRunning(false)
                              showToast('Discord Bot stopped.', 'success')
                            } catch (e) {
                              showToast(`Failed to stop bot: ${getErrorMessage(e)}`, 'error')
                            } finally {
                              setDiscordLoading(false)
                            }
                          }}
                          disabled={discordLoading}
                          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {discordLoading ? 'progress_activity' : 'stop'}
                          </span>
                          Stop Bot
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
                      <span className="material-symbols-outlined text-[18px]">terminal</span>
                      Available Slash Commands
                    </h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-on-surface-variant">
                      <li><strong className="text-white">/list</strong> - View all your servers and their status</li>
                      <li><strong className="text-white">/start &lt;id&gt;</strong> - Start a server</li>
                      <li><strong className="text-white">/stop &lt;id&gt;</strong> - Stop a server</li>
                      <li><strong className="text-white">/status &lt;id&gt;</strong> - View detailed live status of a server</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
