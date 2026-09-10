import React from 'react';
import theForestBg from '../../../assets/theforest-bg.jpg';

export const config = {
  gameName: 'The Forest',
  steamAppId: 556450,
  component: React.lazy(() => import('./TheForestHub').then(m => ({ default: m.TheForestHub }))),
  backgroundUrl: theForestBg,
  theme: {
    ringColor: 'hover:ring-green-600',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(22,163,74,0.2)]',
    textColor: 'group-hover:text-green-500',
    bgGradient: 'from-[#16a34a]/30 via-[#14532d]/20 to-[#050505]'
  }
};
