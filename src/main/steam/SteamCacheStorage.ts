import {
  accessSync,
  constants,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  statfsSync,
  writeFileSync,
  promises as fsPromises
} from 'fs'
import { app } from 'electron'
import { dirname, isAbsolute, join, normalize, parse, resolve } from 'path'
import type { SteamCacheStorageInfo } from '@shared/steamCacheStorage'
import { AdapterRegistry } from '../adapters/AdapterRegistry'

const SETTINGS_FILE_NAME = 'steam-cache-storage.json'

interface SteamCacheStorageSettings {
  version: 1
  customPath: string | null
}

function pathsEqual(firstPath: string, secondPath: string): boolean {
  const first = resolve(firstPath)
  const second = resolve(secondPath)

  return process.platform === 'win32'
    ? first.toLowerCase() === second.toLowerCase()
    : first === second
}

function findExistingParent(targetPath: string): string | null {
  let currentPath = targetPath
  const rootPath = parse(currentPath).root

  while (!existsSync(currentPath)) {
    if (currentPath === rootPath) return null
    const parentPath = dirname(currentPath)
    if (parentPath === currentPath) return null
    currentPath = parentPath
  }

  return currentPath
}

async function getDirectorySize(dir: string): Promise<number> {
  let size = 0
  try {
    const files = await fsPromises.readdir(dir, { withFileTypes: true })
    for (const file of files) {
      const fullPath = join(dir, file.name)
      if (file.isDirectory()) {
        size += await getDirectorySize(fullPath)
      } else if (file.isFile()) {
        size += (await fsPromises.stat(fullPath)).size
      }
    }
  } catch {
    // Ignore errors for unreadable files/folders
  }
  return size
}

export class SteamCacheStorageService {
  constructor(private readonly getUserDataDirectory: () => string) {}

  getDefaultPath(): string {
    return join(this.getUserDataDirectory(), 'steam_cache')
  }

  getPath(): string {
    const settings = this.readSettings()
    return settings.customPath ?? this.getDefaultPath()
  }

  async getInfo(): Promise<SteamCacheStorageInfo> {
    const defaultPath = this.getDefaultPath()
    const currentPath = this.getPath()

    const cachedGames: SteamCacheStorageInfo['cachedGames'] = []
    if (existsSync(currentPath)) {
      const steamConfigs = AdapterRegistry.getSteamGameConfigs()
      for (const [gameName, config] of Object.entries(steamConfigs)) {
        const cacheDir = join(currentPath, config.appId.toString())
        if (config.executable && existsSync(join(cacheDir, config.executable))) {
          const sizeBytes = await getDirectorySize(cacheDir)
          cachedGames.push({ appId: config.appId, gameName, sizeBytes })
        }
      }
    }

    return {
      path: currentPath,
      defaultPath,
      isCustom: !pathsEqual(currentPath, defaultPath),
      freeBytes: this.getFreeBytes(currentPath),
      cachedGames
    }
  }

  async setPath(directoryPath: string): Promise<SteamCacheStorageInfo> {
    const normalizedPath = this.validateSelectedPath(directoryPath)
    const customPath = pathsEqual(normalizedPath, this.getDefaultPath()) ? null : normalizedPath
    this.writeSettings({ version: 1, customPath })
    return await this.getInfo()
  }

  async resetPath(): Promise<SteamCacheStorageInfo> {
    this.writeSettings({ version: 1, customPath: null })
    return await this.getInfo()
  }

  private getSettingsPath(): string {
    return join(this.getUserDataDirectory(), SETTINGS_FILE_NAME)
  }

  private readSettings(): SteamCacheStorageSettings {
    try {
      const rawSettings = JSON.parse(readFileSync(this.getSettingsPath(), 'utf8')) as unknown
      if (!rawSettings || typeof rawSettings !== 'object') {
        return { version: 1, customPath: null }
      }

      const customPath = (rawSettings as { customPath?: unknown }).customPath
      if (typeof customPath !== 'string' || !customPath.trim() || !isAbsolute(customPath)) {
        return { version: 1, customPath: null }
      }

      return { version: 1, customPath: normalize(customPath) }
    } catch {
      return { version: 1, customPath: null }
    }
  }

  private writeSettings(settings: SteamCacheStorageSettings): void {
    const settingsPath = this.getSettingsPath()
    mkdirSync(dirname(settingsPath), { recursive: true })

    const temporaryPath = `${settingsPath}.${process.pid}.tmp`
    writeFileSync(temporaryPath, JSON.stringify(settings, null, 2), 'utf8')
    renameSync(temporaryPath, settingsPath)
  }

  private validateSelectedPath(directoryPath: string): string {
    if (typeof directoryPath !== 'string' || !directoryPath.trim() || !isAbsolute(directoryPath)) {
      throw new Error('Steam cache location must be an absolute folder path')
    }

    let normalizedPath = normalize(directoryPath.trim())
    if (!statSync(normalizedPath).isDirectory()) {
      throw new Error('Steam cache location must be a folder')
    }

    // Auto-detect if they selected the parent of the steam_cache folder
    const autoDetectedPath = join(normalizedPath, 'steam_cache')
    if (existsSync(autoDetectedPath) && statSync(autoDetectedPath).isDirectory()) {
      // Check if the selected path itself already has cache folders
      // to avoid appending steam_cache if the selected path is genuinely a cache root
      let hasDirectCache = false
      const steamConfigs = AdapterRegistry.getSteamGameConfigs()
      for (const config of Object.values(steamConfigs)) {
        if (config.executable && existsSync(join(normalizedPath, config.appId.toString(), config.executable))) {
          hasDirectCache = true
          break
        }
      }
      
      if (!hasDirectCache) {
        normalizedPath = autoDetectedPath
      }
    }

    // The native picker only returns existing folders. This catches read-only
    // locations before SteamCMD begins a large download.
    accessSync(normalizedPath, constants.W_OK)
    return normalizedPath
  }

  private getFreeBytes(directoryPath: string): number | null {
    try {
      const existingPath = findExistingParent(directoryPath)
      if (!existingPath) return null

      const stats = statfsSync(existingPath)
      return Number(stats.bavail) * Number(stats.bsize)
    } catch {
      return null
    }
  }
}

export const steamCacheStorage = new SteamCacheStorageService(() => app.getPath('userData'))
