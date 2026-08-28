import { ipcMain, app, session, BrowserWindow } from 'electron';
import fs from 'fs';
import { join } from 'path';
import AdmZip from 'adm-zip';

let activeDownloadServerId: number | null = null;

export function registerSevenDaysToDieModDownloader(): void {
  ipcMain.handle('set-active-download-server', (event, serverId: number | null) => {
    activeDownloadServerId = serverId;
    return true;
  });

  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Only intercept if we have an active 7DTD server selected for downloading
    if (activeDownloadServerId === null) return;
    
    // Check if it's a zip file
    if (!item.getFilename().endsWith('.zip')) return;

    const serverIdSnapshot = activeDownloadServerId;
    const serverDir = join(app.getPath('userData'), 'servers', serverIdSnapshot.toString());
    const modsDir = join(serverDir, 'Mods');
    
    if (!fs.existsSync(modsDir)) {
      fs.mkdirSync(modsDir, { recursive: true });
    }

    // Set a temp download path
    const tempDir = join(app.getPath('temp'), 'omnihost-7dtd-downloads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempPath = join(tempDir, item.getFilename());
    item.setSavePath(tempPath);

    // Notify UI of download start
    const window = BrowserWindow.getAllWindows()[0];
    if (window) {
      window.webContents.send('mod-download-started', {
        filename: item.getFilename(),
        serverId: serverIdSnapshot
      });
    }

    item.on('updated', (event, state) => {
      if (state === 'progressing') {
        if (window && !item.isPaused()) {
          window.webContents.send('mod-download-progress', {
            filename: item.getFilename(),
            received: item.getReceivedBytes(),
            total: item.getTotalBytes()
          });
        }
      }
    });

    item.once('done', async (event, state) => {
      if (state === 'completed') {
        try {
          if (window) {
            window.webContents.send('mod-download-extracting', { filename: item.getFilename() });
          }

          const zip = new AdmZip(tempPath);
          const zipEntries = zip.getEntries();
          
          // Determine if the zip contains ModInfo.xml at the root or inside a subfolder
          let rootFolder = '';
          const hasModInfoAtRoot = zipEntries.some(e => e.entryName.toLowerCase() === 'modinfo.xml');
          
          if (!hasModInfoAtRoot) {
            // Find the folder containing ModInfo.xml
            const modInfoEntry = zipEntries.find(e => e.entryName.toLowerCase().endsWith('/modinfo.xml') || e.entryName.toLowerCase().endsWith('\\modinfo.xml'));
            if (modInfoEntry) {
              rootFolder = modInfoEntry.entryName.substring(0, modInfoEntry.entryName.length - 'modinfo.xml'.length);
            }
          }

          if (rootFolder) {
            // Extract only the contents of that specific subfolder directly into a new folder in Mods
            // However adm-zip doesn't make this easy to strip paths. The easiest way is to extract everything to a temp folder, then move the inner folder to Mods.
            const extractTempDir = join(tempDir, 'extract_' + Date.now());
            zip.extractAllTo(extractTempDir, true);
            
            const sourceFolder = join(extractTempDir, rootFolder);
            const folderName = rootFolder.replace(/[/\\]$/, '').split(/[/\\]/).pop() || item.getFilename().replace('.zip', '');
            const destFolder = join(modsDir, folderName);
            
            if (fs.existsSync(destFolder)) {
              await fs.promises.rm(destFolder, { recursive: true, force: true });
            }
            await fs.promises.rename(sourceFolder, destFolder);
            await fs.promises.rm(extractTempDir, { recursive: true, force: true });
          } else {
            // It's at the root. We should create a folder for it based on the zip name.
            const folderName = item.getFilename().replace('.zip', '');
            const destFolder = join(modsDir, folderName);
            zip.extractAllTo(destFolder, true);
          }
          
          // Cleanup zip
          fs.unlinkSync(tempPath);

          if (window) {
            window.webContents.send('mod-download-complete', { filename: item.getFilename(), serverId: serverIdSnapshot });
          }
        } catch (error) {
          console.error('Failed to extract mod:', error);
          if (window) {
            window.webContents.send('mod-download-error', { filename: item.getFilename(), error: 'Extraction failed' });
          }
        }
      } else {
        if (window) {
          window.webContents.send('mod-download-error', { filename: item.getFilename(), error: `Download ${state}` });
        }
      }
    });
  });
}
