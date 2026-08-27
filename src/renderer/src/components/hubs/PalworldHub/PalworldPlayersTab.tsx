import React from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'

import { usePlayerStore } from '../../../store/usePlayerStore'
import { useServerStore } from '../../../store/useServerStore'

export const PalworldPlayersTab: React.FC = () => {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const players = usePlayerStore((s) => s.onlinePlayers[activeServerId!])
  const displayPlayers = players || []

  return (
    <div className="absolute inset-0 flex min-h-0">
      <OverlayScrollbarsComponent
        className="flex-1 min-h-0 min-w-0 w-full"
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
        defer
      >
        <div className="p-6 bg-transparent font-body flex flex-col gap-6 min-h-full">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] flex items-center gap-3">
                Online Players
                <span className="bg-blue-500/20 text-blue-400 text-sm px-3 py-1 rounded-full border border-blue-500/30">
                  {displayPlayers.length}
                </span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayPlayers.length === 0 ? (
              <div className="col-span-full h-40 flex items-center justify-center text-on-surface-variant font-label-lg uppercase tracking-widest bg-surface-container-low border border-surface-container-highest rounded-xl">
                No players currently online
              </div>
            ) : (
              displayPlayers.map((player) => (
                <div
                  key={player}
                  className="bg-surface-container-low border border-surface-container-highest rounded-xl p-4 flex items-center gap-4 hover:border-blue-500/40 transition-colors"
                >
                  <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                      person
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-on-surface truncate text-lg">{player}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </div>
  )
}
