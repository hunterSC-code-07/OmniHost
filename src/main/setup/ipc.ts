import { WakeProxy } from '../adapters/WakeProxy'
import { RadminVpnAdapter } from '../adapters/RadminVpnAdapter'
import { discordBot } from '../discord/DiscordBot'
import { app, BrowserWindow } from 'electron'
import { setupMinecraftEventCoordinator } from '../minecraft/MinecraftEventCoordinator'

import { registerServerIpc } from '../ipc/ServerIpc'
import { registerSteamCMDIpc } from '../ipc/SteamCMDIpc'
import { registerSystemIpc } from '../ipc/SystemIpc'
import { registerMinecraftIpc } from '../ipc/MinecraftIpc'
import { registerCacheIpc } from '../ipc/CacheIpc'
import { registerLogIpc } from '../ipc/LogIpc'
import { registerNetworkIpc } from '../ipc/NetworkIpc'
import { registerPalworldIpc } from '../ipc/PalworldIpc'
import { registerSevenDaysToDieIpc } from '../ipc/SevenDaysToDieIpc'
import { getServers } from '../storage/db'
import { IServerAdapter } from '../adapters/AdapterRegistry'

export function registerAllIpcs(): void {
  // Initialize Systems
  const activeServers: Record<number, IServerAdapter> = {}
  const activeProxies: Record<number, WakeProxy> = {}
  const radminVpnProvider = new RadminVpnAdapter((msg) => {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      windows[0].webContents.send('console-log', msg)
    }
  })

  setupMinecraftEventCoordinator(activeServers)

  // Register IPCs
  registerLogIpc()
  const lifecycleMethods = registerServerIpc(activeServers, activeProxies)
  registerSteamCMDIpc()
  registerCacheIpc()
  registerNetworkIpc(radminVpnProvider)
  registerSystemIpc(activeServers, getServers)
  registerMinecraftIpc()
  registerPalworldIpc()
  registerSevenDaysToDieIpc()

  discordBot.init(lifecycleMethods)

  let shutdownStarted = false
  app.on('before-quit', (event) => {
    if (shutdownStarted) return
    event.preventDefault()
    shutdownStarted = true
    void lifecycleMethods.shutdownServers().finally(() => app.quit())
  })
}
