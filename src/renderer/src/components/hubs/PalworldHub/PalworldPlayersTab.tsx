import React from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'

import { usePlayerStore } from '../../../store/usePlayerStore'
import { useServerStore } from '../../../store/useServerStore'

export const PalworldPlayersTab: React.FC = () => {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const { onlinePlayers, bannedPlayers, setBannedPlayers, playerListType, setPlayerListType } = usePlayerStore()
  const players = onlinePlayers[activeServerId!] || []
  const banned = bannedPlayers[activeServerId!] || []
  
  const isBannedView = playerListType === 'banned-players'
  const displayPlayers = isBannedView ? banned : players

  React.useEffect(() => {
    if (isBannedView && activeServerId) {
      window.api.palworld.getBannedPlayers(activeServerId).then(list => {
        setBannedPlayers(activeServerId.toString(), list)
      })
    }
  }, [isBannedView, activeServerId])

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
                {isBannedView ? 'Banned Players' : 'Online Players'}
                <span className="bg-blue-500/20 text-blue-400 text-sm px-3 py-1 rounded-full border border-blue-500/30">
                  {displayPlayers.length}
                </span>
              </h2>
            </div>
            <div className="flex bg-surface-container-highest p-1 rounded-lg">
              <button
                onClick={() => setPlayerListType('live')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${!isBannedView ? 'bg-blue-500/20 text-blue-400' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
              >
                Live
              </button>
              <button
                onClick={() => setPlayerListType('banned-players')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${isBannedView ? 'bg-red-500/20 text-red-400' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
              >
                Banned
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayPlayers.length === 0 ? (
              <div className="col-span-full h-40 flex items-center justify-center text-on-surface-variant font-label-lg uppercase tracking-widest bg-surface-container-low border border-surface-container-highest rounded-xl">
                No players currently online
              </div>
            ) : (
              displayPlayers.map((playerData) => {
                const isObject = typeof playerData === 'object' && playerData !== null;
                let rawName = isObject ? (playerData.name || playerData.userId || 'Unknown') : String(playerData);
                const name = typeof rawName === 'object' ? JSON.stringify(rawName) : String(rawName);
                const userId = isObject ? playerData.userId : null;
                const playerId = isObject ? playerData.playerId : null;
                const uniqueId = userId || playerId || name;
                const targetId = userId || playerId || name;
                
                return (
                  <div
                    key={uniqueId}
                    className="bg-surface-container-low border border-surface-container-highest rounded-xl p-4 flex items-center gap-4 hover:border-blue-500/40 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                        person
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-on-surface truncate text-lg">{name}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isBannedView ? (
                        <button 
                          onClick={() => {
                            window.api.server.sendCommand(activeServerId!, `/UnbanPlayer ${targetId}`)
                            setTimeout(() => {
                              window.api.palworld.getBannedPlayers(activeServerId!).then(list => setBannedPlayers(activeServerId!.toString(), list))
                            }, 1000)
                          }}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                          title="Unban Player"
                        >
                          Unban
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => window.api.server.sendCommand(activeServerId!, `/KickPlayer ${targetId}`)}
                            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                            title="Kick Player"
                          >
                            Kick
                          </button>
                          <button 
                            onClick={() => window.api.server.sendCommand(activeServerId!, `/BanPlayer ${targetId}`)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                            title="Ban Player"
                          >
                            Ban
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </div>
  )
}
