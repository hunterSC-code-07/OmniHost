import { app, dialog } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import { DayzMissionManager, DAYZ_MAP_REPOS } from './DayzMissionManager'
import { SteamWebAPI } from '../api/SteamWebAPI'
// Note: We're calling SteamCMDManager for some downloads in the original code. 
// Wait, the plan says: "Should we delete SteamCMDManager.ts completely after updating its callers to use SteamDownloader / SteamWorkshopDownloader directly, or keep it as a deprecated shell for now? keep it as a deprecated shell for now."
// In DayzModInstaller, I should update it to use `SteamWorkshopDownloader` or `SteamDownloader` directly instead of SteamCMDManager, but I can use SteamCMDManager if that's what was used before, since it was just deprecated. Actually, let's use the direct services since the goal is to decouple!
import { SteamWorkshopDownloader } from '../steam/SteamWorkshopDownloader'
import { SteamCMDSetup } from '../steam/SteamCMDSetup'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export class DayzModInstaller {
  static async selectWorkshopFolder() {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select DayZ Game Folder'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  }

  static async importLocalWorkshop(serverId: number, workshopPath: string) {
    try {
      let actualWorkshopPath = workshopPath;
      if (!actualWorkshopPath.endsWith('!Workshop') && !actualWorkshopPath.endsWith('!workshop')) {
        actualWorkshopPath = join(actualWorkshopPath, '!Workshop');
      }

      if (!(await exists(actualWorkshopPath))) {
        throw new Error(`Could not find !Workshop folder at ${actualWorkshopPath}. Make sure you selected the correct DayZ directory.`);
      }

      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const keysDir = join(serverDir, 'keys');
      
      if (!(await exists(keysDir))) {
        await fsPromises.mkdir(keysDir, { recursive: true });
      }

      const entries = await fsPromises.readdir(actualWorkshopPath, { withFileTypes: true });
      let importedCount = 0;

      for (const entry of entries) {
        if ((entry.isDirectory() || entry.isSymbolicLink()) && entry.name.startsWith('@')) {
          const modSource = join(actualWorkshopPath, entry.name);
          const modDest = join(serverDir, entry.name);
          
          // Remove if it exists
          if (await exists(modDest)) {
            // Since it could be a junction, rm handles it correctly (removes link, not target contents)
            await fsPromises.rm(modDest, { recursive: true, force: true });
          }

          // Create symlink (junction on Windows for directories)
          try {
            // Resolve the real path in case the !Workshop entry is itself a junction (which it is)
            const realSourcePath = await fsPromises.realpath(modSource);
            await fsPromises.symlink(realSourcePath, modDest, 'junction');
          } catch (symlinkError) {
             console.error(`Failed to symlink ${entry.name}, falling back to copy`, symlinkError);
             await fsPromises.cp(modSource, modDest, { recursive: true });
          }

          // Mark as disabled by default
          await fsPromises.writeFile(join(modDest, 'disabled.txt'), 'true', 'utf-8');
          
          // Try to copy keys
          const modKeysDir = join(modSource, 'keys');
          if (await exists(modKeysDir)) {
            const keyFiles = await fsPromises.readdir(modKeysDir);
            for (const key of keyFiles) {
              if (key.endsWith('.bikey')) {
                await fsPromises.copyFile(join(modKeysDir, key), join(keysDir, key));
              }
            }
          }
          
          importedCount++;
        }
      }
      return importedCount;
    } catch (e: any) {
      console.error('Failed to import local workshop', e);
      throw e;
    }
  }

  static async installMods(serverId: number, modsToInstall: any[], username?: string, password?: string, steamGuardCode?: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const appId = 221100;
      
      const modIds = modsToInstall.map((m: any) => m.modId);
      
      // 1. Download via SteamWorkshopDownloader
      await SteamWorkshopDownloader.downloadWorkshopItems(serverId, appId, modIds, username, password, steamGuardCode);

      // 2. Copy mod folders from SteamCMD cache to server dir
      const steamCmdDir = SteamCMDSetup.getSteamCMDDir();

      for (const m of modsToInstall) {
        const workshopModDir = join(steamCmdDir, 'steamapps', 'workshop', 'content', appId.toString(), m.modId);
        
        if (!(await exists(workshopModDir))) {
          console.warn(`Mod folder not found after download for ${m.modTitle} (${m.modId})`);
          continue;
        }

        // Safe folder name (e.g. @CF)
        const safeTitle = m.modTitle.replace(/[^a-zA-Z0-9]/g, '');
        const folderName = `@${safeTitle || m.modId}`;
        const targetModDir = join(serverDir, folderName);

        try {
          await fsPromises.lstat(targetModDir);
          // If lstat succeeds, it exists (even as a broken symlink)
          await fsPromises.rm(targetModDir, { recursive: true, force: true });
        } catch (e) {
          // Does not exist, safe to proceed
        }

        SteamCMDSetup.sendLog(serverId, 100, `Copying ${folderName} to server...`);
        await fsPromises.cp(workshopModDir, targetModDir, { recursive: true });

        // Save mod ID and title for reference
        await fsPromises.writeFile(join(targetModDir, 'modid.txt'), `${m.modId}:${m.modTitle}`);

        // 3. Copy .bikey files to server keys directory
        const keysDir = join(serverDir, 'keys');
        if (!(await exists(keysDir))) await fsPromises.mkdir(keysDir, { recursive: true });

        const modKeysDir = join(targetModDir, 'keys');
        if (await exists(modKeysDir)) {
          const keyFiles = await fsPromises.readdir(modKeysDir);
          for (const file of keyFiles) {
            if (file.endsWith('.bikey')) {
              await fsPromises.copyFile(join(modKeysDir, file), join(keysDir, file));
            }
          }
        }

        // We might also need to check the root of the mod directory for .bikey files
        const rootFiles = await fsPromises.readdir(targetModDir);
        for (const file of rootFiles) {
          if (file.endsWith('.bikey')) {
            await fsPromises.copyFile(join(targetModDir, file), join(keysDir, file));
          }
        }
      }

      // Append new mods to mod_dependencies.json
      try {
        const depsPath = join(serverDir, 'mod_dependencies.json');
        let modDeps: Record<string, string[]> = {};
        if (fs.existsSync(depsPath)) {
          try { modDeps = JSON.parse(await fsPromises.readFile(depsPath, 'utf8')); } catch (e) {}
        }
        for (const m of modsToInstall) {
          if (!modDeps[m.modId] || modDeps[m.modId].length === 0) {
            console.log(`[Install] Fetching deps for ${m.modId}`);
            modDeps[m.modId] = await SteamWebAPI.getModDependencies(m.modId);
          }
        }
        await fsPromises.writeFile(depsPath, JSON.stringify(modDeps, null, 2));
      } catch (e) {
        console.warn('Failed to update mod_dependencies.json during install', e);
      }

      SteamCMDSetup.sendLog(serverId, 100, 'All mods installed and setup successfully!');
      return true;
    } catch (e: any) {
      console.error('Failed to install DayZ mods', e);
      throw e;
    }
  }

  static async installMod(serverId: number, modId: string, modTitle: string, username?: string, password?: string, steamGuardCode?: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const appId = 221100;

      // 1. Download via SteamWorkshopDownloader
      await SteamWorkshopDownloader.downloadWorkshopItem(serverId, appId, modId, username, password, steamGuardCode);

      // 2. Copy mod folder from SteamCMD cache to server dir
      const steamCmdDir = SteamCMDSetup.getSteamCMDDir();
      const workshopModDir = join(steamCmdDir, 'steamapps', 'workshop', 'content', appId.toString(), modId);
      
      if (!(await exists(workshopModDir))) {
        throw new Error('Mod folder not found after download');
      }

      // Safe folder name (e.g. @CF)
      const safeTitle = modTitle.replace(/[^a-zA-Z0-9]/g, '');
      const folderName = `@${safeTitle || modId}`;
      const targetModDir = join(serverDir, folderName);

      try {
        await fsPromises.lstat(targetModDir);
        // If lstat succeeds, it exists (even as a broken symlink)
        await fsPromises.rm(targetModDir, { recursive: true, force: true });
      } catch (e) {
        // Does not exist, safe to proceed
      }

      SteamCMDSetup.sendLog(serverId, 100, `Copying ${folderName} to server...`);
      await fsPromises.cp(workshopModDir, targetModDir, { recursive: true });

      // Save mod ID and title for reference
      await fsPromises.writeFile(join(targetModDir, 'modid.txt'), `${modId}:${modTitle}`);

      // 3. Copy .bikey files to server keys directory
      const keysDir = join(serverDir, 'keys');
      if (!(await exists(keysDir))) await fsPromises.mkdir(keysDir, { recursive: true });

      const modKeysDir = join(targetModDir, 'keys');
      if (await exists(modKeysDir)) {
        const keyFiles = await fsPromises.readdir(modKeysDir);
        for (const file of keyFiles) {
          if (file.endsWith('.bikey')) {
            await fsPromises.copyFile(join(modKeysDir, file), join(keysDir, file));
          }
        }
      }

      // We might also need to check the root of the mod directory for .bikey files
      const rootFiles = await fsPromises.readdir(targetModDir);
      for (const file of rootFiles) {
        if (file.endsWith('.bikey')) {
          await fsPromises.copyFile(join(targetModDir, file), join(keysDir, file));
        }
      }

      // 4. Auto-download mission files if this is a known map repo
      if (DAYZ_MAP_REPOS[modId]) {
        try {
          SteamCMDSetup.sendLog(serverId, 100, `Fetching mission files for ${modTitle}...`);
          await DayzMissionManager.fetchDayzMission(serverId, modId);
          SteamCMDSetup.sendLog(serverId, 100, `Mission files downloaded and server configured!`);
        } catch (e) {
          console.warn(`Could not fetch auto mission files for ${modId}`, e);
        }
      }

      return true;
    } catch (e: any) {
      console.error('Failed to install DayZ mod', e);
      throw e;
    }
  }

  static async uninstallMod(serverId: number, modIdOrFolder: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      
      // If it's a folder name (starts with @), remove it directly
      if (modIdOrFolder.startsWith('@')) {
        const modDir = join(serverDir, modIdOrFolder);
        if (await exists(modDir)) {
          // Ideally we'd also delete the .bikey files, but we don't know exactly which ones belong to this mod without parsing
          await fsPromises.rm(modDir, { recursive: true, force: true });
        }
      } else {
        // Find by modId inside modid.txt
        const folders = await fsPromises.readdir(serverDir, { withFileTypes: true });
        const mods = folders.filter(f => f.isDirectory() && f.name.startsWith('@'));
        for (const f of mods) {
          const modIdPath = join(serverDir, f.name, 'modid.txt');
          if (await exists(modIdPath)) {
            const content = await fsPromises.readFile(modIdPath, 'utf-8');
            if (content.startsWith(`${modIdOrFolder}:`)) {
              await fsPromises.rm(join(serverDir, f.name), { recursive: true, force: true });
              break;
            }
          }
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to uninstall DayZ mod', e);
      return false;
    }
  }
}
