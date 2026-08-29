import React from 'react';

export const config = {
  gameName: 'The Forest',
  steamAppId: 556450,
  component: React.lazy(() => import('./TheForestHub').then(m => ({ default: m.TheForestHub }))),
  backgroundUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000',
  theme: {
    ringColor: 'hover:ring-green-600',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(22,163,74,0.2)]',
    textColor: 'group-hover:text-green-500',
    bgGradient: 'from-[#16a34a]/30 via-[#14532d]/20 to-[#050505]'
  }
};
