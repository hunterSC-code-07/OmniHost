import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

interface Props {
  serverId: number;
}

export const TheForestAdminTab: React.FC<Props> = ({ serverId }) => {
  const sendCommand = (cmd: string) => {
    // @ts-ignore
    window.api.server.sendCommand(serverId, cmd);
  };

  const actions = [
    { label: 'Heal All', command: '/heal', icon: 'favorite', color: 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 hover:border-green-400' },
    { label: 'Feed All', command: '/feed', icon: 'restaurant', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-400' },
    { label: 'Starve All', command: '/starve', icon: 'no_meals', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-400' },
    { label: 'Kill All Enemies', command: '/kill', icon: 'skull', color: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 hover:border-red-400' },
    { label: 'Save Game', command: '/save', icon: 'save', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400' },
    { label: 'Restart Server', command: '/restart', icon: 'restart_alt', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400' }
  ];

  return (
    <div className="absolute inset-0 flex flex-col px-12 py-8 min-h-0 bg-transparent text-white">
      <div className="border-b border-white/10 pb-4 mb-8 flex justify-between items-center">
        <div>
          <h3 className="forest-title !text-3xl text-[var(--forest-yellow)] mb-1">ADMIN ACTIONS</h3>
          <p className="font-bold text-white/50 text-sm">EXECUTE IN-GAME COMMANDS DIRECTLY FROM THE DASHBOARD</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => sendCommand(action.command)}
                className="flex flex-col items-center justify-center gap-3 p-8 bg-[var(--forest-gray)] transition-colors hover:bg-[var(--forest-gray-light)] group border border-transparent hover:border-white/10"
              >
                <span className="material-symbols-outlined text-[48px] text-white/50 group-hover:text-[var(--forest-yellow)] transition-colors">{action.icon}</span>
                <span className="forest-title !text-xl text-white group-hover:text-[var(--forest-yellow)]">{action.label}</span>
                <span className="font-mono font-bold text-xs bg-[var(--forest-gray-dark)] text-white/50 rounded px-3 py-1">{action.command}</span>
              </button>
            ))}
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};
