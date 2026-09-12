import {
  accessSync,
  constants,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  statfsSync,
  writeFileSync
} from 'fs'
import { app } from 'electron'
import { dirname, isAbsolute, join, normalize, parse, resolve } from 'path'
import type { SteamCacheStorageInfo } from '@shared/steamCacheStorage'

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

export class SteamCacheStorageService {
  constructor(private readonly getUserDataDirectory: () => string) {}

  getDefaultPath(): string {
    return join(this.getUserDataDirectory(), 'steam_cache')
  }

  getPath(): string {
    const settings = this.readSettings()
    return settings.customPath ?? this.getDefaultPath()
  }

  getInfo(): SteamCacheStorageInfo {
    const defaultPath = this.getDefaultPath()
    const currentPath = this.getPath()

    return {
      path: currentPath,
      defaultPath,
      isCustom: !pathsEqual(currentPath, defaultPath),
      freeBytes: this.getFreeBytes(currentPath)
    }
  }

  setPath(directoryPath: string): SteamCacheStorageInfo {
    const normalizedPath = this.validateSelectedPath(directoryPath)
    const customPath = pathsEqual(normalizedPath, this.getDefaultPath()) ? null : normalizedPath
    this.writeSettings({ version: 1, customPath })
    return this.getInfo()
  }

  resetPath(): SteamCacheStorageInfo {
    this.writeSettings({ version: 1, customPath: null })
    return this.getInfo()
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

    const normalizedPath = normalize(directoryPath.trim())
    if (!statSync(normalizedPath).isDirectory()) {
      throw new Error('Steam cache location must be a folder')
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
