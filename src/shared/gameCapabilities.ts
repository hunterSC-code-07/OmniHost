export interface GameCapability {
  defaultPort: number
  supportedPlatforms: NodeJS.Platform[]
}

const WINDOWS_ONLY: NodeJS.Platform[] = ['win32']

export const GAME_CAPABILITIES: Record<string, GameCapability> = {
  minecraft: { defaultPort: 25565, supportedPlatforms: WINDOWS_ONLY },
  palworld: { defaultPort: 8211, supportedPlatforms: WINDOWS_ONLY },
  dayz: { defaultPort: 2302, supportedPlatforms: WINDOWS_ONLY },
  satisfactory: { defaultPort: 7777, supportedPlatforms: WINDOWS_ONLY },
  '7 days to die': { defaultPort: 26900, supportedPlatforms: WINDOWS_ONLY },
  terraria: { defaultPort: 7777, supportedPlatforms: WINDOWS_ONLY },
  enshrouded: { defaultPort: 15636, supportedPlatforms: WINDOWS_ONLY },
  'sons of the forest': { defaultPort: 8766, supportedPlatforms: WINDOWS_ONLY },
  'the forest': { defaultPort: 8766, supportedPlatforms: WINDOWS_ONLY }
}

export function normalizeGameName(game: string): string {
  const baseName = game
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
    .toLowerCase()
  return baseName === '7dtd' ? '7 days to die' : baseName
}

export function getGameCapability(game: string): GameCapability {
  return (
    GAME_CAPABILITIES[normalizeGameName(game)] ?? {
      defaultPort: 25565,
      supportedPlatforms: WINDOWS_ONLY
    }
  )
}
