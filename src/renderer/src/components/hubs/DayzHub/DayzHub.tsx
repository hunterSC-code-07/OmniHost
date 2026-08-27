import React from 'react';
import 'overlayscrollbars/overlayscrollbars.css';
import { DayzAnimatedBackground } from './DayzAnimatedBackground';
import { useServerStore } from '../../../store/useServerStore';
import { useDayzModDownloader } from '../../../hooks/useDayzModDownloader';
import { DayzHubHeader } from './DayzHubHeader';
import { DayzHubNavigation } from './DayzHubNavigation';
import { DayzHubTabContent } from './DayzHubTabContent';

const DayzHubContent: React.FC = () => {
  const { activeServerId, servers } = useServerStore();
  const currentServer = servers.find(s => s.id === activeServerId);
  const activeServer = currentServer;

  // Keep download listener active as long as Hub is mounted
  useDayzModDownloader(activeServerId);

  if (!activeServer) return null;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden dayz-scrollbars">
      <DayzAnimatedBackground />

      <div className="glass-panel p-6 flex flex-col gap-6 z-10 border-b-0 rounded-b-none">
        <DayzHubHeader />
        <DayzHubNavigation />
      </div>

      <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col border border-t-0 border-white/5 shadow-inner z-10">
        <DayzHubTabContent />
      </div>
    </div>
  );
};

export const DayzHub = DayzHubContent;
