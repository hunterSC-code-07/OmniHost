import { app, dialog } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import axios from 'axios'
import AdmZip from 'adm-zip'
import { SteamWebAPI } from '../api/SteamWebAPI'
import { SteamCMDManager } from '../steam/SteamCMDManager'
import { DayzConfigManager } from './DayzConfigManager'

const DAYZ_MAP_REPOS: Record<string, { template: string, repoZip: string }> = {
  '3127246029': {
    template: 'Empty.DeerIsle',
    repoZip: 'https://github.com/DeerIsle/DeerIsle-Missions/archive/refs/heads/main.zip'
  },
  '3127248100': {
    template: 'Empty.Namalsk',
    repoZip: 'https://github.com/Namalsk/Namalsk-Missions/archive/refs/heads/main.zip'
  },
  '3127250495': {
    template: 'Empty.Banov',
    repoZip: 'https://github.com/BanovTeam/Banov-Missions/archive/refs/heads/main.zip'
  },
  '3127252285': {
    template: 'Empty.Esseker',
    repoZip: 'https://github.com/EssekerTeam/Esseker-Missions/archive/refs/heads/main.zip'
  },
  '3127254530': {
    template: 'Empty.Rostow',
    repoZip: 'https://github.com/RostowTeam/Rostow-Missions/archive/refs/heads/main.zip'
  },
  '3127257211': {
    template: 'Empty.Takistan',
    repoZip: 'https://github.com/TakistanTeam/Takistan-Missions/archive/refs/heads/main.zip'
  },
  '3127260517': {
    template: 'Empty.StuartIsland',
    repoZip: 'https://github.com/StuartIslandTeam/StuartIsland-Missions/archive/refs/heads/main.zip'
  },
  '2182740961': {
    template: 'Expansion.ChernarusPlus',
    repoZip: 'https://github.com/ExpansionModTeam/DayZ-Expansion-Missions/archive/refs/heads/master.zip'
  }
};

export class DayzWorkshopManager {
  static async searchWorkshop(query: string, page = 1, queryType = 9, requiredTags: string[] = []) {
    return await SteamWebAPI.searchWorkshop(query, 221100, page, queryType, requiredTags);
  }

  static async getModDependencies(modId: string) {
    return await SteamWebAPI.getModDependencies(modId);
  }

  static async rebuildModDependencies(serverId: number) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      if (!(await DayzConfigManager.exists(serverDir))) return;

      const folders = await fsPromises.readdir(serverDir, { withFileTypes: true });
      const mods = folders.filter(f => (f.isDirectory() || f.isSymbolicLink()) && f.name.startsWith('@'));
      
      const depsPath = join(serverDir, 'mod_dependencies.json');
      let modDeps: Record<string, string[]> = {};
      if (fs.existsSync(depsPath)) {
        try {
          modDeps = JSON.parse(await fsPromises.readFile(depsPath, 'utf8'));
        } catch (e) {}
      }

      for (const f of mods) {
        const modDir = join(serverDir, f.name);
        const modIdPath = join(modDir, 'modid.txt');
        if (fs.existsSync(modIdPath)) {
          const content = await fsPromises.readFile(modIdPath, 'utf-8');
          const modId = content.trim().split(':')[0];
          if (modId) {
            if (!modDeps[modId] || modDeps[modId].length === 0) {
              console.log(`[Rebuild] Fetching deps for ${modId}`);
              modDeps[modId] = await SteamWebAPI.getModDependencies(modId);
            }
          }
        }
      }

