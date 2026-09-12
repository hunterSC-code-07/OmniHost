import { useCallback, useEffect, useState } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import type { SteamCacheStorageInfo } from '@shared/steamCacheStorage'
import { useToastStore } from '../../store/useToastStore'

type SettingsTab = 'storage' | 'diagnostics'

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('storage')
  const [logs, setLogs] = useState<string>('Loading logs...')
  const [logPath, setLogPath] = useState<string>('')
  const [storageInfo, setStorageInfo] = useState<SteamCacheStorageInfo | null>(null)
  const [storageLoading, setStorageLoading] = useState(true)
  const [storageAction, setStorageAction] = useState<'browse' | 'reset' | null>(null)
  const { showToast } = useToastStore()

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
    } catch (error) {
      showToast(`Could not load storage settings: ${getErrorMessage(error)}`, 'error')
    } finally {
      setStorageLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (activeTab === 'storage') {
      void loadStorageInfo()
    } else {
      void loadLogs()
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
          </div>

          <div className="flex min-w-0 flex-1 flex-col p-6">
            {activeTab === 'storage' && (
              <div className="flex h-full flex-col">
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
          </div>
        </div>
      </div>
    </div>
  )
}
