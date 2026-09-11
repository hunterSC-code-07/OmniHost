import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

import { usePlayerStore } from '../../../../store/usePlayerStore'
import { useServerStore } from '../../../../store/useServerStore'

export const EnshroudedPlayersTab: React.FC = () => {
  const activeServerId = useServerStore((state) => state.activeServerId)
  const onlinePlayers = usePlayerStore((state) => state.onlinePlayers)
  const players = activeServerId ? onlinePlayers[activeServerId] || [] : []
  const server = useServerStore((state) =>
    state.servers.find((entry) => entry.id === state.activeServerId)
  )
  const maxPlayers = Number(server?.maxPlayers || server?.slotCount || 16)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 px-7 py-6 sm:flex-row sm:items-end">
        <div>
          <p className="enshrouded-kicker mb-2">World population</p>
          <h2 className="font-headline-lg text-3xl font-bold text-white">Players</h2>
          <p className="mt-2 text-sm text-white/45">
            Current adventurers reported by the running server.
          </p>
        </div>
        <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 font-label-sm text-[11px] uppercase tracking-widest text-amber-200">
          {players.length} of {maxPlayers} online
        </div>
      </div>

      <OverlayScrollbarsComponent
        className="min-h-0 flex-1"
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
        defer
      >
        <div className="mx-auto w-full max-w-6xl p-7">
          {players.length === 0 ? (
            <div className="enshrouded-panel flex min-h-[330px] flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/8">
                <span className="material-symbols-outlined text-3xl text-amber-300/60">
                  person_off
                </span>
              </div>
              <div>
                <h3 className="font-headline-md text-lg font-semibold text-white">
                  No players connected
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                  Share the game address once the world is online. Player updates can take a moment
                  to appear.
                </p>
              </div>
            </div>
          ) : (
            <div className="enshrouded-panel overflow-hidden">
              <div className="grid grid-cols-[72px_1fr_auto] border-b border-white/10 bg-black/15 px-5 py-3 font-label-sm text-[10px] uppercase tracking-[0.13em] text-white/35">
                <span>#</span>
                <span>Player name</span>
                <span>Status</span>
              </div>
              {players.map((player, index) => (
                <div
                  key={`${player}-${index}`}
                  className="grid grid-cols-[72px_1fr_auto] items-center border-b border-white/[0.06] px-5 py-4 last:border-b-0 hover:bg-white/[0.035]"
                >
                  <span className="font-label-sm text-xs text-white/25">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/15 bg-amber-300/8 text-amber-200">
                      <span className="material-symbols-outlined text-[19px]">person</span>
                    </span>
                    <span className="font-medium text-white/85">{player}</span>
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </OverlayScrollbarsComponent>
    </div>
  )
}
