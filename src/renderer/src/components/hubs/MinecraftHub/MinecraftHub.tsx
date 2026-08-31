import React from 'react';
import 'overlayscrollbars/overlayscrollbars.css';
import '../../../assets/minecraft-ui.css';
import { AnimatedBackground } from '../../AnimatedBackground';
import { useServerStore } from '../../../store/useServerStore';
import { useMinecraftHubStore } from '../../../store/useMinecraftHubStore';
import { MinecraftModpackPrompt } from './MinecraftModpackPrompt';
import { MinecraftHubHeader } from './MinecraftHubHeader';
import { MinecraftHubNavigation } from './MinecraftHubNavigation';
import { MinecraftHubTabContent } from './MinecraftHubTabContent';

const MinecraftHubContent: React.FC = () => {
  const { activeServerId, servers } = useServerStore();
  const currentServer = servers.find(s => s.id === activeServerId);
  const activeServer = currentServer;
  const { fetchServerMeta, isDarkMode } = useMinecraftHubStore();

  React.useEffect(() => {
    if (activeServerId !== null) {
      fetchServerMeta(activeServerId);
    }
  }, [activeServerId, fetchServerMeta]);

  if (!activeServer) return null;

  return (
    <div className={`flex-1 flex flex-col relative overflow-hidden minecraft-ui ${isDarkMode ? 'minecraft-ui-dark' : ''}`}>
      <MinecraftModpackPrompt />
      <AnimatedBackground />
      
      <div className="minecraft-panel p-6 flex flex-col gap-6 z-10 border-b-0">
        <MinecraftHubHeader />
        <MinecraftHubNavigation />
      </div>

      <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col minecraft-panel z-10">
        <MinecraftHubTabContent />
      </div>
    </div>
  );
};

export const MinecraftHub = MinecraftHubContent;