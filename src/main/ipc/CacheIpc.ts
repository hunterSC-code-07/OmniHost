import { ipcMain, app } from 'electron';
import { join } from 'path';
import fs from 'fs';
import { CacheManager } from '../CacheManager';
import { SteamCache } from '../steam/SteamCache';

export function registerCacheIpc() {
  ipcMain.handle('get-cache-info', async () => {
    return await CacheManager.getCacheSize();
  });

  ipcMain.handle('get-detailed-cache-info', async () => {
    const minecraftSize = CacheManager.getFolderSize(CacheManager.getCacheDir());
    const dayzBaseSize = CacheManager.getFolderSize(SteamCache.getCacheDir(223350));
    const dayzWorkshopSize = CacheManager.getFolderSize(join(app.getPath('userData'), 'steamcmd', 'steamapps', 'workshop', 'content', '221100'));
    const satisfactoryBaseSize = CacheManager.getFolderSize(SteamCache.getCacheDir(1690800));

    return {
      minecraft: minecraftSize,
      dayzBase: dayzBaseSize,
      dayzWorkshop: dayzWorkshopSize,
      satisfactoryBase: satisfactoryBaseSize
    };
  });

  ipcMain.handle('clear-cache', () => {
    CacheManager.clearCache();
    return true;
  });

  ipcMain.handle('clear-specific-cache', async (_, cacheId: string) => {
    let targetDir = '';
    
    switch (cacheId) {
      case 'minecraft':
        targetDir = CacheManager.getCacheDir();
        break;
      case 'dayzBase':
        targetDir = SteamCache.getCacheDir(223350);
        break;
      case 'dayzWorkshop':
        targetDir = join(app.getPath('userData'), 'steamcmd', 'steamapps', 'workshop', 'content', '221100');
        break;
      case 'satisfactoryBase':
        targetDir = SteamCache.getCacheDir(1690800);
        break;
      default:
        throw new Error(`Unknown cache id: ${cacheId}`);
    }

    if (targetDir && fs.existsSync(targetDir)) {
      await fs.promises.rm(targetDir, { recursive: true, force: true });
    }
    return true;
  });
}
