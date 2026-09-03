import React from 'react';

export const config = {
  gameName: 'Enshrouded',
  steamAppId: 2278520,
  component: React.lazy(() => import('./EnshroudedHub').then(m => ({ default: m.EnshroudedHub }))),
  backgroundUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000',
  theme: {
    ringColor: 'hover:ring-[#2f86d6]',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(47,134,214,0.2)]',
    textColor: 'group-hover:text-[#2f86d6]',
    bgGradient: 'from-[#051326] via-[#10294d] to-[#050505]'
  }
};
