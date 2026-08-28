import React from 'react';

// Import default backgrounds (for fallbacks)
import minecraftBg from '../../assets/minecraft-bg.png';
import palworldBg from '../../assets/palworld-bg.jpg';
import dayzBg from '../../assets/dayz-bg.jpg';
import satisfactoryBg from '../../assets/satisfactory-bg.jpg';

export interface GameHubConfig {
  gameName: string;
  steamAppId?: number;
  component?: React.LazyExoticComponent<React.ComponentType<any>>;
  backgroundUrl: string;
  theme: {
    ringColor: string;
    shadowColor: string;
    textColor: string;
    bgGradient?: string;
  };
  customStatusComponent?: React.ComponentType<any>;
}

// Dynamically import all config files inside the hubs directory
const configModules = import.meta.glob('../hubs/*/*.config.ts', { eager: true });

export const HUB_REGISTRY: Record<string, GameHubConfig> = {};

for (const path in configModules) {
  const mod = configModules[path] as { config: GameHubConfig };
  if (mod && mod.config && mod.config.gameName) {
    HUB_REGISTRY[mod.config.gameName] = mod.config;
  }
}

export const isGameSupported = (game: string | null): boolean => {
  if (!game) return false;
  return !!HUB_REGISTRY[game]?.component;
};

export const getGameImageUrl = (game: string): string => {
  const config = HUB_REGISTRY[game];
  if (config && config.backgroundUrl) {
    return config.backgroundUrl;
  }
  // Fallbacks for legacy/other names
  if (game.toLowerCase().includes('minecraft')) return minecraftBg;
  if (game.toLowerCase().includes('palworld')) return palworldBg;
  if (game.toLowerCase().includes('dayz')) return dayzBg;
  if (game.toLowerCase().includes('satisfactory')) return satisfactoryBg;
  return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000';
};
