import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '../../../../store/useUiStore';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

interface SevenDaysToDiePlayersTabProps {
  serverId: number;
}

export const SevenDaysToDiePlayersTab: React.FC<SevenDaysToDiePlayersTabProps> = ({ serverId }) => {
  const { onlinePlayers } = useUiStore();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const players = onlinePlayers[serverId] || [];

  const handleCommand = (cmd: string) => {
    // @ts-ignore
    window.api.server.sendCommand(serverId, cmd);
  };

  const actionButtons = [
    {
      id: 'kill',
      label: 'Kill',
      icon: 'skull',
      color: 'text-red-400 hover:bg-red-400/20 hover:border-red-400/50',
      action: (player: string) => handleCommand(`kill ${player}`)
    },
    {
      id: 'heal',
      label: 'Heal',
      icon: 'favorite',
      color: 'text-green-400 hover:bg-green-400/20 hover:border-green-400/50',
      action: (player: string) => handleCommand(`buffplayer ${player} buffHealHealth`)
    },
    {
      id: 'invincible',
      label: 'Invincible',
      icon: 'shield',
      color: 'text-yellow-400 hover:bg-yellow-400/20 hover:border-yellow-400/50',
      action: (player: string) => handleCommand(`buffplayer ${player} buffGodMode`)
    },
    {
      id: 'starve',
      label: 'Starve',
      icon: 'restaurant',
      color: 'text-orange-400 hover:bg-orange-400/20 hover:border-orange-400/50',
      action: (player: string) => handleCommand(`buffplayer ${player} buffStatusHungry`)
    },
    {
      id: 'admin',
      label: 'Make Admin',
      icon: 'admin_panel_settings',
      color: 'text-purple-400 hover:bg-purple-400/20 hover:border-purple-400/50',
      action: (player: string) => handleCommand(`admin add ${player} 0`)
    },
    {
      id: 'kick',
      label: 'Kick',
      icon: 'person_remove',
      color: 'text-gray-400 hover:bg-gray-400/20 hover:border-gray-400/50',
      action: (player: string) => handleCommand(`kick ${player} "Kicked by admin"`)
    }
  ];

  if (players.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8 glass-panel rounded-xl max-w-sm w-full mx-4">
          <span className="material-symbols-outlined text-[48px] text-gray-500 mb-4">group_off</span>
          <h3 className="text-xl font-bold text-gray-300 mb-2">No Players Online</h3>
          <p className="text-gray-500">Wait for survivors to join the server.</p>
        </div>
      </div>
    );
  }

  return (
    <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} defer className="flex-1 h-full">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ff4f4f]">group</span>
            Live Players
          </h3>
          <span className="px-3 py-1 bg-[#ff4f4f]/20 border border-[#ff4f4f]/30 text-[#ff4f4f] rounded-full text-sm font-bold">
            {players.length} Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {players.map((player) => (
              <motion.div
                key={player}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`glass-panel rounded-xl overflow-hidden transition-all duration-300 ${
                  selectedPlayer === player ? 'border-[#ff4f4f]/50 shadow-[0_0_20px_rgba(179,43,43,0.15)]' : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div 
                  className="p-4 cursor-pointer flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors"
                  onClick={() => setSelectedPlayer(selectedPlayer === player ? null : player)}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#b32b2b] to-[#ff4f4f] flex items-center justify-center text-white font-bold text-xl shadow-inner">
                    {player.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate text-lg">{player}</h4>
                    <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Connected
                    </p>
                  </div>
                  <span className={`material-symbols-outlined text-gray-400 transition-transform duration-300 ${selectedPlayer === player ? 'rotate-180 text-white' : ''}`}>
                    expand_more
                  </span>
                </div>

                <AnimatePresence>
                  {selectedPlayer === player && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-black/40 border-t border-white/5"
                    >
                      <div className="p-3 grid grid-cols-2 gap-2">
                        {actionButtons.map((btn) => (
                          <button
                            key={btn.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              btn.action(player);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent bg-white/5 transition-all duration-200 group ${btn.color}`}
                          >
                            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
                              {btn.icon}
                            </span>
                            <span className="font-semibold text-sm">{btn.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </OverlayScrollbarsComponent>
  );
};
