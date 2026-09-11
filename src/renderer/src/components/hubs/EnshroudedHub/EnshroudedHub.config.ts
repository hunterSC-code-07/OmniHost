import React from 'react'
import { ENSHROUDED_BACKGROUND_URL } from './EnshroudedHub.constants'

export const config = {
  gameName: 'Enshrouded',
  steamAppId: 2278520,
  component: React.lazy(() =>
    import('./EnshroudedHub').then((m) => ({ default: m.EnshroudedHub }))
  ),
  backgroundUrl: ENSHROUDED_BACKGROUND_URL,
  theme: {
    ringColor: 'hover:ring-[#2f86d6]',
    shadowColor: 'hover:shadow-[0_0_30px_rgba(47,134,214,0.2)]',
    textColor: 'group-hover:text-[#2f86d6]',
    bgGradient: 'from-[#051326] via-[#10294d] to-[#050505]'
  }
}
