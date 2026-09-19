export interface CachedGameInfo {
  appId: number
  gameName: string
  sizeBytes: number
}

export interface SteamCacheStorageInfo {
  path: string
  defaultPath: string
  isCustom: boolean
  freeBytes: number | null
  cachedGames?: CachedGameInfo[]
}

