import React from 'react';
import minecraftBg from '../../../assets/minecraft-bg.png';

export const config = {
  gameName: 'Minecraft',
  // steamAppId not applicable
  component: React.lazy(() => import('./MinecraftHub').then(m => ({ default: m.MinecraftHub }))),
  backgroundUrl: minecraftBg,
  theme: {
    ringColor: 'hover:ring-primary',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(76,175,80,0.15)]',
    textColor: 'group-hover:text-primary',
    bgGradient: 'from-[#0a1f0a] via-[#1b5e20] to-[#051105]'
  }
};
