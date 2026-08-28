import { WakeProxy } from '../adapters/WakeProxy';
import { FrpAdapter } from '../adapters/FrpAdapter';
import { RadminVpnAdapter } from '../adapters/RadminVpnAdapter';
import { BrowserWindow } from 'electron';
import { setupMinecraftEventCoordinator } from '../minecraft/MinecraftEventCoordinator';

import { registerServerIpc } from '../ipc/ServerIpc';
import { registerSteamCMDIpc } from '../ipc/SteamCMDIpc';
import { registerSystemIpc } from '../ipc/SystemIpc';
import { registerMinecraftIpc } from '../ipc/MinecraftIpc';
import { registerCacheIpc } from '../ipc/CacheIpc';
import { registerLogIpc } from '../ipc/LogIpc';
import { registerNetworkIpc } from '../ipc/NetworkIpc';
import { registerSevenDaysToDieIpc } from '../ipc/SevenDaysToDieIpc';
import { getServers } from '../db';

export function registerAllIpcs(): void {
  // Initialize Systems
  const activeServers: Record<number, any> = {};
  const activeProxies: Record<number, WakeProxy> = {};
  const tunnelProvider = new FrpAdapter();
  const radminVpnProvider = new RadminVpnAdapter((msg) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('console-log', msg);
    }
  });

  setupMinecraftEventCoordinator(activeServers);

  // Register IPCs
  registerLogIpc();
  registerServerIpc(activeServers, activeProxies);
  registerSteamCMDIpc();
  registerCacheIpc();
  registerNetworkIpc(tunnelProvider, radminVpnProvider);
  registerSystemIpc(activeServers, getServers);
  registerMinecraftIpc();
  registerSevenDaysToDieIpc();
}
