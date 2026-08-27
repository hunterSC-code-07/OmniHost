import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useMinecraftHubContext } from '../../../contexts/MinecraftHubContext';

export const MinecraftHubNavigation: React.FC = () => {
  const { activeTab, handleTabChange } = useMinecraftHubContext();

  return (
    <div className="w-full pb-1">
      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer>
        <div className="flex items-center gap-2 min-w-max pt-2 pb-2 px-1">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'console', label: 'Console', icon: 'terminal' },
            { id: 'options', label: 'Options', icon: 'settings' },
            { id: 'players', label: 'Players', icon: 'group' },
            { id: 'mods', label: 'Mods', icon: 'extension' },
            { id: 'software', label: 'Software', icon: 'memory' },
            { id: 'files', label: 'Files', icon: 'folder' },
            { id: 'backups', label: 'Backups', icon: 'save' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-300 ease-out whitespace-nowrap hover:-translate-y-1 hover:scale-105 ${
                activeTab === tab.id 
                ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(76,175,80,0.1)]' 
                : 'text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};
