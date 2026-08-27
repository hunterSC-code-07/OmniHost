import net from 'net'
import { MinecraftProcessManager } from '../minecraft/MinecraftProcessManager'

export class WakeProxy {
  private server: net.Server | null = null
  private adapter: MinecraftProcessManager
  private port: number

  constructor(adapter: MinecraftProcessManager, port: number = 25565) {
    this.adapter = adapter
    this.port = port
  }

  startListening() {
    if (this.server) return // Already listening

    this.server = net.createServer((socket) => {
      this.adapter.sendLog(
        `[WakeProxy] Connection detected from ${socket.remoteAddress}! Waking up server...`
      )
      socket.destroy() // Destroy immediately to free port

      if (this.server) {
        this.server.close(() => {
          this.adapter.sendLog(`[WakeProxy] Port fully released. Starting Minecraft...`)
          // Use a small delay just to let OS clear TCP TIME_WAIT
          setTimeout(() => {
            this.adapter.start()
          }, 1000)
        })
        this.server = null
      }
    })

    this.server.on('error', (err: any) => {
      this.adapter.sendLog(`[WakeProxy] Error: ${err.message}`)
      this.stopListening()
    })

    try {
      this.server.listen(this.port, () => {
        this.adapter.sendLog(
          `[WakeProxy] Sleeping. Listening on port ${this.port} for wake-up connections...`
        )
      })
    } catch (e) {
      this.adapter.sendLog(
        `[WakeProxy] Failed to bind to port ${this.port}. Is another server running?`
      )
    }
  }

  stopListening() {
    if (this.server) {
      try {
        this.server.close()
      } catch (e) {}
      this.server = null
      this.adapter.sendLog(`[WakeProxy] Stopped listening on port ${this.port}.`)
    }
  }
}
