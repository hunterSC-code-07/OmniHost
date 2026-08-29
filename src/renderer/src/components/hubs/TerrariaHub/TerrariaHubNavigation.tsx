import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

interface TerrariaHubNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TerrariaHubNavigation: React.FC<TerrariaHubNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-full pb-1">
      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer>
        <div className="flex items-center gap-2 min-w-max pb-2 pt-2 px-1">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'console', label: 'Console', icon: 'terminal' },
            { id: 'options', label: 'Options', icon: 'settings' },
            { id: 'players', label: 'Live Players', icon: 'groups' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-300 ease-out whitespace-nowrap hover:-translate-y-1 hover:scale-105 ${activeTab === tab.id
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
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
