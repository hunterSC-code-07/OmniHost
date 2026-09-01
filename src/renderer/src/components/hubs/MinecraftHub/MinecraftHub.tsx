import React from 'react';
import 'overlayscrollbars/overlayscrollbars.css';
import '../../../assets/minecraft-ui.css';
import minecraftBgVideo from '../../../assets/minecraft-animated-bg.mp4';
import minecraftDarkBgVideo from '../../../assets/minecraft-dark-animated-bg.mp4';
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
      
      {/* Animated Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-0' : 'opacity-40'}`}
      >
        <source src={minecraftBgVideo} type="video/mp4" />
      </video>
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-40' : 'opacity-0'}`}
      >
        <source src={minecraftDarkBgVideo} type="video/mp4" />
      </video>
      
      <div className="p-6 flex flex-col gap-6 z-10 border-b-0 border-white/10">
        <MinecraftHubHeader />
        <MinecraftHubNavigation />
      </div>

      <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col z-10">
        <MinecraftHubTabContent />
      </div>
    </div>
  );
};

export const MinecraftHub = MinecraftHubContent;