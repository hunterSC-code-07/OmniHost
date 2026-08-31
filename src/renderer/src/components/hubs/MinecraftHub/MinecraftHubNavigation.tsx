import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useMinecraftHubStore } from '../../../store/useMinecraftHubStore';

export const MinecraftHubNavigation: React.FC = () => {
  const { activeTab, handleTabChange } = useMinecraftHubStore();

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
              className={`minecraft-btn flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id 
                ? 'minecraft-btn-active' 
                : ''
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
