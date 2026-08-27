import { minecraftEventBus } from './MinecraftEventBus';
export class MinecraftPlayerManager {
  private serverId: number;
  private serverDir: string;
  private onlinePlayers: string[] = [];

  constructor(serverId: number, serverDir: string) {
    this.serverId = serverId;
    this.serverDir = serverDir;
  }

  getOnlinePlayers(): string[] {
    return this.onlinePlayers;
  }

  clearOnlinePlayers() {
    this.onlinePlayers = [];
  }

  sendPlayerUpdate() {
    // This could optionally emit an event for online-players if needed, 
    // but the coordinator will handle player-joined/left.
  }

  async handlePlayerJoin(username: string) {
    if (!this.onlinePlayers.includes(username)) {
      this.onlinePlayers.push(username);
      minecraftEventBus.emit('player-joined', this.serverId, this.serverDir, username);
    }
  }

  async handlePlayerLeave(username: string) {
    this.onlinePlayers = this.onlinePlayers.filter(p => p !== username);
    minecraftEventBus.emit('player-left', this.serverId, this.serverDir, username);
  }

  async handleServerStop() {
    for (const pName of this.onlinePlayers) {
      minecraftEventBus.emit('player-left', this.serverId, this.serverDir, pName);
    }
    this.clearOnlinePlayers();
  }

}
