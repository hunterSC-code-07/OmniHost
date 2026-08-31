import React from 'react';
import { useServerStore } from '../../../../store/useServerStore';
import { usePlayerStore } from '../../../../store/usePlayerStore';

export const TerrariaPlayersTab: React.FC = () => {
  const { activeServerId, servers } = useServerStore();
  const currentServer = servers.find(s => s.id === activeServerId);
  const { onlinePlayers: allOnlinePlayers } = usePlayerStore();
  
  const players = activeServerId ? (allOnlinePlayers[activeServerId.toString()] || []) : [];

  const handleKick = async (player: string) => {
    if (activeServerId) {
      await window.api.server.sendCommand(activeServerId, `kick ${player}`);
    }
  };

  const handleBan = async (player: string) => {
    if (activeServerId) {
      await window.api.server.sendCommand(activeServerId, `ban ${player}`);
    }
  };

  if (!currentServer) return null;

  return (
    <div className="flex flex-col h-full gap-4 max-w-4xl mx-auto w-full pb-20">
      <div className="terraria-panel p-6 flex justify-between items-center">
        <div>
          <h2 className="terraria-title flex items-center gap-2 text-2xl">
            <span className="material-symbols-outlined text-green-400">groups</span>
            Live Players
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage players currently connected to the server.</p>
        </div>
        <div className="text-3xl font-bold text-white px-6">
          {players.length} <span className="text-sm text-gray-400 uppercase tracking-widest ml-1">Online</span>
        </div>
      </div>

      <div className="terraria-panel flex-1 relative p-6">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">person_off</span>
            <p className="font-bold uppercase tracking-widest text-sm">No players online</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 terraria-panel-dark transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-900/50 rounded flex items-center justify-center text-green-400 border border-green-500/30">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <span className="text-white font-bold">{p}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleKick(p)} className="terraria-btn py-1 px-3 text-sm" title="Kick Player">
                    Kick
                  </button>
                  <button onClick={() => handleBan(p)} className="terraria-btn terraria-btn-red py-1 px-3 text-sm" title="Ban Player">
                    Ban
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
