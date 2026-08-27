import { Rcon } from 'rcon-client'
import { PalworldConfigManager } from './PalworldConfigManager'

export class PalworldRcon {
  private rcon: Rcon | null = null
  private serverId: number
  private isConnecting = false

  constructor(serverId: number) {
    this.serverId = serverId
  }

  async connect(): Promise<void> {
    if (this.rcon || this.isConnecting) return
    this.isConnecting = true

    try {
      const config = await PalworldConfigManager.getConfig(this.serverId)

      // Check if RCON is enabled in settings
      const rconEnabled = config['RCONEnabled'] === 'True'
      if (!rconEnabled) {
        throw new Error('RCON is not enabled in PalWorldSettings.ini. Set RCONEnabled=True')
      }

      const port = parseInt(config['RCONPort'] || '25575', 10)
      const password = config['AdminPassword']

      if (!password) {
        throw new Error('AdminPassword is required for RCON')
      }

      this.rcon = await Rcon.connect({
        host: '127.0.0.1',
        port,
        password
      })

      this.rcon.on('error', (err) => {
        console.error(`[RCON Error] ${err.message}`)
        this.disconnect()
      })

      this.rcon.on('end', () => {
        this.disconnect()
      })
    } catch (e: unknown) {
      console.error(`Failed to connect to RCON: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      this.isConnecting = false
    }
  }

  disconnect(): void {
    if (this.rcon) {
      try {
        this.rcon.end()
      } catch {
        // ignore errors on disconnect
      }
      this.rcon = null
    }
  }

  async sendCommand(cmd: string): Promise<string> {
    if (!this.rcon) {
      await this.connect()
    }

    if (!this.rcon) {
      return 'Error: Could not connect to RCON. Make sure RCONEnabled=True and AdminPassword is set.'
    }

    try {
      const response = await this.rcon.send(cmd)
      return response
    } catch (e: unknown) {
      return `Error sending command: ${e instanceof Error ? e.message : String(e)}`
    }
  }
}
