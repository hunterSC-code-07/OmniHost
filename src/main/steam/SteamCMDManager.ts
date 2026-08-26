import { ChildProcess } from 'child_process';
import { SteamCache } from './SteamCache';
import { SteamCMDSetup } from './SteamCMDSetup';
import { SteamWorkshopDownloader } from './SteamWorkshopDownloader';
import { SteamDownloader } from './SteamDownloader';

export class SteamCMDManager {
  static get activeProcess(): ChildProcess | null {
    return SteamDownloader.activeProcess;
  }

  static sendInput(data: string) {
    if (SteamDownloader.activeProcess && SteamDownloader.activeProcess.stdin) {
      SteamDownloader.activeProcess.stdin.write(data + '\n');
    } else {
      SteamWorkshopDownloader.sendInput(data);
    }
  }

  static getSteamCMDDir() {
    return SteamCMDSetup.getSteamCMDDir();
  }

  static getExePath() {
    return SteamCMDSetup.getExePath();
  }

  static getCacheDir(appId: number) {
    return SteamCache.getCacheDir(appId);
  }

  static async isCached(appId: number): Promise<boolean> {
    return SteamCache.isCached(appId);
  }

  static async deleteCache(appId: number): Promise<boolean> {
    return SteamCache.deleteCache(appId);
  }

  static async copyFromCache(serverId: number, appId: number, installDir: string): Promise<boolean> {
    return SteamCache.copyFromCache(serverId, appId, installDir);
  }

  static sendLog(serverId: number, progress: number, msg: string) {
    SteamCMDSetup.sendLog(serverId, progress, msg);
  }

  static async ensureInstalled(serverId: number): Promise<void> {
    return SteamCMDSetup.ensureInstalled(serverId);
  }

  static async updateCache(serverId: number, appId: number, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    return SteamDownloader.updateCache(serverId, appId, username, password, steamGuardCode);
  }

  static async installApp(serverId: number, appId: number, installDir: string, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    return SteamDownloader.installApp(serverId, appId, installDir, username, password, steamGuardCode);
  }

  static async downloadWorkshopItem(serverId: number, appId: number, modId: string, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    return SteamWorkshopDownloader.downloadWorkshopItem(serverId, appId, modId, username, password, steamGuardCode);
  }

  static async downloadWorkshopItems(serverId: number, appId: number, modIds: string[], username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    return SteamWorkshopDownloader.downloadWorkshopItems(serverId, appId, modIds, username, password, steamGuardCode);
  }
}
