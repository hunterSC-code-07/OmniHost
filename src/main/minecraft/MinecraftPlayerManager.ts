import { BrowserWindow } from 'electron'
import { MinecraftStatsService } from './MinecraftStatsService'

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
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('online-players', { id: this.serverId, players: this.onlinePlayers });
    });
  }

  async handlePlayerJoin(username: string) {
    if (!this.onlinePlayers.includes(username)) {
      this.onlinePlayers.push(username);
      await MinecraftStatsService.updatePlayerStats(this.serverDir, username, true);
      this.sendPlayerUpdate();
    }
  }

  async handlePlayerLeave(username: string) {
    this.onlinePlayers = this.onlinePlayers.filter(p => p !== username);
    await MinecraftStatsService.updatePlayerStats(this.serverDir, username, false);
    this.sendPlayerUpdate();
  }

  async handleServerStop() {
    for (const pName of this.onlinePlayers) {
      await MinecraftStatsService.updatePlayerStats(this.serverDir, pName, false);
    }
    this.clearOnlinePlayers();
    this.sendPlayerUpdate();
  }

}
