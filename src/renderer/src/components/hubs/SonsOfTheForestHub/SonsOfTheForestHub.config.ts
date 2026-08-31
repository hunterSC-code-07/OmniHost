import React from 'react';

export const config = {
  gameName: 'Sons of the Forest',
  steamAppId: 2465200,
  component: React.lazy(() => import('./SonsOfTheForestHub').then(m => ({ default: m.SonsOfTheForestHub }))),
  backgroundUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000',
  theme: {
    ringColor: 'hover:ring-emerald-600',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    textColor: 'group-hover:text-emerald-500',
    bgGradient: 'from-[#047857]/30 via-[#064e3b]/20 to-[#050505]'
  }
};
