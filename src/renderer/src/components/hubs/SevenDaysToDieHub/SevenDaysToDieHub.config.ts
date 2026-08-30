import React from 'react';
import sevenDtdBg from '../../../assets/7dtd-bg.jpg';

export const config = {
  gameName: '7 Days to Die',
  steamAppId: 294420,
  component: React.lazy(() => import('./SevenDaysToDieHub').then(m => ({ default: m.SevenDaysToDieHub }))),
  backgroundUrl: sevenDtdBg,
  theme: {
    ringColor: 'hover:ring-red-700',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(185,28,28,0.3)]',
    textColor: 'group-hover:text-[#b91c1c]',
    bgGradient: 'from-[#b91c1c]/30 via-[#7f1d1d]/20 to-[#050505]'
  }
};
