import { app, ipcMain } from 'electron'
import { join } from 'path'
import { SteamDownloader } from '../steam/SteamDownloader'
import { SteamCache } from '../steam/SteamCache'
import { SteamWorkshopDownloader } from '../steam/SteamWorkshopDownloader'

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
      SteamDownloader.activeProcess.stdin.write(data + '\n');
    } else {
      SteamWorkshopDownloader.sendInput(data);
    }
    return true
  })
}
