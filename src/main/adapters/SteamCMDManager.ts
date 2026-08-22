import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import axios from 'axios'
import AdmZip from 'adm-zip'

export class SteamCMDManager {
  static activeProcess: ChildProcess | null = null;

  static sendInput(data: string) {
    if (this.activeProcess && this.activeProcess.stdin) {
      this.activeProcess.stdin.write(data + '\n');
    }
  }

  static getSteamCMDDir() {
    return join(app.getPath('userData'), 'steamcmd');
  }

  static getExePath() {
    return join(this.getSteamCMDDir(), 'steamcmd.exe');
  }

  static getCacheDir(appId: number) {
    return join(app.getPath('userData'), 'steam_cache', appId.toString());
  }

  static async isCached(appId: number): Promise<boolean> {
    const cacheDir = this.getCacheDir(appId);
    if (!fs.existsSync(cacheDir)) return false;
    const files = fs.readdirSync(cacheDir);
    return files.length > 0;
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

  static async ensureInstalled(serverId: number): Promise<void> {
    const dir = this.getSteamCMDDir();
    const exePath = this.getExePath();

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(exePath)) {
      this.sendLog(serverId, 10, 'Downloading SteamCMD...');
      const zipPath = join(dir, 'steamcmd.zip');
      const url = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip';
      
      const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });
      fs.writeFileSync(zipPath, response.data);
      
      this.sendLog(serverId, 50, 'Extracting SteamCMD...');
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(dir, true);
      
