import { ChildProcess } from 'child_process';
import { SteamCache } from './SteamCache';
import { SteamCMDSetup } from './SteamCMDSetup';
import { SteamWorkshopDownloader } from './SteamWorkshopDownloader';
import { SteamDownloader } from './SteamDownloader';

/**
 * @deprecated Use SteamDownloader, SteamWorkshopDownloader, SteamCache, or SteamCMDSetup directly.
 */
export class SteamCMDManager {
  /** @deprecated */
  static get activeProcess(): ChildProcess | null {
    return SteamDownloader.activeProcess;
  }

  /** @deprecated */
  static sendInput(data: string) {
    if (SteamDownloader.activeProcess && SteamDownloader.activeProcess.stdin) {
      SteamDownloader.activeProcess.stdin.write(data + '\n');
    } else {
      SteamWorkshopDownloader.sendInput(data);
    }
  }

  /** @deprecated */
  static getSteamCMDDir() {
    return SteamCMDSetup.getSteamCMDDir();
  }

  /** @deprecated */
  static getExePath() {
    return SteamCMDSetup.getExePath();
  }

  /** @deprecated */
  static getCacheDir(appId: number) {
    return SteamCache.getCacheDir(appId);
  }

  /** @deprecated */
  static async isCached(appId: number): Promise<boolean> {
    return SteamCache.isCached(appId);
  }

  /** @deprecated */
  static async deleteCache(appId: number): Promise<boolean> {
    return SteamCache.deleteCache(appId);
  }

  /** @deprecated */
  static async copyFromCache(serverId: number, appId: number, installDir: string): Promise<boolean> {
    return SteamCache.copyFromCache(serverId, appId, installDir);
  }

  /** @deprecated */
  static sendLog(serverId: number, progress: number, msg: string) {
    SteamCMDSetup.sendLog(serverId, progress, msg);
  }

  /** @deprecated */
  static async ensureInstalled(serverId: number): Promise<void> {
    return SteamCMDSetup.ensureInstalled(serverId);
  }

  /** @deprecated */
  static async updateCache(serverId: number, appId: number, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    return SteamDownloader.updateCache(serverId, appId, username, password, steamGuardCode);
  }

  /** @deprecated */
  static async installApp(serverId: number, appId: number, installDir: string, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    return SteamDownloader.installApp(serverId, appId, installDir, username, password, steamGuardCode);
  }

  /** @deprecated */
  static async downloadWorkshopItem(serverId: number, appId: number, modId: string, username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    return SteamWorkshopDownloader.downloadWorkshopItem(serverId, appId, modId, username, password, steamGuardCode);
  }

  /** @deprecated */
  static async downloadWorkshopItems(serverId: number, appId: number, modIds: string[], username?: string, password?: string, steamGuardCode?: string): Promise<boolean> {
    return SteamWorkshopDownloader.downloadWorkshopItems(serverId, appId, modIds, username, password, steamGuardCode);
  }
}