      await fsPromises.writeFile(depsPath, JSON.stringify(modDeps, null, 2));
      return modDeps;
    } catch (e) {
      console.error('rebuild-mod-dependencies error:', e);
      throw e instanceof Error ? e : new Error((e as any)?.message || String(e));
    }
  }

  static async getWorkshopItemDetails(modIds: string[]) {
    return await SteamWebAPI.getWorkshopItemDetails(modIds);
  }

  static async getInstalledMods(serverId: number) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      if (!(await DayzConfigManager.exists(serverDir))) return [];

      const folders = await fsPromises.readdir(serverDir, { withFileTypes: true });
      const mods = folders.filter(f => (f.isDirectory() || f.isSymbolicLink()) && f.name.startsWith('@'));
      
      const modDetails = await Promise.all(mods.map(async f => {
        const modDir = join(serverDir, f.name);
        const modIdPath = join(modDir, 'modid.txt');
        const isMapPath = join(modDir, 'is_map.txt');
        const disabledPath = join(modDir, 'disabled.txt');
        let title = f.name.substring(1);
        let idStr = '';
        if (fs.existsSync(modIdPath)) {
          const content = fs.readFileSync(modIdPath, 'utf-8').trim();
          const parts = content.split(':');
          if (parts.length >= 2) {
            idStr = parts.shift() || '';
            title = parts.join(':');
          }
        } else {
          // Fallback to meta.cpp for locally imported mods
          const metaPath = join(modDir, 'meta.cpp');
          if (fs.existsSync(metaPath)) {
            const metaContent = fs.readFileSync(metaPath, 'utf-8');
            const idMatch = metaContent.match(/publishedid\s*=\s*(\d+)/i);
            if (idMatch && idMatch[1]) {
              idStr = idMatch[1];
            }
            const nameMatch = metaContent.match(/name\s*=\s*"([^"]+)"/i);
            if (nameMatch && nameMatch[1]) {
              title = nameMatch[1];
            }
          }
        }

        let isMap = false;
        if (fs.existsSync(isMapPath)) {
          const isMapContent = fs.readFileSync(isMapPath, 'utf-8').trim();
          isMap = isMapContent === 'true';
        } else {
          if (idStr && DAYZ_MAP_REPOS[idStr]) {
            isMap = true;
          } else {
            const mpmissionsPath1 = join(modDir, 'mpmissions');
            const mpmissionsPath2 = join(modDir, 'ServerFiles', 'mpmissions');
            if (fs.existsSync(mpmissionsPath1) || fs.existsSync(mpmissionsPath2)) {
              isMap = true;
            }
          }
        }

        let hasLocalMissions = false;
        let localMissionsPath = '';
        const mp1 = join(modDir, 'mpmissions');
        const mp2 = join(modDir, 'ServerFiles', 'mpmissions');
        if (fs.existsSync(mp1)) {
            hasLocalMissions = true;
            localMissionsPath = mp1;
        } else if (fs.existsSync(mp2)) {
            hasLocalMissions = true;
            localMissionsPath = mp2;
        }

        const isDisabled = fs.existsSync(disabledPath);

        return {
          id: idStr || f.name,
          title,
          folderName: f.name,
          isMap,
          hasLocalMissions,
          localMissionsPath,
          isDisabled
        };
      }));

      return modDetails;
    } catch (e) {
      console.error('Failed to get installed DayZ mods', e);
      return [];
    }
  }

  static async toggleMapMod(serverId: number, folderName: string, isMap: boolean) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const modDir = join(serverDir, folderName);
      if (await DayzConfigManager.exists(modDir)) {
        await fsPromises.writeFile(join(modDir, 'is_map.txt'), isMap ? 'true' : 'false', 'utf-8');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to toggle DayZ map mod', e);
      return false;
    }
  }

  static async toggleModStatus(serverId: number, folderName: string, isDisabled: boolean) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const modDir = join(serverDir, folderName);
      if (await DayzConfigManager.exists(modDir)) {
        const disabledPath = join(modDir, 'disabled.txt');
        if (isDisabled) {
          await fsPromises.writeFile(disabledPath, 'true', 'utf-8');
        } else {
          if (await DayzConfigManager.exists(disabledPath)) {
            await fsPromises.rm(disabledPath);
          }
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to toggle DayZ mod status', e);
      return false;
    }
  }

  static async fetchDayzMission(serverId: number, modId: string) {
    const repoInfo = DAYZ_MAP_REPOS[modId];
    if (!repoInfo || !repoInfo.repoZip) {
      throw new Error('No mission repository found for this map mod.');
    }
    const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
    const mpmissionsDir = join(serverDir, 'mpmissions');
    
    if (!(await DayzConfigManager.exists(mpmissionsDir))) {
      await fsPromises.mkdir(mpmissionsDir, { recursive: true });
    }

    // Download ZIP
    const response = await axios({
      url: repoInfo.repoZip,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    const tempZipPath = join(serverDir, `mission_${modId}_${Date.now()}.zip`);
    await fsPromises.writeFile(tempZipPath, response.data);

    // Extract ZIP
    const zip = new AdmZip(tempZipPath);
    
    const tempExtractDir = join(serverDir, `temp_mission_${modId}_${Date.now()}`);
    zip.extractAllTo(tempExtractDir, true);
    
    // Recursively search for the template folder
    let foundMissionPath = '';
    async function findFolder(dir: string, targetFolder: string) {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name.toLowerCase() === targetFolder.toLowerCase()) {
            foundMissionPath = join(dir, entry.name);
            return;
          }
          await findFolder(join(dir, entry.name), targetFolder);
        }
      }
    }

    await findFolder(tempExtractDir, repoInfo.template);

    if (foundMissionPath) {
      const targetPath = join(mpmissionsDir, repoInfo.template);
      if (await DayzConfigManager.exists(targetPath)) {
        await fsPromises.rm(targetPath, { recursive: true, force: true });
      }
      await fsPromises.cp(foundMissionPath, targetPath, { recursive: true });
    } else {
      throw new Error(`Mission folder ${repoInfo.template} not found in the downloaded repository.`);
    }

    // Cleanup
    await fsPromises.rm(tempZipPath, { force: true });
    await fsPromises.rm(tempExtractDir, { recursive: true, force: true });

    // Update serverDZ.cfg
    const cfgPath = join(serverDir, 'serverDZ.cfg');
    if (await DayzConfigManager.exists(cfgPath)) {
      let cfgContent = await fsPromises.readFile(cfgPath, 'utf-8');
      cfgContent = cfgContent.replace(/template\s*=\s*"[^"]*"/g, `template="${repoInfo.template}"`);
      await fsPromises.writeFile(cfgPath, cfgContent, 'utf-8');
    }
    
    return true;
  }

  static async extractLocalMission(serverId: number, localMissionsPath: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const mpmissionsDir = join(serverDir, 'mpmissions');
      
      if (!(await DayzConfigManager.exists(mpmissionsDir))) {
        await fsPromises.mkdir(mpmissionsDir, { recursive: true });
      }

      // Read directories in localMissionsPath
      const entries = await fsPromises.readdir(localMissionsPath, { withFileTypes: true });
      let firstTemplate = '';
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sourcePath = join(localMissionsPath, entry.name);
          const destPath = join(mpmissionsDir, entry.name);
          
          if (await DayzConfigManager.exists(destPath)) {
            await fsPromises.rm(destPath, { recursive: true, force: true });
          }
          await fsPromises.cp(sourcePath, destPath, { recursive: true });
          
          if (!firstTemplate) {
            firstTemplate = entry.name;
          }
        }
      }

      if (firstTemplate) {
        const cfgPath = join(serverDir, 'serverDZ.cfg');
        if (await DayzConfigManager.exists(cfgPath)) {
          let cfgContent = await fsPromises.readFile(cfgPath, 'utf-8');
          cfgContent = cfgContent.replace(/template\s*=\s*"[^"]*"/g, `template="${firstTemplate}"`);
          await fsPromises.writeFile(cfgPath, cfgContent, 'utf-8');
        }
      }

      return true;
    } catch (e: any) {
      console.error('Failed to extract local DayZ mission', e);
      throw e;
    }
  }

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

      if (!(await DayzConfigManager.exists(actualWorkshopPath))) {
        throw new Error(`Could not find !Workshop folder at ${actualWorkshopPath}. Make sure you selected the correct DayZ directory.`);
      }

      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const keysDir = join(serverDir, 'keys');
      
      if (!(await DayzConfigManager.exists(keysDir))) {
        await fsPromises.mkdir(keysDir, { recursive: true });
      }

      const entries = await fsPromises.readdir(actualWorkshopPath, { withFileTypes: true });
      let importedCount = 0;

      for (const entry of entries) {
        if ((entry.isDirectory() || entry.isSymbolicLink()) && entry.name.startsWith('@')) {
          const modSource = join(actualWorkshopPath, entry.name);
          const modDest = join(serverDir, entry.name);
          
          // Remove if it exists
          if (await DayzConfigManager.exists(modDest)) {
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
          if (await DayzConfigManager.exists(modKeysDir)) {
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
      
      // 1. Download via SteamCMD
      await SteamCMDManager.downloadWorkshopItems(serverId, appId, modIds, username, password, steamGuardCode);

      // 2. Copy mod folders from SteamCMD cache to server dir
      const steamCmdDir = SteamCMDManager.getSteamCMDDir();

      for (const m of modsToInstall) {
        const workshopModDir = join(steamCmdDir, 'steamapps', 'workshop', 'content', appId.toString(), m.modId);
        
        if (!(await DayzConfigManager.exists(workshopModDir))) {
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

        SteamCMDManager.sendLog(serverId, 100, `Copying ${folderName} to server...`);
        await fsPromises.cp(workshopModDir, targetModDir, { recursive: true });

        // Save mod ID and title for reference
        await fsPromises.writeFile(join(targetModDir, 'modid.txt'), `${m.modId}:${m.modTitle}`);

        // 3. Copy .bikey files to server keys directory
        const keysDir = join(serverDir, 'keys');
        if (!(await DayzConfigManager.exists(keysDir))) await fsPromises.mkdir(keysDir, { recursive: true });

        const modKeysDir = join(targetModDir, 'keys');
        if (await DayzConfigManager.exists(modKeysDir)) {
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

      SteamCMDManager.sendLog(serverId, 100, 'All mods installed and setup successfully!');
      return true;
    } catch (e: any) {
      console.error('Failed to install DayZ mods', e);
      throw e instanceof Error ? e : new Error((e as any)?.message || String(e));
    }
  }

  static async installMod(serverId: number, modId: string, modTitle: string, username?: string, password?: string, steamGuardCode?: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const appId = 221100;

      // 1. Download via SteamCMD
      await SteamCMDManager.downloadWorkshopItem(serverId, appId, modId, username, password, steamGuardCode);

      // 2. Copy mod folder from SteamCMD cache to server dir
      const steamCmdDir = SteamCMDManager.getSteamCMDDir();
      const workshopModDir = join(steamCmdDir, 'steamapps', 'workshop', 'content', appId.toString(), modId);
      
      if (!(await DayzConfigManager.exists(workshopModDir))) {
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

      SteamCMDManager.sendLog(serverId, 100, `Copying ${folderName} to server...`);
      await fsPromises.cp(workshopModDir, targetModDir, { recursive: true });

      // Save mod ID and title for reference
      await fsPromises.writeFile(join(targetModDir, 'modid.txt'), `${modId}:${modTitle}`);

      // 3. Copy .bikey files to server keys directory
      const keysDir = join(serverDir, 'keys');
      if (!(await DayzConfigManager.exists(keysDir))) await fsPromises.mkdir(keysDir, { recursive: true });

      const modKeysDir = join(targetModDir, 'keys');
      if (await DayzConfigManager.exists(modKeysDir)) {
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
          SteamCMDManager.sendLog(serverId, 100, `Fetching mission files for ${modTitle}...`);
          await this.fetchDayzMission(serverId, modId);
          SteamCMDManager.sendLog(serverId, 100, `Mission files downloaded and server configured!`);
        } catch (e) {
          console.warn(`Could not fetch auto mission files for ${modId}`, e);
        }
      }

      return true;
    } catch (e: any) {
      console.error('Failed to install DayZ mod', e);
      throw e instanceof Error ? e : new Error((e as any)?.message || String(e));
    }
  }

  static async uninstallMod(serverId: number, modIdOrFolder: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      
      // If it's a folder name (starts with @), remove it directly
      if (modIdOrFolder.startsWith('@')) {
        const modDir = join(serverDir, modIdOrFolder);
        if (await DayzConfigManager.exists(modDir)) {
          // Ideally we'd also delete the .bikey files, but we don't know exactly which ones belong to this mod without parsing
          await fsPromises.rm(modDir, { recursive: true, force: true });
        }
      } else {
        // Find by modId inside modid.txt
        const folders = await fsPromises.readdir(serverDir, { withFileTypes: true });
        const mods = folders.filter(f => f.isDirectory() && f.name.startsWith('@'));
        for (const f of mods) {
          const modIdPath = join(serverDir, f.name, 'modid.txt');
          if (await DayzConfigManager.exists(modIdPath)) {
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
