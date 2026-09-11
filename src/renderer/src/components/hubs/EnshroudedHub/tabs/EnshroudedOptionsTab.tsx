import { useEffect, useState } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

import { type EnshroudedConfig, useEnshroudedOptions } from '../../../../hooks/useEnshroudedOptions'
import { useServerStore } from '../../../../store/useServerStore'

const inputClassName =
  'w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/10'

const Field = ({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: React.ReactNode
}): React.JSX.Element => (
  <label className="flex flex-col gap-2.5">
    <span className="font-label-sm text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
      {label}
    </span>
    {children}
    {hint && <span className="text-xs leading-5 text-white/35">{hint}</span>}
  </label>
)

export const EnshroudedOptionsTab: React.FC = () => {
  const { config, loading, handleSave } = useEnshroudedOptions()
  const currentServer = useServerStore((state) =>
    state.servers.find((server) => server.id === state.activeServerId)
  )
  const [localConfig, setLocalConfig] = useState<EnshroudedConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (config) setLocalConfig(config)
  }, [config])

  if (loading || !localConfig) {
    return (
      <div
        className="flex h-full items-center justify-center"
        data-testid="enshrouded-options-loading"
      >
        <div className="flex flex-col items-center gap-3 text-white/45">
          <span className="material-symbols-outlined animate-spin text-3xl text-amber-300">
            progress_activity
          </span>
          <span className="font-label-sm text-xs uppercase tracking-widest">
            Loading configuration
          </span>
        </div>
      </div>
    )
  }

  const handleChange = (field: keyof EnshroudedConfig, value: string | number): void => {
    setLocalConfig((current) => (current ? { ...current, [field]: value } : current))
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setIsSaving(true)
    try {
      await handleSave(localConfig)
    } finally {
      setIsSaving(false)
    }
  }

  const isOnline = currentServer?.status === 'Online'

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 px-7 py-6 sm:flex-row sm:items-end">
        <div>
          <p className="enshrouded-kicker mb-2">World configuration</p>
          <h2 className="font-headline-lg text-3xl font-bold text-white">Options</h2>
          <p className="mt-2 text-sm text-white/45">
            Identity, access, ports, capacity, and storage paths for this world.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="enshrouded-btn enshrouded-btn-primary flex min-w-[150px] items-center justify-center gap-2"
          data-testid="enshrouded-save-options"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${isSaving ? 'animate-spin' : ''}`}
          >
            {isSaving ? 'progress_activity' : 'save'}
          </span>
          {isSaving ? 'Saving' : 'Save changes'}
        </button>
      </div>

      <OverlayScrollbarsComponent
        className="min-h-0 flex-1"
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
        defer
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-7">
          {isOnline && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm text-amber-100/75">
              <span className="material-symbols-outlined mt-0.5 text-[19px] text-amber-300">
                warning
              </span>
              <span>
                Stop the server before saving. Enshrouded reads this file when the process starts.
              </span>
            </div>
          )}

          <section className="enshrouded-panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="material-symbols-outlined text-amber-300">badge</span>
              <div>
                <h3 className="font-headline-md text-lg font-semibold text-white">
                  Identity & access
                </h3>
                <p className="mt-0.5 text-xs text-white/40">
                  How the world appears and who can enter
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              <Field label="Server name" hint="Shown in the Enshrouded server browser.">
                <input
                  type="text"
                  value={localConfig.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className={inputClassName}
                  placeholder="My Enshrouded World"
                  required
                />
              </Field>

              <Field label="Admin password" hint="Leave empty to allow access without a password.">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={localConfig.password || ''}
                    onChange={(event) => handleChange('password', event.target.value)}
                    className={`${inputClassName} pr-12`}
                    placeholder="No password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/35 transition hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </Field>
            </div>
          </section>

          <section className="enshrouded-panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="material-symbols-outlined text-amber-300">lan</span>
              <div>
                <h3 className="font-headline-md text-lg font-semibold text-white">
                  Network & capacity
                </h3>
                <p className="mt-0.5 text-xs text-white/40">
                  Listener address and public server capacity
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Bind address" hint="0.0.0.0 listens on every network interface.">
                <input
                  type="text"
                  value={localConfig.ip}
                  onChange={(event) => handleChange('ip', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Game port" hint="Default: 15636 UDP">
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={localConfig.gamePort}
                  onChange={(event) => handleChange('gamePort', Number(event.target.value))}
                  className={inputClassName}
                  required
                />
              </Field>
              <Field label="Query port" hint="Default: 15637 UDP">
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={localConfig.queryPort}
                  onChange={(event) => handleChange('queryPort', Number(event.target.value))}
                  className={inputClassName}
                  required
                />
              </Field>
              <Field label="Player slots" hint="Enshrouded supports up to 16 players.">
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={localConfig.slotCount}
                  onChange={(event) => handleChange('slotCount', Number(event.target.value))}
                  className={inputClassName}
                  required
                />
              </Field>
            </div>
          </section>

          <section className="enshrouded-panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="material-symbols-outlined text-amber-300">folder_data</span>
              <div>
                <h3 className="font-headline-md text-lg font-semibold text-white">Storage</h3>
                <p className="mt-0.5 text-xs text-white/40">
                  Paths are relative to the server installation
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              <Field label="Save directory" hint="World and character persistence files.">
                <input
                  type="text"
                  value={localConfig.saveDirectory}
                  onChange={(event) => handleChange('saveDirectory', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Log directory" hint="Runtime and diagnostic output files.">
                <input
                  type="text"
                  value={localConfig.logDirectory}
                  onChange={(event) => handleChange('logDirectory', event.target.value)}
                  className={inputClassName}
                />
              </Field>
            </div>
          </section>
        </div>
      </OverlayScrollbarsComponent>
    </form>
  )
}
