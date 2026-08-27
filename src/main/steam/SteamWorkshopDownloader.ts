import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import fs from 'fs';
import axios from 'axios';
import { SteamCMDSetup } from './SteamCMDSetup';
import { SteamAuth } from './SteamAuth';

export class SteamWorkshopDownloader {
  static activeProcess: ChildProcess | null = null;

  static sendInput(data: string) {
    if (this.activeProcess && this.activeProcess.stdin) {
      this.activeProcess.stdin.write(data + '\n');
    }
  }

  static async downloadWorkshopItem(serverId: number, appId: number, modId: string, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    await SteamCMDSetup.ensureInstalled(serverId);

    // Fetch total size from Steam API for accurate progress calculation
    let totalSize = 0;
    try {
      let paramsStr = `itemcount=1&publishedfileids[0]=${modId}`;
      const res = await axios.post('https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/', paramsStr, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const fileDetails = res.data?.response?.publishedfiledetails?.[0];
      if (fileDetails && fileDetails.file_size) {
        totalSize = parseInt(fileDetails.file_size, 10);
      }
    } catch (e) {
      console.warn(`[SteamCMD Workshop ${modId}] Could not fetch file size for progress bar.`);
    }

    let retries = 0;
    const maxRetries = 10;
    let tryCached = !!(username && password && !steamGuardCode);

    while (retries < maxRetries) {
      if (this.activeProcess) {
        try {
          this.activeProcess.kill();
        } catch(e) {}
        this.activeProcess = null;
      }
      try {
        const result = await new Promise((resolve, reject) => {
          SteamCMDSetup.sendLog(serverId, 0, `Starting Workshop download for Mod ${modId}...`);

          const exePath = SteamCMDSetup.getExePath();
          const loginArgs = SteamAuth.getLoginArgs(username, tryCached ? undefined : password, steamGuardCode);

          const args: string[] = [
            ...loginArgs,
            '+workshop_download_item', appId.toString(), modId,
            '+quit'
          ];

          const proc = spawn(exePath, args, { cwd: SteamCMDSetup.getSteamCMDDir() });
          proc.stdin?.end(); // Prevent hanging on interactive password prompts
          this.activeProcess = proc;

          let steamGuardRequested = false;
          let invalidCredentials = false;
          let downloadFailed = false;
          let downloadErrorMsg = '';
          let fullOutput = '';

          const targetDir = join(SteamCMDSetup.getSteamCMDDir(), 'steamapps', 'workshop', 'downloads', appId.toString(), modId);

          const progressInterval = setInterval(async () => {
            if (totalSize > 0 && fs.existsSync(targetDir)) {
              let currentSize = 0;
              const checkSize = async (dir: string): Promise<number> => {
                if (!fs.existsSync(dir)) return 0;
                let size = 0;
                try {
                  const files = await fs.promises.readdir(dir, { withFileTypes: true });
                  const sizes = await Promise.all(files.map(async (file) => {
                    const fullPath = join(dir, file.name);
                    if (file.isDirectory()) {
                      return await checkSize(fullPath);
                    } else {
                      const stats = await fs.promises.stat(fullPath);
                      return stats.size;
                    }
                  }));
                  size = sizes.reduce((a, b) => a + b, 0);
                } catch (e) { /* ignore read errors during active download */ }
                return size;
              };
              currentSize = await checkSize(targetDir);
              const percent = Math.min((currentSize / totalSize) * 100, 99.9);
              SteamCMDSetup.sendLog(serverId, percent, `[MOD:${modId}] Downloading Mod Files (${percent.toFixed(1)}%)...`);
            } else if (totalSize === 0) {
              // Indeterminate UI fallback handled by DayzModsTab CSS animation when percent === 0
              SteamCMDSetup.sendLog(serverId, 0, `[MOD:${modId}] Downloading Mod Files (Indeterminate)...`);
            }
          }, 1000);

          proc.stdout?.on('data', (data) => {
            const output = data.toString();
            fullOutput += output;
            if (output.trim()) {
              console.log(`[SteamCMD Workshop ${modId}]:`, output.trim());
              const lowerOutput = output.toLowerCase();

              if (lowerOutput.includes('failed (failure)') || lowerOutput.includes('access denied') || lowerOutput.includes('timeout') || lowerOutput.includes('no connection')) {
                downloadFailed = true;
                downloadErrorMsg = fullOutput.substring(Math.max(0, fullOutput.length - 1000));
              }

              if (lowerOutput.includes('not enough disk space') || lowerOutput.includes('disk write failure') || lowerOutput.includes('enospc')) {
                downloadFailed = true;
                downloadErrorMsg = 'ENOSPC';
              }

              if (SteamAuth.isInvalidPassword(output) || SteamAuth.isAccountLogonDenied(output)) {
                invalidCredentials = true;
              }

              if (tryCached && invalidCredentials) {
                resolve('RETRY_FULL_LOGIN');
                return;
              }

              // Detect Steam Guard / 2FA prompts
              if (SteamAuth.isSteamGuardPrompt(output)) {
                steamGuardRequested = true;
              }

              if (SteamAuth.isMobileAuthRequested(output)) {
                SteamCMDSetup.sendLog(serverId, 50, `[MOD:${modId}] Approve the login on your Steam Mobile App...`);
              }

              const progressMatch = output.match(/progress:\s*([0-9.]+)/i);
              if (progressMatch) {
                const percent = parseFloat(progressMatch[1]);
                SteamCMDSetup.sendLog(serverId, percent, `[MOD:${modId}] Downloading Mod Files (${percent.toFixed(1)}%)...`);
              } else if (output.includes('Success. Downloaded item')) {
                SteamCMDSetup.sendLog(serverId, 100, `[MOD:${modId}] Download Complete!`);
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
              const lowerMsg = downloadErrorMsg.toLowerCase();
              if (lowerMsg === 'enospc') {
                reject(new Error('ENOSPC'));
              } else if (lowerMsg.includes('timeout') || lowerMsg.includes('no connection') || lowerMsg.includes('failed (failure)')) {
                reject(new Error('TIMEOUT'));
              } else {
                reject(new Error(`LOGIN_REQUIRED: ${downloadErrorMsg}`));
              }
            } else if (invalidCredentials) {
              reject(new Error('INVALID_CREDENTIALS'));
            } else if (code === 0 || code === 7) { // 7 is also success in some SteamCMD contexts
              SteamCMDSetup.sendLog(serverId, 100, `[MOD:${modId}] Download Complete!`);
              resolve('SUCCESS');
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

        if (result === 'RETRY_FULL_LOGIN') {
          tryCached = false;
          console.log(`[SteamCMD Workshop] Cached login failed, falling back to full authentication...`);
          continue;
        }

        // Success!
        return true;

      } catch (e: any) {
        if (e.message === 'TIMEOUT') {
          retries++;
          SteamCMDSetup.sendLog(serverId, 0, `[MOD:${modId}] Download paused by Steam. Resuming (${retries}/${maxRetries})...`);
          console.log(`[SteamCMD] Download timed out. Retrying ${retries}/${maxRetries}...`);
        } else {
          throw e; // Bubble up real errors (like invalid password)
        }
      }
    }

    throw new Error(`Download failed after ${maxRetries} retries due to persistent Steam timeouts.`);
  }

  static async downloadWorkshopItems(serverId: number, appId: number, modIds: string[], username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    await SteamCMDSetup.ensureInstalled(serverId);

    for (let i = 0; i < modIds.length; i++) {
      const modId = modIds[i];
      const targetDir = join(SteamCMDSetup.getSteamCMDDir(), 'steamapps', 'workshop', 'content', appId.toString(), modId);
      
      if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
        SteamCMDSetup.sendLog(serverId, 100, `[MOD:${modId}] Mod already downloaded, skipping...`);
        console.log(`[SteamCMD Batch] Mod ${modId} already exists in ${targetDir}, skipping.`);
        continue;
      }

      SteamCMDSetup.sendLog(serverId, 0, `[MOD:${modId}] Downloading mod ${i + 1} of ${modIds.length}...`);
      try {
        await this.downloadWorkshopItem(serverId, appId, modId, username, password, steamGuardCode);
      } catch (e: any) {
        console.error(`[SteamCMD Batch] Failed to download mod ${modId}:`, e);
        throw e;
      }
    }

    SteamCMDSetup.sendLog(serverId, 100, 'Batch Download Complete!');
    return true;
  }
}
