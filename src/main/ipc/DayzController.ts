import { app, ipcMain } from 'electron';
import { join } from 'path';
import fsPromises from 'fs/promises';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { DayzModInstaller } from '../dayz/DayzModInstaller';
import { DayzMissionManager } from '../dayz/DayzMissionManager';
import { DayzModStatusManager } from '../dayz/DayzModStatusManager';
import { SteamWebAPI } from '../api/SteamWebAPI';

async function exists(path: string) {
  try {
    await fsPromises.access(path);
    return true;
  } catch {
    return false;
  }
}

export class DayzController {
  static register(activeServers: Record<number, any>) {
    // --- DayZ Config ---
    ipcMain.handle('read-dayz-config', async (_, id) => {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const cfgPath = join(serverDir, 'serverDZ.cfg');
      if (await exists(cfgPath)) {
        return await fsPromises.readFile(cfgPath, 'utf-8');
      }
      return null;
    });

    ipcMain.handle('write-dayz-config', async (_, id, content) => {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const cfgPath = join(serverDir, 'serverDZ.cfg');
      if (await exists(cfgPath)) {
        await fsPromises.writeFile(cfgPath, content);
        return true;
      }
      return false;
    });

    // --- DayZ Economy ---
    ipcMain.handle('get-dayz-economy', async (_, id) => {
      try {
        const serverDir = join(app.getPath('userData'), 'servers', id.toString());
        const cfgPath = join(serverDir, 'serverDZ.cfg');
        if (!await exists(cfgPath)) return null;
        
        const cfg = await fsPromises.readFile(cfgPath, 'utf-8');
        const templateMatch = cfg.match(/template\s*=\s*"([^"]*)"/i);
        const template = templateMatch ? templateMatch[1] : 'dayzOffline.chernarusplus';
        
        const globalsPath = join(serverDir, 'mpmissions', template, 'db', 'globals.xml');

        let pristineLoot = false;
        if (await exists(globalsPath)) {
          const parser = new XMLParser({ ignoreAttributes: false });
          const globalsData = parser.parse(await fsPromises.readFile(globalsPath, 'utf-8'));
          
          const vars = globalsData.variables?.var || [];
          const damageMaxVar = vars.find((v: any) => v['@_name'] === 'LootDamageMax');
          if (damageMaxVar && damageMaxVar['@_value'] === '0.0') {
            pristineLoot = true;
          }
        }

        return { pristineLoot, template };
      } catch (e) {
        console.error('Failed to get DayZ economy', e);
        return null;
      }
    });

    ipcMain.handle('update-dayz-economy', async (_, id, settings: { pristineLoot: boolean, multipliers: Record<string, number> }) => {
      try {
        const serverDir = join(app.getPath('userData'), 'servers', id.toString());
        const cfgPath = join(serverDir, 'serverDZ.cfg');
        if (!await exists(cfgPath)) return false;
        
        const cfg = await fsPromises.readFile(cfgPath, 'utf-8');
        const templateMatch = cfg.match(/template\s*=\s*"([^"]*)"/i);
        const template = templateMatch ? templateMatch[1] : 'dayzOffline.chernarusplus';
        
        const globalsPath = join(serverDir, 'mpmissions', template, 'db', 'globals.xml');
        const typesPath = join(serverDir, 'mpmissions', template, 'db', 'types.xml');

        // 1. Update globals.xml
        if (await exists(globalsPath)) {
          await fsPromises.copyFile(globalsPath, `${globalsPath}.bak_${Date.now()}`);
          
          const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: false });
          const globalsData = parser.parse(await fsPromises.readFile(globalsPath, 'utf-8'));
          
          const vars = globalsData.variables?.var || [];
          const damageMaxVar = vars.find((v: any) => v['@_name'] === 'LootDamageMax');
          const damageMinVar = vars.find((v: any) => v['@_name'] === 'LootDamageMin');
          
          if (damageMaxVar && damageMinVar) {
            damageMaxVar['@_value'] = settings.pristineLoot ? '0.0' : '1.0';
            damageMinVar['@_value'] = settings.pristineLoot ? '0.0' : '0.5';
          }
          
          const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
          const newGlobals = builder.build(globalsData);
          await fsPromises.writeFile(globalsPath, newGlobals);
        }

