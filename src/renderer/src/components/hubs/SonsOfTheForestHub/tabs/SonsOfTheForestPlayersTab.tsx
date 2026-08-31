import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import { useServerStore } from '../../../../store/useServerStore';
import { usePlayerStore } from '../../../../store/usePlayerStore';

interface Props {
  serverId: number;
}

export const SonsOfTheForestPlayersTab: React.FC<Props> = ({ serverId }) => {
  const { servers } = useServerStore();
  const { onlinePlayers: allPlayers } = usePlayerStore();

  const server = servers.find(s => s.id === serverId);
  const onlinePlayers = server ? (allPlayers[serverId] || []) : [];

  return (
    <div className="absolute inset-0 flex flex-col p-8 min-h-0 bg-transparent">
      <div className="flex justify-between items-end border-b border-outline-variant/20 pb-6 mb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Live Players</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Players currently on the server</p>
        </div>
        <div className="bg-[#16a34a]/10 border border-[#16a34a]/30 text-[#4ade80] px-4 py-1.5 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(22,163,74,0.15)]">
          {onlinePlayers.length} Online
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-surface/80 backdrop-blur-md rounded-xl border border-outline-variant/30 flex flex-col">
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="p-6">
            {onlinePlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-[64px] mb-4 opacity-50">group_off</span>
                <p className="font-body-lg text-body-lg">No players are currently online</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlinePlayers.map((playerName, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-surface-container-highest shadow-sm hover:border-[#4ade80]/50 hover:bg-surface-container-lowest/80 transition-all hover:-translate-y-1 group">
                    <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-[#4ade80] transition-colors shadow-inner">
                      <span className="material-symbols-outlined text-[28px]">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-white transition-colors">{playerName}</h3>
                      <p className="font-label-md text-label-md text-[#4ade80]">In-Game</p>
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
