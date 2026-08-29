import React, { useEffect, useState } from 'react';
import { useServerStore } from '../../../../store/useServerStore';

export const TerrariaPlayersTab: React.FC = () => {
  const { activeServerId, servers } = useServerStore();
  const currentServer = servers.find(s => s.id === activeServerId);
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    if (!currentServer) return;
    
    // Attempt to read current players if supported via status or IPC.
    // In our process manager, we emit 'online-players'.
    const handlePlayers = (data: { id: number, players: string[] }) => {
      if (data.id === currentServer.id) {
        setPlayers(data.players || []);
      }
    };

    window.api.server.onOnlinePlayers(handlePlayers);
  }, [currentServer?.id]);

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
      <div className="flex justify-between items-center bg-black/40 p-6 rounded-xl border border-white/5 glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400">groups</span>
            Live Players
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage players currently connected to the server.</p>
        </div>
        <div className="text-3xl font-bold text-white px-6">
          {players.length} <span className="text-sm text-gray-400 uppercase tracking-widest ml-1">Online</span>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-xl border border-white/5 bg-black/60 overflow-hidden relative p-6">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">person_off</span>
            <p className="font-bold uppercase tracking-widest text-sm">No players online</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-900/50 rounded flex items-center justify-center text-green-400 border border-green-500/30">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <span className="text-white font-bold">{p}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleKick(p)} className="px-3 py-1.5 bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/40 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-yellow-500/30" title="Kick Player">
                    Kick
                  </button>
                  <button onClick={() => handleBan(p)} className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-red-500/30" title="Ban Player">
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
