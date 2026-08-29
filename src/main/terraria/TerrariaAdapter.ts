import { TerrariaProcessManager } from './TerrariaProcessManager'
import { ChildProcess } from 'child_process'

export class TerrariaAdapter {
  serverId: number
  private processManager: TerrariaProcessManager

  constructor(serverId: number) {
    this.serverId = serverId
    this.processManager = new TerrariaProcessManager(serverId)
  }

  async start(): Promise<void> {
    await this.processManager.start()
  }

  stop(): void {
    this.processManager.stop()
  }

  sendCommand(cmd: string): void {
    this.processManager.sendCommand(cmd)
  }

  get process(): ChildProcess | null {
    return this.processManager.process
  }

  get logHistory(): string[] {
    return this.processManager.logHistory
  }

  get onlinePlayers(): string[] {
    return this.processManager.onlinePlayers
  }

  get omnihostMeta(): Record<string, unknown> {
    return this.processManager.omnihostMeta
  }

  set omnihostMeta(meta: Record<string, unknown>) {
    this.processManager.omnihostMeta = meta
  }
}
