import os from 'os'
import { RadminVpnAdapter } from '../adapters/RadminVpnAdapter'
import { resolveServerPort } from '../network/serverPorts'
import { getServerDirectory } from '../storage/db'
import { getCurrentTunnelInfo } from '../ipc/NetworkIpc'

export interface DiscordConnectionInfo {
  serverId: number
  port: number
  lanAddresses: string[]
  radminAddress: string | null
  publicAddress: string | null
  tunnelAddress: string | null
}

export class DiscordConnectionInfoService {
  private readonly radmin = new RadminVpnAdapter()
  private publicIp: string | null = null
  private publicIpFetchedAt = 0

  async getInfo(server: {
    id: number
    game?: string
    port?: number
  }): Promise<DiscordConnectionInfo> {
    const interfaces = os.networkInterfaces()
    const lanAddresses = Object.values(interfaces)
      .flatMap((entries) => entries ?? [])
      .filter((entry) => entry.family === 'IPv4' && !entry.internal)
      .map((entry) => entry.address)
      .filter((address, index, addresses) => addresses.indexOf(address) === index)

    return {
      serverId: server.id,
      port:
        server.port ?? resolveServerPort(server.game ?? 'Minecraft', getServerDirectory(server.id)),
      lanAddresses,
      radminAddress: await this.radmin.getIp(),
      publicAddress: await this.getPublicIp(),
      tunnelAddress: (() => {
        const tunnel = getCurrentTunnelInfo()
        return tunnel ? `${tunnel.host}:${tunnel.port}` : null
      })()
    }
  }

  private async getPublicIp(): Promise<string | null> {
    if (Date.now() - this.publicIpFetchedAt < 5 * 60_000) return this.publicIp
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(5000)
      })
      if (!response.ok) return null
      const body = (await response.json()) as { ip?: unknown }
      this.publicIp = typeof body.ip === 'string' ? body.ip : null
    } catch {
      this.publicIp = null
    }
    this.publicIpFetchedAt = Date.now()
    return this.publicIp
  }
}

export const discordConnectionInfo = new DiscordConnectionInfoService()
