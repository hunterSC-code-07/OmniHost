import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

import { usePlayerStore } from '../../../../store/usePlayerStore'
import { useServerStore } from '../../../../store/useServerStore'

const StatCard = ({
  icon,
  label,
  value,
  accent = false
}: {
  icon: string
  label: string
  value: string
  accent?: boolean
}): React.JSX.Element => (
  <div className="enshrouded-panel flex min-h-[126px] flex-col justify-between p-5">
    <div className="flex items-center justify-between">
      <span className="font-label-sm text-[11px] uppercase tracking-[0.12em] text-white/45">
        {label}
      </span>
      <span
        className={`material-symbols-outlined text-[21px] ${accent ? 'text-amber-300' : 'text-white/35'}`}
      >
        {icon}
      </span>
    </div>
    <div
      className={`font-headline-md text-xl font-semibold ${accent ? 'text-amber-200' : 'text-white'}`}
    >
      {value}
    </div>
  </div>
)

export const EnshroudedOverviewTab: React.FC = () => {
  const activeServerId = useServerStore((state) => state.activeServerId)
  const server = useServerStore((state) =>
    state.servers.find((entry) => entry.id === state.activeServerId)
  )
  const onlinePlayers = usePlayerStore((state) => state.onlinePlayers)
  const players = activeServerId ? onlinePlayers[activeServerId] || [] : []

  if (!server) return null

  const isOnline = server.status === 'Online'
  const gamePort = Number(server.port || server.gamePort || 15636)
  const queryPort = Number(server.queryPort || gamePort + 1)
  const maxPlayers = Number(server.maxPlayers || server.slotCount || 16)
  const version = server.version && server.version !== 'latest' ? server.version : 'Latest'

  return (
    <OverlayScrollbarsComponent
      className="h-full min-h-0 w-full"
      options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
      defer
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 p-7 lg:p-8">
        <section className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
          <div>
            <p className="enshrouded-kicker mb-2">Command overview</p>
            <h2 className="font-headline-lg text-3xl font-bold text-white">Server Overview</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Essential health, capacity, and connection details for this Enshrouded world.
            </p>
          </div>
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 font-label-sm text-[11px] uppercase tracking-widest ${
              isOnline
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : 'border-white/10 bg-white/5 text-white/45'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/25'}`}
            />
            {isOnline ? 'World online' : 'World offline'}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="power_settings_new"
            label="Status"
            value={server.status}
            accent={isOnline}
          />
          <StatCard icon="groups" label="Players" value={`${players.length} / ${maxPlayers}`} />
          <StatCard icon="lan" label="Game port" value={gamePort.toString()} />
          <StatCard icon="manage_search" label="Query port" value={queryPort.toString()} />
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="enshrouded-panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="material-symbols-outlined text-amber-300">explore</span>
              <div>
                <h3 className="font-headline-md text-lg font-semibold text-white">
                  Deployment details
                </h3>
                <p className="mt-0.5 text-xs text-white/40">Current runtime configuration</p>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
              {[
                ['Game', 'Enshrouded'],
                ['Server type', server.type || 'Dedicated Server'],
                ['Version', version],
                ['Connection', `${server.ip || '0.0.0.0'}:${gamePort}`]
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="font-label-sm text-[10px] uppercase tracking-[0.13em] text-white/35">
                    {label}
                  </dt>
                  <dd className="mt-1.5 font-medium text-white/85">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="enshrouded-panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="material-symbols-outlined text-amber-300">checklist</span>
              <div>
                <h3 className="font-headline-md text-lg font-semibold text-white">
                  Before players join
                </h3>
                <p className="mt-0.5 text-xs text-white/40">A quick hosting checklist</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 p-6">
              {[
                `Allow UDP ports ${gamePort} and ${queryPort}, or start the tunnel above.`,
                'Stop the server before changing its JSON configuration.',
                'Start once after installation so Enshrouded can generate its save and log folders.'
              ].map((tip, index) => (
                <div key={tip} className="flex gap-3 text-sm leading-6 text-white/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/10 font-label-sm text-[10px] text-amber-200">
                    {index + 1}
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </OverlayScrollbarsComponent>
  )
}
