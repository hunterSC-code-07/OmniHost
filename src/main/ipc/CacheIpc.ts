import { ipcMain } from 'electron';
import { CacheManager } from '../CacheManager';

export function registerCacheIpc() {
  ipcMain.handle('get-cache-info', async () => {
    return await CacheManager.getCacheSize();
  });

  ipcMain.handle('clear-cache', () => {
    CacheManager.clearCache();
    return true;
  });
}
