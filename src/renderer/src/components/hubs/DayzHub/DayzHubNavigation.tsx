import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useDayzHubStore } from '../../../store/useDayzHubStore';

export const DayzHubNavigation: React.FC = () => {
  const { activeTab, handleTabChange } = useDayzHubStore();

  return (
    <div className="w-full pb-1">
      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer>
        <div className="flex items-center gap-2 min-w-max pb-2 pt-2 px-1">
          {[
            { id: 'console', label: 'Console', icon: 'terminal' },
            { id: 'options', label: 'Options', icon: 'settings' },
            { id: 'economy', label: 'Economy', icon: 'storefront' },
            { id: 'mods', label: 'Workshop', icon: 'extension' },
            { id: 'installed', label: 'Installed Mods', icon: 'inventory_2' },
            { id: 'files', label: 'Files', icon: 'folder' },
            { id: 'vppadmin', label: 'VPP Admin', icon: 'admin_panel_settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-300 ease-out whitespace-nowrap hover:-translate-y-1 hover:scale-105 ${activeTab === tab.id
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
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
