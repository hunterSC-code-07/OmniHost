import { app, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { getServers, createServer, deleteServer, updateServerSoftware } from '../db'
import { DayzAdapter } from '../adapters/DayzAdapter'
import { MinecraftAdapter } from '../adapters/MinecraftAdapter'
import { WakeProxy } from '../adapters/WakeProxy'
import { SteamWebAPI } from '../api/SteamWebAPI'
import { SteamCMDManager } from '../adapters/SteamCMDManager'
import axios from 'axios'
import AdmZip from 'adm-zip'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export const DAYZ_MAP_REPOS: Record<string, { name: string, repoZip: string, template: string }> = {
  '2289456201': { // Namalsk Island
    name: 'Namalsk',
    repoZip: 'https://github.com/SumrakDZN/Namalsk-Server/archive/refs/heads/master.zip',
    template: 'regular.namalsk' 
  },
  '1602372402': { // Deer Isle
    name: 'Deer Isle',
    repoZip: 'https://github.com/ExpansionModTeam/DayZ-Expansion-Missions/archive/refs/heads/master.zip',
    template: 'empty.deerisle'
  },
  '2699824632': { // Banov
    name: 'Banov',
    repoZip: 'https://github.com/KubeloLive/Banov/archive/refs/heads/main.zip',
    template: 'empty.banov'
  }
};

export function registerServerIpc(
  activeServers: Record<number, any>,
  activeProxies: Record<number, WakeProxy>
) {
  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle('get-servers', () => {
    const list = getServers() as any[]
    const serversDir = join(app.getPath('userData'), 'servers')
    return list.map((srv) => {
      let meta: any = {}
      let port = 25565
      const srvDir = join(serversDir, srv.id.toString())
      const metaPath = join(srvDir, 'omnihost.json')
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        } catch (e) {}
      }
      const propsPath = join(srvDir, 'server.properties')
      if (fs.existsSync(propsPath)) {
        try {
          const props = fs.readFileSync(propsPath, 'utf-8')
          const match = props.match(/^server-port=(\d+)/m)
          if (match) port = parseInt(match[1], 10)
        } catch (e) {}
      }
      let type = meta.type
      if (!type && srv.game) {
        const typeMatch = srv.game.match(/\((.*?)\)/)
        if (typeMatch) type = typeMatch[1]
        else type = 'Vanilla'
      }
      return {
        ...srv,
        status: activeServers[srv.id] ? 'Online' : srv.status,
        type: type || 'Vanilla',
        version: meta.version || '1.20.4',
        loaderVersion: meta.loaderVersion || '',
        port: srv.port || port || 25565,
        onlinePlayers: activeServers[srv.id] ? activeServers[srv.id].onlinePlayers : [],
        logs: activeServers[srv.id] ? activeServers[srv.id].logHistory : []
      }
    })
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle('delete-server', async (_, id) => {
    deleteServer(id)
    if (activeServers[id]) {
      await activeServers[id].stop()
      delete activeServers[id]
    }
    const serversDir = join(app.getPath('userData'), 'servers')
    const srvDir = join(serversDir, id.toString())
    if (await exists(srvDir)) {
      for (let i = 0; i < 5; i++) {
        try {
          await fsPromises.rm(srvDir, { recursive: true, force: true })
          break
        } catch (e: any) {
          if (e.code === 'EBUSY' && i < 4) {
            await new Promise((r) => setTimeout(r, 1000))
          } else {
            throw e
          }
        }
      }
    }
    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle('create-server', async (_, name, game, type, version, loaderVersion) => {
    const gameStr = game === 'Minecraft' ? `Minecraft (${type})` : game
    const id = createServer(name, gameStr)
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    if (!(await exists(serverDir))) await fsPromises.mkdir(serverDir, { recursive: true })
    await fsPromises.writeFile(
      join(serverDir, 'omnihost.json'),
      JSON.stringify({ game, type, version, loaderVersion })
    )
    // DayZ downloading is now handled by the install-steam-app IPC handler

    return id
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  ipcMain.handle('change-server-software', async (_, id, type, version, loaderVersion) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const modsDir = join(serverDir, 'mods')

    // Rename old mods folder to prevent compatibility issues
    if (fs.existsSync(modsDir)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      fs.renameSync(modsDir, join(serverDir, `mods_old_${timestamp}`))
    }

    // Cleanup old startup scripts and modloader jars to prevent booting the wrong software
    const cleanupFiles = ['run.bat', 'start.bat', 'run.sh', 'start.sh', 'user_jvm_args.txt']
    for (const file of cleanupFiles) {
      const p = join(serverDir, file)
      if (fs.existsSync(p)) fs.rmSync(p)
    }

    const allFiles = fs.readdirSync(serverDir)
    for (const file of allFiles) {
      if ((file.startsWith('forge-') || file.startsWith('neoforge-')) && file.endsWith('.jar')) {
        fs.rmSync(join(serverDir, file))
      }
    }

    // Update omnihost.json (Assumes Minecraft since DayZ doesn't use software changer yet)
    fs.writeFileSync(
      join(serverDir, 'omnihost.json'),
      JSON.stringify({ game: 'Minecraft', type, version, loaderVersion })
    )

    // Update DB
    updateServerSoftware(id, `Minecraft (${type})`)

    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('toggle-auto-start', async (_, id, enabled) => {
    try {
      if (enabled) {
        if (!activeServers[id]) activeServers[id] = new MinecraftAdapter(id)
        const serverDir = join(app.getPath('userData'), 'servers', id.toString())
        const propsPath = join(serverDir, 'server.properties')
        let port = 25565
        if (await exists(propsPath)) {
          const props = await fsPromises.readFile(propsPath, 'utf-8')
          const portMatch = props.match(/server-port=(\d+)/)
          if (portMatch) port = parseInt(portMatch[1], 10)
        }

        if (!activeProxies[id]) {
          activeProxies[id] = new WakeProxy(activeServers[id], port)
        }
        activeProxies[id].startListening()
      } else {
        if (activeProxies[id]) {
          activeProxies[id].stopListening()
          delete activeProxies[id]
        }
      }
      return true
    } catch (e: any) {
      console.error('WakeProxy error:', e)
      return false
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  ipcMain.handle('start-server', async (_, id) => {
    if (!activeServers[id]) {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      let game = 'Minecraft'
      try {
        const metaPath = join(serverDir, 'omnihost.json')
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
          if (meta.game) game = meta.game
        }
      } catch (e) {}

      if (game === 'DayZ') {
        activeServers[id] = new DayzAdapter(id)
      } else {
        activeServers[id] = new MinecraftAdapter(id)
      }
    }

    // CRITICAL: Stop proxy if it exists to free the port!
    if (activeProxies[id]) {
      activeProxies[id].stopListening()
    }

    await activeServers[id].start()
    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  ipcMain.handle('stop-server', async (_, id) => {
    if (activeServers[id]) {
      activeServers[id].stop()
      delete activeServers[id]
    }
    return true
  })

  // --- DayZ Config ---
  ipcMain.handle('read-dayz-config', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const cfgPath = join(serverDir, 'serverDZ.cfg')
    if (await exists(cfgPath)) {
      return await fsPromises.readFile(cfgPath, 'utf-8')
    }
    return null
  })

  ipcMain.handle('write-dayz-config', async (_, id, content) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const cfgPath = join(serverDir, 'serverDZ.cfg')
    if (await exists(cfgPath)) {
      await fsPromises.writeFile(cfgPath, content)
      return true
    }
    return false
  })

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
        
        // Find LootDamageMax
        const vars = globalsData.variables?.var || [];
        const damageMaxVar = vars.find((v: any) => v['@_name'] === 'LootDamageMax');
        if (damageMaxVar && damageMaxVar['@_value'] === '0.0') {
          pristineLoot = true;
        }
      }

      // For multipliers, since modifying them directly overwrites original values, 
      // we can't reliably read the "multiplier" from the XML alone unless we track it.
      // So we'll just return the pristine state, and default multipliers will be 1 on frontend.

      return { pristineLoot };
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
      if (await exists(typesPath)) {
        // Backup
        await fsPromises.copyFile(typesPath, `${typesPath}.bak_${Date.now()}`);
        
        const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: false });
        let typesData = parser.parse(await fsPromises.readFile(typesPath, 'utf-8'));
        
        // Read original values from a pristine backup if we have one to avoid compounding multipliers
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
        if (await exists(spawnablePath)) {
          // Backup
          await fsPromises.copyFile(spawnablePath, `${spawnablePath}.bak_${Date.now()}`);
          
          const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: false });
          let spawnData = parser.parse(await fsPromises.readFile(spawnablePath, 'utf-8'));
          
          const originalBackup = `${spawnablePath}.original`;
          if (!(await exists(originalBackup))) {
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
  });

  ipcMain.handle('wipe-dayz-loot', async (_, id) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const cfgPath = join(serverDir, 'serverDZ.cfg');
      if (!await exists(cfgPath)) return false;
      
      const cfg = await fsPromises.readFile(cfgPath, 'utf-8');
      const templateMatch = cfg.match(/template\s*=\s*"([^"]*)"/i);
      const template = templateMatch ? templateMatch[1] : 'dayzOffline.chernarusplus';
      
      if (activeServers[id]) {
        throw new Error('SERVER_IS_RUNNING');
      }

      const typesBinPath = join(serverDir, 'mpmissions', template, 'storage_1', 'data', 'types.bin');
      if (await exists(typesBinPath)) {
        await fsPromises.rm(typesBinPath, { force: true });
        return true;
      }
      return true; // Already wiped or doesn't exist
    } catch (e) {
      console.error('Failed to wipe DayZ loot', e);
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

  ipcMain.handle('get-workshop-item-details', async (_, modIds) => {
    return await SteamWebAPI.getWorkshopItemDetails(modIds);
  });

  ipcMain.handle('get-dayz-installed-mods', async (_, id) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
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
          if (parts.length === 2) {
            idStr = parts[0];
            title = parts[1];
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
  });

  ipcMain.handle('toggle-dayz-map-mod', async (_, id, folderName, isMap) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
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
  });

  ipcMain.handle('toggle-dayz-mod-status', async (_, id, folderName, isDisabled) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
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
  });

  async function fetchDayzMission(id: number, modId: string) {
    const repoInfo = DAYZ_MAP_REPOS[modId];
    if (!repoInfo || !repoInfo.repoZip) {
      throw new Error('No mission repository found for this map mod.');
    }
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    const mpmissionsDir = join(serverDir, 'mpmissions');
    
    if (!(await exists(mpmissionsDir))) {
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
      if (await exists(targetPath)) {
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
    if (await exists(cfgPath)) {
      let cfgContent = await fsPromises.readFile(cfgPath, 'utf-8');
      cfgContent = cfgContent.replace(/template\s*=\s*"[^"]*"/g, `template="${repoInfo.template}"`);
      await fsPromises.writeFile(cfgPath, cfgContent, 'utf-8');
    }
    
    return true;
  }

  ipcMain.handle('download-dayz-mission', async (_, id, modId) => {
    try {
      return await fetchDayzMission(id, modId);
    } catch (e: any) {
      console.error('Failed to download DayZ mission files', e);
      throw e;
    }
  });

  ipcMain.handle('extract-dayz-local-mission', async (_, id, localMissionsPath) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const mpmissionsDir = join(serverDir, 'mpmissions');
      
      if (!(await exists(mpmissionsDir))) {
        await fsPromises.mkdir(mpmissionsDir, { recursive: true });
      }

      // Read directories in localMissionsPath
      const entries = await fsPromises.readdir(localMissionsPath, { withFileTypes: true });
      let firstTemplate = '';
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sourcePath = join(localMissionsPath, entry.name);
          const destPath = join(mpmissionsDir, entry.name);
          
          if (await exists(destPath)) {
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
        if (await exists(cfgPath)) {
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
  });

  ipcMain.handle('select-workshop-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select DayZ Game Folder'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('import-local-workshop', async (_, id, workshopPath) => {
    try {
      let actualWorkshopPath = workshopPath;
      if (!actualWorkshopPath.endsWith('!Workshop') && !actualWorkshopPath.endsWith('!workshop')) {
        actualWorkshopPath = join(actualWorkshopPath, '!Workshop');
      }

      if (!(await exists(actualWorkshopPath))) {
        throw new Error(`Could not find !Workshop folder at ${actualWorkshopPath}. Make sure you selected the correct DayZ directory.`);
      }

      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
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
  });

  ipcMain.handle('install-dayz-mod', async (_, id, modId, modTitle, username, password, steamGuardCode) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const appId = 221100;

      // 1. Download via SteamCMD
      await SteamCMDManager.downloadWorkshopItem(id, appId, modId, username, password, steamGuardCode);

      // 2. Copy mod folder from SteamCMD cache to server dir
      const steamCmdDir = SteamCMDManager.getSteamCMDDir();
      const workshopModDir = join(steamCmdDir, 'steamapps', 'workshop', 'content', appId.toString(), modId);
      
      if (!(await exists(workshopModDir))) {
        throw new Error('Mod folder not found after download');
      }

      // Safe folder name (e.g. @CF)
      const safeTitle = modTitle.replace(/[^a-zA-Z0-9]/g, '');
      const folderName = `@${safeTitle || modId}`;
      const targetModDir = join(serverDir, folderName);

      SteamCMDManager.sendLog(id, 100, `Copying ${folderName} to server...`);
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
          SteamCMDManager.sendLog(id, 100, `Fetching mission files for ${modTitle}...`);
          await fetchDayzMission(id, modId);
          SteamCMDManager.sendLog(id, 100, `Mission files downloaded and server configured!`);
        } catch (e) {
          console.warn(`Could not fetch auto mission files for ${modId}`, e);
        }
      }

      return true;
    } catch (e: any) {
      console.error('Failed to install DayZ mod', e);
      throw e;
    }
  });

  ipcMain.handle('uninstall-dayz-mod', async (_, id, modIdOrFolder) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      
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
  });
  // --- File System Operations ---
  
  const getServerPath = (serverId: number, relativePath: string) => {
    const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
    const safePath = join(serverDir, relativePath);
    // Basic directory traversal protection
    if (!safePath.startsWith(serverDir)) {
      throw new Error('Access denied');
    }
    return safePath;
  };

  ipcMain.handle('fs-list-dir', async (_, serverId, dirPath) => {
    try {
      const fullPath = getServerPath(serverId, dirPath || '');
      if (!(await exists(fullPath))) return [];

      const entries = await fsPromises.readdir(fullPath, { withFileTypes: true });
      const files = await Promise.all(entries.map(async (entry) => {
        const entryPath = join(fullPath, entry.name);
        const stats = await fsPromises.stat(entryPath);
        return {
          name: entry.name,
          isDirectory: entry.isDirectory(),
          size: stats.size,
          mtime: stats.mtime.toISOString(),
        };
      }));

      // Sort directories first, then alphabetically
      return files.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });
    } catch (e) {
      console.error('Failed to list directory', e);
      return [];
    }
  });

  ipcMain.handle('fs-read-file', async (_, serverId, filePath) => {
    try {
      const fullPath = getServerPath(serverId, filePath);
      return await fsPromises.readFile(fullPath, 'utf-8');
    } catch (e) {
      console.error('Failed to read file', e);
      throw e;
    }
  });

  ipcMain.handle('fs-write-file', async (_, serverId, filePath, content) => {
    try {
      const fullPath = getServerPath(serverId, filePath);
      await fsPromises.writeFile(fullPath, content, 'utf-8');
      return true;
    } catch (e) {
      console.error('Failed to write file', e);
      throw e;
    }
  });

  ipcMain.handle('fs-delete', async (_, serverId, itemPath) => {
    try {
      const fullPath = getServerPath(serverId, itemPath);
      await fsPromises.rm(fullPath, { recursive: true, force: true });
      return true;
    } catch (e) {
      console.error('Failed to delete item', e);
      throw e;
    }
  });

  ipcMain.handle('fs-create-folder', async (_, serverId, folderPath) => {
    try {
      const fullPath = getServerPath(serverId, folderPath);
      await fsPromises.mkdir(fullPath, { recursive: true });
      return true;
    } catch (e) {
      console.error('Failed to create folder', e);
      throw e;
    }
  });
}
