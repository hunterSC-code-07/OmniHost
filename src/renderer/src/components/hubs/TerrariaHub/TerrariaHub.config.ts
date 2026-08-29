import React from 'react';
import terrariaBg from '../../../assets/terraria/terraria-bg.jpg';

export const config = {
  gameName: 'Terraria',
  steamAppId: 105600,
  component: React.lazy(() => import('./TerrariaHub').then(m => ({ default: m.TerrariaHub }))),
  backgroundUrl: terrariaBg,
  theme: {
    ringColor: 'hover:ring-green-500',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]',
    textColor: 'group-hover:text-green-400',
    bgGradient: 'from-[#0b3f18]/30 via-[#051a09]/20 to-[#050505]'
  }
};
