import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { SteamCacheStorageService } from '@main/steam/SteamCacheStorage'

const temporaryDirectories: string[] = []

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'omnihost-steam-storage-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('SteamCacheStorageService', () => {
  it('defaults to the existing user-data Steam cache', () => {
    const userDataDirectory = createTemporaryDirectory()
    const storage = new SteamCacheStorageService(() => userDataDirectory)

    expect(storage.getInfo()).toMatchObject({
      path: join(userDataDirectory, 'steam_cache'),
      defaultPath: join(userDataDirectory, 'steam_cache'),
      isCustom: false
    })
  })

  it('persists a selected folder across service instances', () => {
    const rootDirectory = createTemporaryDirectory()
    const userDataDirectory = join(rootDirectory, 'user-data')
    const selectedDirectory = join(rootDirectory, 'large-drive-cache')
    mkdirSync(selectedDirectory, { recursive: true })

    new SteamCacheStorageService(() => userDataDirectory).setPath(selectedDirectory)
    const reloadedStorage = new SteamCacheStorageService(() => userDataDirectory)

    expect(reloadedStorage.getInfo()).toMatchObject({
      path: selectedDirectory,
      isCustom: true
    })
  })

  it('resets the preference without deleting the custom cache', () => {
    const rootDirectory = createTemporaryDirectory()
    const userDataDirectory = join(rootDirectory, 'user-data')
    const selectedDirectory = join(rootDirectory, 'large-drive-cache')
    const cachedFile = join(selectedDirectory, '2278520', 'enshrouded_server.exe')
    mkdirSync(join(selectedDirectory, '2278520'), { recursive: true })
    writeFileSync(cachedFile, 'cached server')

    const storage = new SteamCacheStorageService(() => userDataDirectory)
    storage.setPath(selectedDirectory)
    const resetInfo = storage.resetPath()

    expect(resetInfo.path).toBe(join(userDataDirectory, 'steam_cache'))
    expect(resetInfo.isCustom).toBe(false)
    expect(existsSync(cachedFile)).toBe(true)
  })
})
