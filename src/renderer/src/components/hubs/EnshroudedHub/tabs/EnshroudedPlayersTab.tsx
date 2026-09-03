import React from 'react';
import { usePlayerStore } from '../../../../store/usePlayerStore';

interface PlayersTabProps {
  serverId: number;
}

export const EnshroudedPlayersTab: React.FC<PlayersTabProps> = ({ serverId }) => {
  const { onlinePlayers } = usePlayerStore();
  const players = onlinePlayers[serverId] || [];

  return (
    <div className="h-full flex flex-col p-6">
      <h3 className="text-2xl font-bold mb-6 text-blue-100">Live Players</h3>
      <div className="flex-1 overflow-y-auto dayz-scrollbars bg-black/40 border border-blue-900/30 rounded">
        {players.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">No players currently connected.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-blue-900/50 bg-black/40 text-gray-400">
                <th className="p-3 font-semibold">Player Name</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={i} className="border-b border-blue-900/20 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-gray-200">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-4 text-xs text-gray-500 text-center">Enshrouded player lists might not reflect immediately depending on game server API limitations.</p>
    </div>
  );
};
