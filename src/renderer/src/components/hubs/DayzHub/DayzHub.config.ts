import React from 'react';
import dayzBg from '../../../assets/dayz-bg.jpg';

export const config = {
  gameName: 'DayZ',
  steamAppId: 223350,
  component: React.lazy(() => import('./DayzHub').then(m => ({ default: m.DayzHub }))),
  backgroundUrl: dayzBg,
  theme: {
    ringColor: 'hover:ring-red-500',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    textColor: 'group-hover:text-red-400',
    bgGradient: 'from-[#8b0000]/30 via-[#3a0000]/20 to-[#050505]'
  }
};
