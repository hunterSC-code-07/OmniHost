import { app } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { DayzConfigManager } from './DayzConfigManager'

export class DayzEconomyManager {
  static async getEconomy(serverId: number) {
    if (serverId == null) return { pristineLoot: false };
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const cfgPath = join(serverDir, 'serverDZ.cfg');
      if (!await DayzConfigManager.exists(cfgPath)) return null;
      
      const cfg = await fsPromises.readFile(cfgPath, 'utf-8');
      const templateMatch = cfg.match(/template\s*=\s*"([^"]*)"/i);
      const template = templateMatch ? templateMatch[1] : 'dayzOffline.chernarusplus';
      
      const globalsPath = join(serverDir, 'mpmissions', template, 'db', 'globals.xml');

      let pristineLoot = false;
      if (await DayzConfigManager.exists(globalsPath)) {
        const parser = new XMLParser({ ignoreAttributes: false });
        const globalsData = parser.parse(await fsPromises.readFile(globalsPath, 'utf-8'));
        
        // Find LootDamageMax
        const vars = globalsData.variables?.var || [];
        const damageMaxVar = vars.find((v: any) => v['@_name'] === 'LootDamageMax');
        if (damageMaxVar && damageMaxVar['@_value'] === '0.0') {
          pristineLoot = true;
        }
      }

      return { pristineLoot };
    } catch (e) {
      console.error('Failed to get DayZ economy', e);
      return null;
    }
  }

  static async updateEconomy(serverId: number, settings: { pristineLoot: boolean, multipliers: Record<string, number> }) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const cfgPath = join(serverDir, 'serverDZ.cfg');
      if (!await DayzConfigManager.exists(cfgPath)) return false;
      
      const cfg = await fsPromises.readFile(cfgPath, 'utf-8');
      const templateMatch = cfg.match(/template\s*=\s*"([^"]*)"/i);
      const template = templateMatch ? templateMatch[1] : 'dayzOffline.chernarusplus';
      
      const globalsPath = join(serverDir, 'mpmissions', template, 'db', 'globals.xml');
      const typesPath = join(serverDir, 'mpmissions', template, 'db', 'types.xml');

      // 1. Update globals.xml
      if (await DayzConfigManager.exists(globalsPath)) {
        // Backup
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
      if (await DayzConfigManager.exists(typesPath)) {
        // Backup
        await fsPromises.copyFile(typesPath, `${typesPath}.bak_${Date.now()}`);
        
        const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: false });
        let typesData = parser.parse(await fsPromises.readFile(typesPath, 'utf-8'));
        
        // Read original values from a pristine backup if we have one to avoid compounding multipliers
        const originalBackup = `${typesPath}.original`;
        if (!(await DayzConfigManager.exists(originalBackup))) {
          await fsPromises.copyFile(typesPath, originalBackup);
        } else {
          typesData = parser.parse(await fsPromises.readFile(originalBackup, 'utf-8'));
        }

        const items = typesData.types?.type || [];
        
        for (const item of items) {
          const category = item.category?.['@_name'];
          if (category && settings.multipliers[category] !== undefined) {
            const mult = settings.multipliers[category];
            if (item.nominal) {
              item.nominal = Math.round(Number(item.nominal) * mult);
            }
            if (item.min) {
              item.min = Math.round(Number(item.min) * mult);
            }
          }
        }
        
        const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
        // The builder sometimes omits the xml header, we should add it back manually just in case
        let newTypes = builder.build(typesData);
        if (!newTypes.startsWith('<?xml')) {
            newTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + newTypes;
        }
        await fsPromises.writeFile(typesPath, newTypes);
      }

      // 3. Update cfgspawnabletypes.xml for Pristine Loot override
      const possibleCfgPaths = [
        join(serverDir, 'mpmissions', template, 'cfgspawnabletypes.xml'),
        join(serverDir, 'mpmissions', template, 'db', 'cfgspawnabletypes.xml'),
        join(serverDir, 'mpmissions', template, 'env', 'cfgspawnabletypes.xml')
      ];
      
      for (const spawnablePath of possibleCfgPaths) {
        if (await DayzConfigManager.exists(spawnablePath)) {
          // Backup
          await fsPromises.copyFile(spawnablePath, `${spawnablePath}.bak_${Date.now()}`);
          
          const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: false });
          let spawnData = parser.parse(await fsPromises.readFile(spawnablePath, 'utf-8'));
          
          const originalBackup = `${spawnablePath}.original`;
          if (!(await DayzConfigManager.exists(originalBackup))) {
            await fsPromises.copyFile(spawnablePath, originalBackup);
          } else if (!settings.pristineLoot) {
            // Only revert to original if pristineLoot is disabled
            spawnData = parser.parse(await fsPromises.readFile(originalBackup, 'utf-8'));
          }

          if (settings.pristineLoot) {
            const types = spawnData.spawnabletypes?.type || [];
            // Ensure types is an array (fast-xml-parser can make it an object if only one exists)
            const typesArray = Array.isArray(types) ? types : [types];

            for (const type of typesArray) {
              if (type.damage) {
                // Delete the damage node entirely to rely on global config
                delete type.damage;
              }
            }
          }
          
          const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
          let newSpawnData = builder.build(spawnData);
          if (!newSpawnData.startsWith('<?xml')) {
              newSpawnData = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + newSpawnData;
          }
          await fsPromises.writeFile(spawnablePath, newSpawnData);
          break; // Found and updated, no need to check other path
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to update DayZ economy', e);
      return false;
    }
  }

  static async wipeLoot(serverId: number, isRunning: boolean) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const cfgPath = join(serverDir, 'serverDZ.cfg');
      if (!await DayzConfigManager.exists(cfgPath)) return false;
      
      const cfg = await fsPromises.readFile(cfgPath, 'utf-8');
      const templateMatch = cfg.match(/template\s*=\s*"([^"]*)"/i);
      const template = templateMatch ? templateMatch[1] : 'dayzOffline.chernarusplus';
      
      if (isRunning) {
        throw new Error('SERVER_IS_RUNNING');
      }

      const typesBinPath = join(serverDir, 'mpmissions', template, 'storage_1', 'data', 'types.bin');
      if (await DayzConfigManager.exists(typesBinPath)) {
        await fsPromises.rm(typesBinPath, { force: true });
        return true;
      }
      return true; // Already wiped or doesn't exist
    } catch (e) {
      console.error('Failed to wipe DayZ loot', e);
      return false;
    }
  }
}
