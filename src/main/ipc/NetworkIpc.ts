import { ipcMain } from 'electron'
import { BaseFrpAdapter } from '../adapters/BaseFrpAdapter'
import { FrpAdapterMinecraft } from '../adapters/FrpAdapterMinecraft'
import { FrpAdapterDayz } from '../adapters/FrpAdapterDayz'
import { FrpAdapterSatisfactory } from '../adapters/FrpAdapterSatisfactory'
import { FrpAdapter7dtd } from '../adapters/FrpAdapter7dtd'
import { FrpAdapterTheForest } from '../adapters/FrpAdapterTheForest'
import { FrpAdapterPalworld } from '../adapters/FrpAdapterPalworld'
import { FrpAdapterTerraria } from '../adapters/FrpAdapterTerraria'
import { IVpnAdapter } from '../adapters/IVpnAdapter'

let tunnelProviders: Record<string, BaseFrpAdapter> | null = null;
let currentTunnelProvider: BaseFrpAdapter | null = null;

export function registerNetworkIpc(
  vpnProvider: IVpnAdapter
) {
  if (!tunnelProviders) {
    tunnelProviders = {
      'minecraft': new FrpAdapterMinecraft(),
      'dayz': new FrpAdapterDayz(),
      'satisfactory': new FrpAdapterSatisfactory(),
      '7dtd': new FrpAdapter7dtd(),
      'theforest': new FrpAdapterTheForest(),
      'palworld': new FrpAdapterPalworld(),
      'terraria': new FrpAdapterTerraria(),
    };
  }

  // --- Tunnels ---
  ipcMain.handle('start-tunnel', async (_, ip: string, game: string) => {
    if (currentTunnelProvider) {
      currentTunnelProvider.stop();
    }
    const provider = tunnelProviders![game];
    if (provider) {
      currentTunnelProvider = provider;
      await currentTunnelProvider.start(ip);
      return true;
    }
    return false;
  })

  ipcMain.handle('stop-tunnel', async () => {
    if (currentTunnelProvider) {
      currentTunnelProvider.stop();
      currentTunnelProvider = null;
    }
  })

  ipcMain.handle('get-tunnel-status', () => {
    return currentTunnelProvider?.process ? 'Online' : 'Offline'
  })

  // --- VPN ---
  ipcMain.handle('radmin-check', () => {
    return vpnProvider.isInstalled()
  })

  ipcMain.handle('radmin-install', () => {
    vpnProvider.install()
    return true
  })

  ipcMain.handle('radmin-open', async () => {
    return await vpnProvider.open()
  })

  ipcMain.handle('radmin-get-ip', async () => {
    return await vpnProvider.getIp()
  })
}
