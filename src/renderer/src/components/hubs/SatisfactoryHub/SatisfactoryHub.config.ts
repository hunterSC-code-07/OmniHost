import React from 'react';
import satisfactoryBg from '../../../assets/satisfactory-bg.jpg';

export const config = {
  gameName: 'Satisfactory',
  steamAppId: 1690800,
  component: React.lazy(() => import('./SatisfactoryHub').then(m => ({ default: m.SatisfactoryHub }))),
  backgroundUrl: satisfactoryBg,
  theme: {
    ringColor: 'hover:ring-[#fa9549]',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(250,149,73,0.2)]',
    textColor: 'group-hover:text-[#fa9549]',
    bgGradient: 'from-[#fa9549]/35 via-[#7c2d12]/25 to-[#050505]'
  }
};
