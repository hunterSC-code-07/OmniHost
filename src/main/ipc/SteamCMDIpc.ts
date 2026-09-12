import { app, BrowserWindow, dialog } from 'electron'
import type { OpenDialogOptions } from 'electron'
import { handleTrusted } from '../security/ipcSecurity'
const ipcMain = { handle: handleTrusted }
import { join } from 'path'
import { SteamDownloader } from '../steam/SteamDownloader'
import { SteamCache } from '../steam/SteamCache'
import { steamCacheStorage } from '../steam/SteamCacheStorage'
import { SteamWorkshopDownloader } from '../steam/SteamWorkshopDownloader'

function assertSteamCacheStorageCanChange(): void {
  if (SteamDownloader.activeProcess) {
    throw new Error(
      'Steam cache storage cannot be changed while SteamCMD is running. Wait for the current download to finish and try again.'
    )
  }
}

export function registerSteamCMDIpc() {
  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle(
    'install-steam-app',
    async (_, id, appId, username?: string, password?: string, steamGuardCode?: string) => {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      await SteamDownloader.installApp(id, appId, serverDir, username, password, steamGuardCode)
      return true
    }
  )

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle('check-steam-cache', async (_, appId: number) => {
    return await SteamCache.isCached(appId)
  })

  ipcMain.handle('get-steam-cache-storage', () => steamCacheStorage.getInfo())

  ipcMain.handle('select-steam-cache-storage', async (event) => {
    assertSteamCacheStorageCanChange()
    const currentStorage = steamCacheStorage.getInfo()
    const browserWindow = BrowserWindow.fromWebContents(event.sender)
    const options: OpenDialogOptions = {
      title: 'Choose Steam Base Cache Folder',
      buttonLabel: 'Use This Folder',
      defaultPath: currentStorage.path,
      properties: ['openDirectory', 'createDirectory']
    }
    const result = browserWindow
      ? await dialog.showOpenDialog(browserWindow, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) return null
    return steamCacheStorage.setPath(result.filePaths[0])
  })

  ipcMain.handle('reset-steam-cache-storage', () => {
    assertSteamCacheStorageCanChange()
    return steamCacheStorage.resetPath()
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle('delete-steam-cache', async (_, appId: number) => {
    return await SteamCache.deleteCache(appId)
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle(
    'update-steam-cache',
    async (
      _,
      id: number,
      appId: number,
      username?: string,
      password?: string,
      steamGuardCode?: string
    ) => {
      return await SteamDownloader.updateCache(id, appId, username, password, steamGuardCode)
    }
  )

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle('copy-steam-cache', async (_, id: number, appId: number) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    await SteamCache.copyFromCache(id, appId, serverDir)
    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle('send-steamcmd-input', async (_, data: string) => {
    if (SteamDownloader.activeProcess && SteamDownloader.activeProcess.stdin) {
      SteamDownloader.activeProcess.stdin.write(data + '\n')
    } else {
      SteamWorkshopDownloader.sendInput(data)
    }
    return true
  })
}
