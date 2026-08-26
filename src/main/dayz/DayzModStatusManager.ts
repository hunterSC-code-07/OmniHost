import { app } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import { SteamWebAPI } from '../api/SteamWebAPI'
import { DAYZ_MAP_REPOS } from './DayzMissionManager'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export class DayzModStatusManager {
  static async rebuildModDependencies(serverId: number) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      if (!(await exists(serverDir))) return;

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
      throw e;
    }
  }

  static async getInstalledMods(serverId: number) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      if (!(await exists(serverDir))) return [];

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
      if (await exists(modDir)) {
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
      if (await exists(modDir)) {
        const disabledPath = join(modDir, 'disabled.txt');
        if (isDisabled) {
          await fsPromises.writeFile(disabledPath, 'true', 'utf-8');
        } else {
          if (await exists(disabledPath)) {
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
}
