import React from 'react';
import 'overlayscrollbars/overlayscrollbars.css';
import { AnimatedBackground } from '../../AnimatedBackground';
import { MinecraftHubProvider, useMinecraftHubContext } from '../../../contexts/MinecraftHubContext';
import { MinecraftModpackPrompt } from './MinecraftModpackPrompt';
import { MinecraftHubHeader } from './MinecraftHubHeader';
import { MinecraftHubNavigation } from './MinecraftHubNavigation';
import { MinecraftHubTabContent } from './MinecraftHubTabContent';

const MinecraftHubContent: React.FC = () => {
  const { activeServer } = useMinecraftHubContext();

  if (!activeServer) return null;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <MinecraftModpackPrompt />
      <AnimatedBackground />
      
      <div className="glass-panel p-6 flex flex-col gap-6 z-10 border-b-0 rounded-b-none">
        <MinecraftHubHeader />
        <MinecraftHubNavigation />
      </div>

      <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col border border-t-0 border-white/5 shadow-inner z-10">
        <MinecraftHubTabContent />
      </div>
    </div>
  );
};

export function MinecraftHub() {
  return (
    <MinecraftHubProvider>
      <MinecraftHubContent />
    </MinecraftHubProvider>
  );
}