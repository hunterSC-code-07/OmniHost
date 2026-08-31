import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import { useServerStore } from '../../../../store/useServerStore';
import { usePlayerStore } from '../../../../store/usePlayerStore';

interface Props {
  serverId: number;
}

export const TheForestPlayersTab: React.FC<Props> = ({ serverId }) => {
  const { servers } = useServerStore();
  const { onlinePlayers: allPlayers } = usePlayerStore();

  const server = servers.find(s => s.id === serverId);
  const onlinePlayers = server ? (allPlayers[serverId] || []) : [];

  return (
    <div className="absolute inset-0 flex flex-col p-8 min-h-0 bg-transparent">
      <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-8">
        <div>
          <h3 className="forest-title !text-3xl text-[var(--forest-yellow)]">LIVE PLAYERS</h3>
          <p className="font-bold text-white/50">Players currently on the server</p>
        </div>
        <div className="bg-[var(--forest-gray)] text-white px-4 py-1.5 font-bold text-lg">
          {onlinePlayers.length} ONLINE
        </div>
      </div>

      <div className="flex-1 overflow-hidden forest-panel flex flex-col">
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="p-6">
            {onlinePlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/30">
                <span className="material-symbols-outlined text-[64px] mb-4 opacity-50">group_off</span>
                <p className="font-bold text-xl uppercase">No players are currently online</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlinePlayers.map((playerName, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-[var(--forest-gray)] p-4 hover:bg-[var(--forest-gray-light)] transition-colors group">
                    <div className="w-12 h-12 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[28px]">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="forest-title !text-xl truncate text-white">{playerName}</h3>
                      <p className="font-bold text-[var(--forest-green)] text-sm">IN-GAME</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};
