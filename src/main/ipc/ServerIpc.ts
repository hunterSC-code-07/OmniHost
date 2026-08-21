import { app, ipcMain } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { getServers, createServer, deleteServer, updateServerSoftware } from '../db'
import { DayzAdapter } from '../adapters/DayzAdapter'
import { MinecraftAdapter } from '../adapters/MinecraftAdapter'
import { WakeProxy } from '../adapters/WakeProxy'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

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
}