      fs.unlinkSync(zipPath);
      this.sendLog(serverId, 100, 'SteamCMD setup complete!');
    }
  }

  static async updateCache(serverId: number, appId: number, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    await this.ensureInstalled(serverId);

    return new Promise((resolve, reject) => {
      this.sendLog(serverId, 0, `Starting SteamCMD download for App ${appId}...`);
      
      const exePath = this.getExePath();
      
      const loginArgs: string[] = [];
      if (username && password) {
        if (steamGuardCode) {
          loginArgs.push('+login', username, password, steamGuardCode);
        } else {
          loginArgs.push('+login', username, password);
        }
      } else {
        loginArgs.push('+login', 'anonymous');
      }

      const cacheDir = this.getCacheDir(appId);
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const args: string[] = [
        '+force_install_dir', cacheDir,
        ...loginArgs,
        '+app_update', appId.toString(), 'validate',
        '+quit'
      ];

      const proc = spawn(exePath, args, { cwd: this.getSteamCMDDir() });
      this.activeProcess = proc;

      let steamGuardRequested = false;

      proc.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
            console.log(`[SteamCMD App ${appId}]:`, output);
            const lowerOutput = output.toLowerCase();

            // Detect Steam Guard / 2FA prompts
            if (lowerOutput.includes('steam guard') || lowerOutput.includes('two-factor') || lowerOutput.includes('enter the current code')) {
              steamGuardRequested = true;
            }

            const progressMatch = output.match(/progress:\s*([0-9.]+)/i);
            if (progressMatch) {
                const percent = parseFloat(progressMatch[1]);
                this.sendLog(serverId, percent, `Downloading Game Files (${percent.toFixed(1)}%)...`);
            } else if (output.includes('Success! App')) {
                this.sendLog(serverId, 100, 'Download Complete!');
            }
        }
      });

      proc.stderr?.on('data', (data) => {
        console.error(`[SteamCMD App ${appId} Error]:`, data.toString().trim());
      });

      proc.on('close', (code) => {
        this.activeProcess = null;
        if (code === 0 || code === 7) { 
          resolve(true);
        } else if (code === 5 && steamGuardRequested) {
          reject(new Error('STEAM_GUARD_REQUIRED'));
        } else {
          reject(new Error(`SteamCMD exited with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  static async installApp(serverId: number, appId: number, installDir: string, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    await this.updateCache(serverId, appId, username, password, steamGuardCode);
    this.sendLog(serverId, 99, 'Copying from cache to server directory...');
    await fs.promises.cp(this.getCacheDir(appId), installDir, { recursive: true });
    this.sendLog(serverId, 100, 'Download and Setup Complete!');
    return true;
  }

  static async downloadWorkshopItem(serverId: number, appId: number, modId: string, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    await this.ensureInstalled(serverId);

    // Fetch total size from Steam API for accurate progress calculation
    let totalSize = 0;
    try {
      const params = new URLSearchParams();
      params.append('itemcount', '1');
      params.append('publishedfileids[0]', modId);
      const res = await axios.post('https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const fileDetails = res.data?.response?.publishedfiledetails?.[0];
      if (fileDetails && fileDetails.file_size) {
        totalSize = parseInt(fileDetails.file_size, 10);
      }
    } catch (e) {
      console.warn(`[SteamCMD Workshop ${modId}] Could not fetch file size for progress bar.`);
    }

    return new Promise((resolve, reject) => {
      this.sendLog(serverId, 0, `Starting Workshop download for Mod ${modId}...`);
      
      const exePath = this.getExePath();
      
      const loginArgs: string[] = [];
      if (username && password) {
        if (steamGuardCode) {
          loginArgs.push('+login', username, password, steamGuardCode);
        } else {
          loginArgs.push('+login', username, password);
        }
      } else {
        loginArgs.push('+login', 'anonymous');
      }

      // Workshop items are downloaded to steamapps/workshop/content/<appId>/<modId> inside the SteamCMD directory
      // We don't force install dir here as SteamCMD handles workshop folders itself
      const args: string[] = [
        ...loginArgs,
        '+workshop_download_item', appId.toString(), modId, 'validate',
        '+quit'
      ];

      const proc = spawn(exePath, args, { cwd: this.getSteamCMDDir() });
      this.activeProcess = proc;

      let steamGuardRequested = false;
      let downloadFailed = false;
      let downloadErrorMsg = '';

      const targetDir = join(this.getSteamCMDDir(), 'steamapps', 'workshop', 'downloads', appId.toString(), modId);
      
      const progressInterval = setInterval(async () => {
        if (totalSize > 0 && fs.existsSync(targetDir)) {
          let currentSize = 0;
          const checkSize = async (dir: string) => {
            if (!fs.existsSync(dir)) return;
            try {
              const files = await fs.promises.readdir(dir, { withFileTypes: true });
              for (const file of files) {
                const fullPath = join(dir, file.name);
                if (file.isDirectory()) {
                  await checkSize(fullPath);
                } else {
                  const stats = await fs.promises.stat(fullPath);
                  currentSize += stats.size;
                }
              }
            } catch (e) { /* ignore read errors during active download */ }
          };
          await checkSize(targetDir);
          const percent = Math.min((currentSize / totalSize) * 100, 99.9);
          this.sendLog(serverId, percent, `Downloading Mod Files (${percent.toFixed(1)}%)...`);
        } else if (totalSize === 0) {
          // Indeterminate UI fallback handled by DayzModsTab CSS animation when percent === 0
          this.sendLog(serverId, 0, `Downloading Mod Files (Indeterminate)...`);
        }
      }, 1000);

      proc.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
            console.log(`[SteamCMD Workshop ${modId}]:`, output);
            const lowerOutput = output.toLowerCase();

            if (lowerOutput.includes('failed (failure)') || lowerOutput.includes('access denied') || lowerOutput.includes('timeout')) {
              downloadFailed = true;
              downloadErrorMsg = output;
            }

            // Detect Steam Guard / 2FA prompts
            if (lowerOutput.includes('steam guard') || lowerOutput.includes('two-factor') || lowerOutput.includes('enter the current code')) {
              steamGuardRequested = true;
            }

            const progressMatch = output.match(/progress:\s*([0-9.]+)/i);
            if (progressMatch) {
                const percent = parseFloat(progressMatch[1]);
                this.sendLog(serverId, percent, `Downloading Mod Files (${percent.toFixed(1)}%)...`);
            } else if (output.includes('Success. Downloaded item')) {
                this.sendLog(serverId, 100, 'Download Complete!');
            }
        }
      });

      proc.stderr?.on('data', (data) => {
        console.error(`[SteamCMD Workshop ${modId} Error]:`, data.toString().trim());
      });

      proc.on('close', (code) => {
        clearInterval(progressInterval);
        this.activeProcess = null;
        if (downloadFailed) {
          reject(new Error(`LOGIN_REQUIRED: ${downloadErrorMsg}`));
        } else if (code === 0 || code === 7) { 
          resolve(true);
        } else if (code === 5 && steamGuardRequested) {
          reject(new Error('STEAM_GUARD_REQUIRED'));
        } else {
          reject(new Error(`SteamCMD exited with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        clearInterval(progressInterval);
        reject(err);
      });
    });
  }
}
