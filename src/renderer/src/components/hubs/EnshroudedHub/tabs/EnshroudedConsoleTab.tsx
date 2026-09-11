import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

import { useLogStore } from '../../../../store/useLogStore'
import { useServerStore } from '../../../../store/useServerStore'

export const EnshroudedConsoleTab: React.FC = () => {
  const activeServerId = useServerStore((state) => state.activeServerId)
  const serverStatus = useServerStore(
    (state) =>
      state.servers.find((server) => server.id === state.activeServerId)?.status || 'Offline'
  )
  const allLogs = useLogStore((state) => state.logs)
  const logs = activeServerId
    ? allLogs
        .filter((log) => log.id === activeServerId.toString() || log.id === 'global')
        .map((log) => log.msg)
    : []

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 px-7 py-6 sm:flex-row sm:items-end">
        <div>
          <p className="enshrouded-kicker mb-2">Runtime output</p>
          <h2 className="font-headline-lg text-3xl font-bold text-white">Console</h2>
          <p className="mt-2 text-sm text-white/45">
            Live process messages and diagnostics from the dedicated server.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 font-label-sm text-[10px] uppercase tracking-widest text-white/45">
          <span
            className={`h-1.5 w-1.5 rounded-full ${serverStatus === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-white/25'}`}
          />
          {serverStatus}
        </div>
      </div>

      <div className="min-h-0 flex-1 p-5 lg:p-6">
        <div className="enshrouded-panel flex h-full min-h-0 flex-col overflow-hidden bg-black/45">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <span className="font-label-sm text-[10px] uppercase tracking-[0.14em] text-white/30">
              enshrouded_server.log · read only
            </span>
          </div>

          <OverlayScrollbarsComponent
            className="min-h-0 flex-1"
            options={{
              scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 }
            }}
            defer
          >
            <div className="min-h-full p-5 font-mono text-[13px] leading-6" aria-live="polite">
              {logs.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center text-white/35">
                  <span className="material-symbols-outlined text-4xl text-amber-300/55">
                    terminal
                  </span>
                  <div>
                    <p className="font-sans text-sm font-medium text-white/55">
                      Waiting for server output
                    </p>
                    <p className="mt-1 font-sans text-xs text-white/30">
                      Start the server to see runtime messages here.
                    </p>
                  </div>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={`${index}-${log.slice(0, 16)}`}
                    className="flex gap-3 border-b border-white/[0.035] py-1.5 text-white/68"
                  >
                    <span className="select-none text-white/20">
                      {String(index + 1).padStart(3, '0')}
                    </span>
                    <span className="break-all">{log}</span>
                  </div>
                ))
              )}
            </div>
          </OverlayScrollbarsComponent>

          <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-4 py-2 font-label-sm text-[10px] uppercase tracking-wider text-white/30">
            <span>{logs.length} entries</span>
            <span>Commands are not supported by Enshrouded</span>
          </div>
        </div>
      </div>
    </div>
  )
}
