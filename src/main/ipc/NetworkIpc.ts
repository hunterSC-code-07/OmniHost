import { ipcMain } from 'electron'
import { FrpAdapter } from '../adapters/FrpAdapter'
import { IVpnAdapter } from '../adapters/IVpnAdapter'

export function registerNetworkIpc(
  tunnelProvider: FrpAdapter,
  vpnProvider: IVpnAdapter
) {
  // --- Tunnels ---
  ipcMain.handle('start-tunnel', async (_, payload: { ip: string, game: string }) => {
    await tunnelProvider.start(payload.ip, payload.game)
    return true
  })

  ipcMain.handle('stop-tunnel', async () => {
    tunnelProvider.stop()
  })

  ipcMain.handle('get-tunnel-status', () => {
    return tunnelProvider.process ? 'Online' : 'Offline'
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
