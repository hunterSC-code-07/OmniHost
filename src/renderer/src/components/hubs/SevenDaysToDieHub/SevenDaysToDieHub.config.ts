import React from 'react';

export const config = {
  gameName: '7 Days to Die',
  steamAppId: 294420,
  component: React.lazy(() => import('./SevenDaysToDieHub').then(m => ({ default: m.SevenDaysToDieHub }))),
  backgroundUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000',
  theme: {
    ringColor: 'hover:ring-yellow-600',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(202,138,4,0.2)]',
    textColor: 'group-hover:text-yellow-500',
    bgGradient: 'from-[#ca8a04]/30 via-[#713f12]/20 to-[#050505]'
  }
};
