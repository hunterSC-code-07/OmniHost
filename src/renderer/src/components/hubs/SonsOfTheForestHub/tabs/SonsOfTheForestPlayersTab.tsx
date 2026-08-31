import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { usePlayerStore } from '../../../../store/usePlayerStore';

interface SonsOfTheForestPlayersTabProps {
  serverId: number;
}

export const SonsOfTheForestPlayersTab: React.FC<SonsOfTheForestPlayersTabProps> = ({ serverId }) => {
  const { onlinePlayers: allOnlinePlayers } = usePlayerStore();
  const onlinePlayers = serverId ? (allOnlinePlayers[serverId] || []) : [];

  const handleKick = (playerName: string) => {
    window.api.server.sendCommand(serverId, `kick ${playerName}`);
  };

  const handleBan = (playerName: string) => {
    window.api.server.sendCommand(serverId, `ban ${playerName}`);
  };

  return (
    <div className="flex-1 min-h-0 bg-transparent flex flex-col items-center">
      <div className="w-full max-w-4xl flex-1 flex flex-col mt-4 mb-4">
        
        <div className="sotf-section-header mb-4">LIVE PLAYERS ({onlinePlayers.length})</div>

        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0 w-full sotf-scrollbars border border-[var(--sotf-border)] bg-[var(--sotf-panel)]" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="flex flex-col">
            {onlinePlayers.length === 0 ? (
              <div className="p-8 text-center text-[var(--sotf-text-dim)] font-bold uppercase tracking-widest">
                NO PLAYERS ONLINE
              </div>
            ) : (
              onlinePlayers.map((playerName, idx) => (
                <div key={idx} className="sotf-row hover:bg-[#1a1a1a]">
                  <div className="flex items-center gap-4 w-[40%]">
                    <span className="material-symbols-outlined text-[var(--sotf-text-dim)]">person</span>
                    <span className="sotf-label font-bold text-white">{playerName}</span>
                  </div>
                  <div className="w-[60%] flex justify-end gap-4">
                    <button onClick={() => handleKick(playerName)} className="sotf-btn text-sm hover:text-[var(--sotf-highlight)]">KICK</button>
                    <button onClick={() => handleBan(playerName)} className="sotf-btn text-sm hover:text-red-500">BAN</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </OverlayScrollbarsComponent>
        
      </div>
    </div>
  );
};