        // 2. Update types.xml
        if (await exists(typesPath)) {
          await fsPromises.copyFile(typesPath, `${typesPath}.bak_${Date.now()}`);
          
          const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: false });
          let typesData = parser.parse(await fsPromises.readFile(typesPath, 'utf-8'));
          
          const originalBackup = `${typesPath}.original`;
          if (!(await exists(originalBackup))) {
            await fsPromises.copyFile(typesPath, originalBackup);
          } else {
            typesData = parser.parse(await fsPromises.readFile(originalBackup, 'utf-8'));
          }

          const items = typesData.types?.type || [];
          
          for (const item of items) {
            const category = item.category?.['@_name'];
            if (category && settings.multipliers[category] !== undefined) {
              const mult = settings.multipliers[category];
              if (item.nominal) item.nominal = Math.round(Number(item.nominal) * mult);
              if (item.min) item.min = Math.round(Number(item.min) * mult);
            }
          }
          
          const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
          let newTypes = builder.build(typesData);
          if (!newTypes.startsWith('<?xml')) {
              newTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + newTypes;
          }
          await fsPromises.writeFile(typesPath, newTypes);
        }

        // 3. Update cfgspawnabletypes.xml
        const possibleCfgPaths = [
          join(serverDir, 'mpmissions', template, 'cfgspawnabletypes.xml'),
          join(serverDir, 'mpmissions', template, 'db', 'cfgspawnabletypes.xml'),
          join(serverDir, 'mpmissions', template, 'env', 'cfgspawnabletypes.xml')
        ];
        
        for (const spawnablePath of possibleCfgPaths) {
          if (await exists(spawnablePath)) {
            await fsPromises.copyFile(spawnablePath, `${spawnablePath}.bak_${Date.now()}`);
            
            const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: false });
            let spawnData = parser.parse(await fsPromises.readFile(spawnablePath, 'utf-8'));
            
            const originalBackup = `${spawnablePath}.original`;
            if (!(await exists(originalBackup))) {
              await fsPromises.copyFile(spawnablePath, originalBackup);
            } else if (!settings.pristineLoot) {
              spawnData = parser.parse(await fsPromises.readFile(originalBackup, 'utf-8'));
            }

            if (settings.pristineLoot) {
              const types = spawnData.spawnabletypes?.type || [];
              const typesArray = Array.isArray(types) ? types : [types];
              for (const type of typesArray) {
                if (type.damage) delete type.damage;
              }
            }
            
            const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
            let newSpawnData = builder.build(spawnData);
            if (!newSpawnData.startsWith('<?xml')) {
                newSpawnData = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + newSpawnData;
            }
            await fsPromises.writeFile(spawnablePath, newSpawnData);
            break;
          }
        }

        return true;
      } catch (e) {
        console.error('Failed to update DayZ economy', e);
        return false;
      }
    });

    ipcMain.handle('wipe-dayz-loot', async (_, id, wipePlayers) => {
      try {
        const serverDir = join(app.getPath('userData'), 'servers', id.toString());
        const cfgPath = join(serverDir, 'serverDZ.cfg');
        if (!await exists(cfgPath)) return true;
        
        const cfg = await fsPromises.readFile(cfgPath, 'utf-8');
        const templateMatch = cfg.match(/template\s*=\s*"([^"]*)"/i);
        const template = templateMatch ? templateMatch[1] : 'dayzOffline.chernarusplus';
        const instanceIdMatch = cfg.match(/instanceId\s*=\s*(\d+)/i);
        const instanceId = instanceIdMatch ? instanceIdMatch[1] : '1';
        
        if (activeServers[id]) throw new Error('SERVER_IS_RUNNING');

        const storagePath = join(serverDir, 'mpmissions', template, `storage_${instanceId}`);
        if (await exists(storagePath)) {
          const entries = await fsPromises.readdir(storagePath);
          for (const entry of entries) {
            if (!wipePlayers && entry === 'players.db') continue;
            await fsPromises.rm(join(storagePath, entry), { recursive: true, force: true });
          }
        }
        return true;
      } catch (e: any) {
        console.error('Failed to wipe DayZ loot', e);
        if (e.message === 'SERVER_IS_RUNNING') throw e;
        return false;
      }
    });

    // --- DayZ Mods ---
    ipcMain.handle('search-steam-workshop', async (_, query, queryType, page, requiredTags) => {
      return await SteamWebAPI.searchWorkshop(query, 221100, page || 1, queryType || 9, requiredTags || []);
    });

    ipcMain.handle('get-mod-dependencies', async (_, modId) => {
      return await SteamWebAPI.getModDependencies(modId);
    });

    ipcMain.handle('rebuild-mod-dependencies', async (_, id) => {
      return await DayzModStatusManager.rebuildModDependencies(id);
    });

    ipcMain.handle('get-workshop-item-details', async (_, modIds) => {
      return await SteamWebAPI.getWorkshopItemDetails(modIds);
    });

    ipcMain.handle('get-dayz-installed-mods', async (_, id) => {
      return await DayzModStatusManager.getInstalledMods(id);
    });

    ipcMain.handle('toggle-dayz-map-mod', async (_, id, folderName, isMap) => {
      return await DayzModStatusManager.toggleMapMod(id, folderName, isMap);
    });

    ipcMain.handle('toggle-dayz-mod-status', async (_, id, folderName, isDisabled) => {
      return await DayzModStatusManager.toggleModStatus(id, folderName, isDisabled);
    });

    ipcMain.handle('download-dayz-mission', async (_, id, modId) => {
      return await DayzMissionManager.fetchDayzMission(id, modId);
    });

    ipcMain.handle('extract-dayz-local-mission', async (_, id, localMissionsPath) => {
      return await DayzMissionManager.extractLocalMission(id, localMissionsPath);
    });

    ipcMain.handle('select-workshop-folder', async () => {
      return await DayzModInstaller.selectWorkshopFolder();
    });

    ipcMain.handle('import-local-workshop', async (_, id, workshopPath) => {
      return await DayzModInstaller.importLocalWorkshop(id, workshopPath);
    });

    ipcMain.handle('install-dayz-mods', async (_, id, modsToInstall, username, password, steamGuardCode) => {
      return await DayzModInstaller.installMods(id, modsToInstall, username, password, steamGuardCode);
    });

    ipcMain.handle('install-dayz-mod', async (_, id, modId, modTitle, username, password, steamGuardCode) => {
      return await DayzModInstaller.installMod(id, modId, modTitle, username, password, steamGuardCode);
    });

    ipcMain.handle('uninstall-dayz-mod', async (_, id, modIdOrFolder) => {
      return await DayzModInstaller.uninstallMod(id, modIdOrFolder);
    });
  }
}
