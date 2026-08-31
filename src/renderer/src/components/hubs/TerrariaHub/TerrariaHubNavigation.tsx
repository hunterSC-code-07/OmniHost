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
              className={`flex items-center gap-2 px-5 py-2.5 terraria-btn transition-all duration-300 ease-out whitespace-nowrap hover:-translate-y-1 hover:scale-105 ${activeTab === tab.id
                  ? 'terraria-btn-active'
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
