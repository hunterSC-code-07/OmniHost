import { app, ipcMain } from 'electron';
import { join } from 'path';
import fsPromises from 'fs/promises';
import { SatisfactoryAdapter } from '../adapters/SatisfactoryAdapter';

async function exists(path: string) {
  try {
    await fsPromises.access(path);
    return true;
  } catch {
    return false;
  }
}

export class SatisfactoryController {
  static register(activeServers: Record<number, any>) {
    ipcMain.handle('get-satisfactory-token', async (_, id) => {
      try {
        const serverDir = join(app.getPath('userData'), 'servers', id.toString());
        const cfgPath = join(serverDir, 'omnihost-config.json');
        if (await exists(cfgPath)) {
          const data = JSON.parse(await fsPromises.readFile(cfgPath, 'utf-8'));
          return data.satisfactoryApiToken || null;
        }
        return null;
      } catch (e) {
        console.error('Failed to get satisfactory token', e);
        return null;
      }
    });

    ipcMain.handle('save-satisfactory-token', async (_, id, token) => {
      try {
        const serverDir = join(app.getPath('userData'), 'servers', id.toString());
        const cfgPath = join(serverDir, 'omnihost-config.json');
        let data: any = {};
        if (await exists(cfgPath)) {
          data = JSON.parse(await fsPromises.readFile(cfgPath, 'utf-8'));
        } else {
          await fsPromises.mkdir(serverDir, { recursive: true });
        }
        data.satisfactoryApiToken = token;
        await fsPromises.writeFile(cfgPath, JSON.stringify(data, null, 2));
        
        // Update the active process manager if it's running
        if (activeServers[id] instanceof SatisfactoryAdapter) {
          (activeServers[id] as any).processManager.apiToken = token;
        }
        return true;
      } catch (e) {
        console.error('Failed to save satisfactory token', e);
        return false;
      }
    });
  }
}
