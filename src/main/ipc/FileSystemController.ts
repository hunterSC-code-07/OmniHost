import { app, ipcMain } from 'electron';
import { join } from 'path';
import fsPromises from 'fs/promises';

async function exists(path: string) {
  try {
    await fsPromises.access(path);
    return true;
  } catch {
    return false;
  }
}

const getServerPath = (serverId: number, relativePath: string) => {
  const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
  const safePath = join(serverDir, relativePath);
  if (!safePath.startsWith(serverDir)) {
    throw new Error('Access denied');
  }
  return safePath;
};

export class FileSystemController {
  static register() {
    ipcMain.handle('fs-list-dir', async (_, serverId, dirPath) => {
      try {
        const fullPath = getServerPath(serverId, dirPath || '');
        if (!(await exists(fullPath))) return [];

        const entries = await fsPromises.readdir(fullPath, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (entry) => {
          const entryPath = join(fullPath, entry.name);
          const stats = await fsPromises.stat(entryPath);
          return {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            mtime: stats.mtime.toISOString(),
          };
        }));

        return files.sort((a, b) => {
          if (a.isDirectory === b.isDirectory) {
            return a.name.localeCompare(b.name);
          }
          return a.isDirectory ? -1 : 1;
        });
      } catch (e) {
        console.error('Failed to list directory', e);
        return [];
      }
    });

    ipcMain.handle('fs-read-file', async (_, serverId, filePath) => {
      try {
        const fullPath = getServerPath(serverId, filePath);
        return await fsPromises.readFile(fullPath, 'utf-8');
      } catch (e) {
        console.error('Failed to read file', e);
        throw e;
      }
    });

    ipcMain.handle('fs-write-file', async (_, serverId, filePath, content) => {
      try {
        const fullPath = getServerPath(serverId, filePath);
        await fsPromises.writeFile(fullPath, content, 'utf-8');
        return true;
      } catch (e) {
        console.error('Failed to write file', e);
        throw e;
      }
    });

    ipcMain.handle('fs-delete', async (_, serverId, itemPath) => {
      try {
        const fullPath = getServerPath(serverId, itemPath);
        await fsPromises.rm(fullPath, { recursive: true, force: true });
        return true;
      } catch (e) {
        console.error('Failed to delete item', e);
        throw e;
      }
    });

    ipcMain.handle('fs-create-folder', async (_, serverId, folderPath) => {
      try {
        const fullPath = getServerPath(serverId, folderPath);
        await fsPromises.mkdir(fullPath, { recursive: true });
        return true;
      } catch (e) {
        console.error('Failed to create folder', e);
        throw e;
      }
    });
  }
}
