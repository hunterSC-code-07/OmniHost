import { BrowserWindow } from 'electron';
import { minecraftEventBus } from './MinecraftEventBus';
import { MinecraftStatsService } from './MinecraftStatsService';

export function setupMinecraftEventCoordinator(activeServers: Record<number, any>) {
  minecraftEventBus.on('player-joined', async (serverId, serverDir, username) => {
    await MinecraftStatsService.updatePlayerStats(serverDir, username, true);
    const activeServer = activeServers[serverId];
    const players = activeServer && activeServer.playerManager ? activeServer.playerManager.getOnlinePlayers() : [username];
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('online-players', { id: serverId, players });
    });
  });

  minecraftEventBus.on('player-left', async (serverId, serverDir, username) => {
    await MinecraftStatsService.updatePlayerStats(serverDir, username, false);
    const activeServer = activeServers[serverId];
    const players = activeServer && activeServer.playerManager ? activeServer.playerManager.getOnlinePlayers() : [];
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('online-players', { id: serverId, players });
    });
  });

  minecraftEventBus.on('console-log', (serverId, msg) => {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('console-log', { id: serverId, msg });
    });
  });

  minecraftEventBus.on('server-stats', (serverId, cpu, ram) => {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('server-stats', { id: serverId, cpu, ram });
    });
  });
}
