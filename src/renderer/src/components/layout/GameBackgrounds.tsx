import React from 'react'
import { useUiStore } from '../../store/useUiStore'

export const GameBackgrounds: React.FC = () => {
  const { activeGameHub, hoveredGame } = useUiStore()

  return (
    <>
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#0a1f0a] via-[#1b5e20] to-[#051105] pointer-events-none transition-opacity duration-700 ease-in-out ${hoveredGame === 'Minecraft' || activeGameHub === 'Minecraft' ? 'opacity-100' : 'opacity-0'}`}
      ></div>
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#42c0ff]/40 via-[#fcb746]/20 to-[#050505] pointer-events-none transition-opacity duration-700 ease-in-out ${hoveredGame === 'Palworld' || activeGameHub === 'Palworld' ? 'opacity-100' : 'opacity-0'}`}
      ></div>
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#8b0000]/30 via-[#3a0000]/20 to-[#050505] pointer-events-none transition-opacity duration-700 ease-in-out ${hoveredGame === 'DayZ' || activeGameHub === 'DayZ' ? 'opacity-100' : 'opacity-0'}`}
      ></div>
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#fa9549]/35 via-[#7c2d12]/25 to-[#050505] pointer-events-none transition-opacity duration-700 ease-in-out ${hoveredGame === 'Satisfactory' || activeGameHub === 'Satisfactory' ? 'opacity-100' : 'opacity-0'}`}
      ></div>
    </>
  )
}
