import fs from 'fs';
import { join } from 'path';
import { app, BrowserWindow } from 'electron';

export class SteamCache {
  static getCacheDir(appId: number) {
    return join(app.getPath('userData'), 'steam_cache', appId.toString());
  }

  static async isCached(appId: number): Promise<boolean> {
    const cacheDir = this.getCacheDir(appId);
    if (!fs.existsSync(cacheDir)) return false;
    
    if (appId === 223350 && fs.existsSync(join(cacheDir, 'DayZServer_x64.exe'))) {
      return true;
    }
    
    if (appId === 1690800 && fs.existsSync(join(cacheDir, 'FactoryServer.exe'))) {
      return true;
    }
    
    return false;
  }

  static async deleteCache(appId: number): Promise<boolean> {
    const cacheDir = this.getCacheDir(appId);
    if (fs.existsSync(cacheDir)) {
      await fs.promises.rm(cacheDir, { recursive: true, force: true });
    }
    return true;
  }

  static async copyFromCache(serverId: number, appId: number, installDir: string): Promise<boolean> {
    const cacheDir = this.getCacheDir(appId);
    this.sendLog(serverId, 50, 'Copying server files from cache...');
    await fs.promises.cp(cacheDir, installDir, { recursive: true });
    this.sendLog(serverId, 100, 'Server files copied!');
    return true;
  }

  static sendLog(serverId: number, progress: number, msg: string) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send(`download-progress-${serverId}`, progress, msg);
    }
  }
}
