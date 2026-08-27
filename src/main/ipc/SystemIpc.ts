import { app, ipcMain } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import os from 'os'
import { FrpAdapter } from '../adapters/FrpAdapter'
import { RadminVpnAdapter } from '../adapters/RadminVpnAdapter'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export function registerSystemIpc(
  tunnelProvider: FrpAdapter,
  radminVpnProvider: RadminVpnAdapter,
  activeServers: Record<number, any>,
  getServers: () => any[]
) {
  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-system-info', () => {
    return {
      totalMem: os.totalmem(),
      cpus: os.cpus().length
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('update-server-meta', async (_, id, changes) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const metaPath = join(serverDir, 'omnihost.json')
    let meta = {}
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      } catch (e) {}
    }
    meta = { ...meta, ...changes }
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))

    // Live update the running instance
    if (activeServers[id]) {
      activeServers[id].omnihostMeta = meta
    }
    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-player-stats', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const statsPath = join(serverDir, 'player-stats.json')
    if (fs.existsSync(statsPath)) {
      try {
        return JSON.parse(fs.readFileSync(statsPath, 'utf-8'))
      } catch (e) {
        return {}
      }
    }
    return {}
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-server-meta', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const metaPath = join(serverDir, 'omnihost.json')
    let meta: any = null
    if (await exists(metaPath)) {
      try {
        meta = JSON.parse(await fsPromises.readFile(metaPath, 'utf-8'))
      } catch (e) {}
    }
    
    // Fallback if omnihost.json is missing or missing type
    if (!meta || !meta.type) {
       const servers = getServers()
       const srv = servers.find((s: any) => s.id === id)
       if (srv) {
          if (!meta) meta = {}
          meta.version = '1.20.4' // Default version if missing
          if (srv.game) {
             const typeMatch = srv.game.match(/\((.*?)\)/)
             if (typeMatch) meta.type = typeMatch[1]
             else meta.type = 'Vanilla'
          } else {
             meta.type = 'Vanilla'
          }
       }
    }
    return meta
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  ipcMain.handle('start-tunnel', async (_, data: { ip: string, game: string }) => {
    await tunnelProvider.start(data.ip, data.game)
    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  ipcMain.handle('stop-tunnel', async () => {
    tunnelProvider.stop()
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  ipcMain.handle('get-tunnel-status', () => {
    return tunnelProvider.process ? 'Online' : 'Offline'
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  ipcMain.handle('radmin-check', () => {
    return radminVpnProvider.isInstalled()
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  ipcMain.handle('radmin-install', () => {
    radminVpnProvider.install()
    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  ipcMain.handle('radmin-open', async () => {
    return await radminVpnProvider.open()
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  ipcMain.handle('radmin-get-ip', async () => {
    return await radminVpnProvider.getIp()
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  ipcMain.handle('read-config', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    let configName = 'server.properties'
    try {
      const meta = JSON.parse(await fsPromises.readFile(join(serverDir, 'omnihost.json'), 'utf-8'))
      if (meta.game === 'DayZ') configName = 'serverDZ.cfg'
    } catch (e) {}

    const configPath = join(serverDir, configName)
    if (await exists(configPath)) return await fsPromises.readFile(configPath, 'utf-8')
    return `# No ${configName} found.\n# Start the server once to generate this file automatically!`
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  ipcMain.handle('write-config', async (_, id, data) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    if (!(await exists(serverDir))) await fsPromises.mkdir(serverDir, { recursive: true })

    let configName = 'server.properties'
    try {
      const meta = JSON.parse(await fsPromises.readFile(join(serverDir, 'omnihost.json'), 'utf-8'))
      if (meta.game === 'DayZ') configName = 'serverDZ.cfg'
    } catch (e) {}

    await fsPromises.writeFile(join(serverDir, configName), data)
    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  ipcMain.handle('read-json', async (_, id, filename) => {
    const filePath = join(app.getPath('userData'), 'servers', id.toString(), `${filename}.json`)
    if (await exists(filePath)) return JSON.parse(await fsPromises.readFile(filePath, 'utf-8'))
    return []
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  ipcMain.handle('write-json', async (_, id, filename, data) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    if (!(await exists(serverDir))) await fsPromises.mkdir(serverDir, { recursive: true })
    await fsPromises.writeFile(join(serverDir, `${filename}.json`), JSON.stringify(data, null, 2))
    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  ipcMain.handle('send-command', async (_, id, cmd) => {
    if (activeServers[id]) activeServers[id].sendCommand(cmd)
    return true
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  // --- File Manager ---
  ipcMain.handle('list-dir', async (_, id, relPath) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      // Prevent directory traversal
      const targetPath = join(serverDir, relPath)
      if (!targetPath.startsWith(serverDir)) return []

      if (!(await exists(targetPath))) return []

      const files = await fsPromises.readdir(targetPath)
      const result: any[] = []
      for (const f of files) {
        try {
          const stat = await fsPromises.stat(join(targetPath, f))
          result.push({
            name: f,
            isDirectory: stat.isDirectory(),
            size: stat.size,
            lastModified: stat.mtimeMs
          })
        } catch (e) {}
      }
      return result
    } catch (e: any) {
      console.error(e.message)
      return []
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  // --- File Manager ---
  ipcMain.handle('delete-item', async (_, id, relPath) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const targetPath = join(serverDir, relPath)
      if (!targetPath.startsWith(serverDir)) return false

      const stat = await fsPromises.stat(targetPath)
      if (stat.isDirectory()) {
        await fsPromises.rm(targetPath, { recursive: true, force: true })
      } else {
        await fsPromises.unlink(targetPath)
      }
      return true
    } catch (e: any) {
      console.error(e.message)
      return false
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  // --- File Manager ---
  ipcMain.handle('read-file', async (_, id, relPath) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const targetPath = join(serverDir, relPath)
      if (!targetPath.startsWith(serverDir)) return null

      if (!(await exists(targetPath))) return null
      return await fsPromises.readFile(targetPath, 'utf-8')
    } catch (e: any) {
      console.error(e.message)
      return null
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  // --- File Manager ---
  ipcMain.handle('write-file', async (_, id, relPath, content) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const targetPath = join(serverDir, relPath)
      if (!targetPath.startsWith(serverDir)) return false

      await fsPromises.writeFile(targetPath, content)
      return true
    } catch (e: any) {
      console.error(e.message)
      return false
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  // --- File Manager ---
  // --- Backups ---
  ipcMain.handle('create-backup', async (_, id, name) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const backupsDir = join(serverDir, 'backups')
      if (!fs.existsSync(backupsDir)) {
        await fsPromises.mkdir(backupsDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const safeName = name ? name.replace(/[^a-zA-Z0-9_-]/g, '') : 'backup'
      const backupName = `${safeName}_${timestamp}.zip`
      const backupPath = join(backupsDir, backupName)

      const AdmZip = require('adm-zip')
      const zip = new AdmZip()
      const worldFolders = ['world', 'world_nether', 'world_the_end']

      let addedSomething = false
      for (const folder of worldFolders) {
        const folderPath = join(serverDir, folder)
        if (fs.existsSync(folderPath)) {
          zip.addLocalFolder(folderPath, folder)
          addedSomething = true
        }
      }

      if (addedSomething) {
        zip.writeZip(backupPath)
        return true
      }
      return false
    } catch (e: any) {
      console.error('Backup error:', e.message)
      throw e instanceof Error ? e : new Error((e as any)?.message || String(e));
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  // --- File Manager ---
  // --- Backups ---
  ipcMain.handle('get-backups', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const backupsDir = join(serverDir, 'backups')
    if (!fs.existsSync(backupsDir)) return []

    const files = await fsPromises.readdir(backupsDir)
    const result: any[] = []
    for (const f of files) {
      if (f.endsWith('.zip')) {
        const stat = await fsPromises.stat(join(backupsDir, f))
        result.push({
          name: f,
          size: stat.size,
          date: stat.mtimeMs
        })
      }
    }
    return result.sort((a, b) => b.date - a.date)
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  // --- File Manager ---
  // --- Backups ---
  ipcMain.handle('restore-backup', async (_, id, filename) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const backupPath = join(serverDir, 'backups', filename)

      if (!fs.existsSync(backupPath)) throw new Error('Backup file not found')

      const worldFolders = ['world', 'world_nether', 'world_the_end']
      for (const folder of worldFolders) {
        const folderPath = join(serverDir, folder)
        if (fs.existsSync(folderPath)) {
          await fsPromises.rm(folderPath, { recursive: true, force: true })
        }
      }

      const extractZip = require('extract-zip')
      await extractZip(backupPath, { dir: serverDir })
      return true
    } catch (e: any) {
      console.error('Restore error:', e.message)
      throw e
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  // --- File Manager ---
  // --- Backups ---
  ipcMain.handle('delete-backup', async (_, id, filename) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const backupPath = join(serverDir, 'backups', filename)
    if (fs.existsSync(backupPath)) {
      await fsPromises.unlink(backupPath)
      return true
    }
    return false
  })
}
