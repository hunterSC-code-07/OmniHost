import { app, ipcMain } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
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
}
