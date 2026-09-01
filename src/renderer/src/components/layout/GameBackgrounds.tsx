import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { HUB_REGISTRY } from './HubRegistry';

export const GameBackgrounds: React.FC = () => {
  const { activeGameHub, hoveredGame } = useUiStore();

  return (
    <>
      {Object.values(HUB_REGISTRY).map(config => {
        if (!config.theme.bgGradient) return null;
        const isActive = (hoveredGame === config.gameName && activeGameHub === null) || (activeGameHub === config.gameName && config.gameName !== 'Minecraft');
        return (
          <div 
            key={config.gameName}
            className={`absolute inset-0 bg-gradient-to-br ${config.theme.bgGradient} pointer-events-none transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
          />
        );
      })}
    </>
  );
};
