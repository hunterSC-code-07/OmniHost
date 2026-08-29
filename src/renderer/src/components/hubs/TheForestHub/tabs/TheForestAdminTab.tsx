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
    <div className="absolute inset-0 flex flex-col p-8 min-h-0 bg-transparent">
      <div className="border-b border-outline-variant/20 pb-6 mb-6">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Admin Actions</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Execute in-game admin commands directly from the dashboard.</p>
      </div>

      <div className="flex-1 overflow-hidden bg-surface/80 backdrop-blur-md rounded-xl border border-outline-variant/30 flex flex-col">
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => sendCommand(action.command)}
                  className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border transition-all hover:scale-105 hover:shadow-lg ${action.color}`}
                >
                  <span className="material-symbols-outlined text-[48px]">{action.icon}</span>
                  <span className="font-headline-sm text-headline-sm font-bold">{action.label}</span>
                  <span className="font-mono text-xs opacity-70 border border-current rounded px-2 py-1">{action.command}</span>
                </button>
              ))}
            </div>
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};
