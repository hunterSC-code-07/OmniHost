import { dialog, BrowserWindow } from 'electron'
import type { OpenDialogOptions } from 'electron'
import { handleTrusted } from '../security/ipcSecurity'
const ipcMain = { handle: handleTrusted }
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import os from 'os'
import { resolveServerPath } from '../security/serverPath'
import { serverStorage } from '../storage/ServerStorage'
import { discordBotSettings } from '../discord/DiscordBotSettings'
import { discordBot } from '../discord/DiscordBot'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export function registerSystemIpc(activeServers: Record<number, any>, getServers: () => any[]) {
  // Discord IPCs
  ipcMain.handle('discord-get-settings', () => discordBotSettings.readSettings())
  
  ipcMain.handle('discord-set-token', (_, token: string) => {
    return discordBotSettings.setToken(token)
  })

  ipcMain.handle('discord-set-auto-start', (_, autoStart: boolean) => {
    return discordBotSettings.setAutoStart(autoStart)
  })

  ipcMain.handle('discord-start-bot', async (_, token: string) => {
    await discordBot.start(token)
    return discordBot.isRunning()
  })

  ipcMain.handle('discord-stop-bot', async () => {
    await discordBot.stop()
    return false
  })

  ipcMain.handle('discord-get-status', () => discordBot.isRunning())

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-system-info', () => {
    return {
      totalMem: os.totalmem(),
      cpus: os.cpus().length
    }
  })

  ipcMain.handle('get-server-storage', () => serverStorage.getInfo())

  ipcMain.handle('select-server-storage', async (event) => {
    const currentStorage = serverStorage.getInfo()
    const browserWindow = BrowserWindow.fromWebContents(event.sender)
    const options: OpenDialogOptions = {
      title: 'Choose Server Instances Folder',
      buttonLabel: 'Use This Folder',
      defaultPath: currentStorage.path,
      properties: ['openDirectory', 'createDirectory']
    }
    const result = browserWindow
      ? await dialog.showOpenDialog(browserWindow, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) return null
    return serverStorage.setPath(result.filePaths[0])
  })

  ipcMain.handle('reset-server-storage', () => {
    return serverStorage.resetPath()
  })

  ipcMain.handle('select-custom-boot-sound', async (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender)
    const options: OpenDialogOptions = {
      title: 'Select Custom Boot Sound',
      properties: ['openFile'],
      filters: [{ name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'ogg', 'aac'] }]
    }

    const result = browserWindow
      ? await dialog.showOpenDialog(browserWindow, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) return false
    
    const { app } = require('electron')
    const dest = join(app.getPath('userData'), 'custom-boot-sound')
    await fsPromises.copyFile(result.filePaths[0], dest)
    return true
  })

  ipcMain.handle('get-custom-boot-sound', async () => {
    const { app } = require('electron')
    const dest = join(app.getPath('userData'), 'custom-boot-sound')
    if (await exists(dest)) {
      return await fsPromises.readFile(dest)
    }
    return null
  })

  ipcMain.handle('clear-custom-boot-sound', async () => {
    const { app } = require('electron')
    const dest = join(app.getPath('userData'), 'custom-boot-sound')
    if (await exists(dest)) {
      await fsPromises.unlink(dest)
    }
    return true
  })


  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('update-server-meta', async (_, id, changes) => {
    const serverDir = join(serverStorage.getPath(), id.toString())
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
    const serverDir = join(serverStorage.getPath(), id.toString())
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
    const serverDir = join(serverStorage.getPath(), id.toString())
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

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  ipcMain.handle('read-config', async (_, id) => {
    const serverDir = join(serverStorage.getPath(), id.toString())
    let configName = 'server.properties'
    let customPath = ''
    try {
      const meta = JSON.parse(await fsPromises.readFile(join(serverDir, 'omnihost.json'), 'utf-8'))
      if (meta.game === 'DayZ') configName = 'serverDZ.cfg'
      if (meta.game === 'The Forest')
        customPath = join(
          os.homedir(),
          'AppData',
          'LocalLow',
          'SKS',
          'TheForestDedicatedServer',
          'ds',
          'Server.cfg'
        )
    } catch (e) {}

    const configPath = customPath || join(serverDir, configName)
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
    const serverDir = join(serverStorage.getPath(), id.toString())
    if (!(await exists(serverDir))) await fsPromises.mkdir(serverDir, { recursive: true })

    let configName = 'server.properties'
    let customPath = ''
    try {
      const meta = JSON.parse(await fsPromises.readFile(join(serverDir, 'omnihost.json'), 'utf-8'))
      if (meta.game === 'DayZ') configName = 'serverDZ.cfg'
      if (meta.game === 'The Forest') {
        const forestDir = join(
          os.homedir(),
          'AppData',
          'LocalLow',
          'SKS',
          'TheForestDedicatedServer',
          'ds'
        )
        if (!(await exists(forestDir))) await fsPromises.mkdir(forestDir, { recursive: true })
        customPath = join(forestDir, 'Server.cfg')
      }
    } catch (e) {}

    const configPath = customPath || join(serverDir, configName)
    await fsPromises.writeFile(configPath, data)
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
    const safeFilename = validateDataFileName(filename)
    const filePath = await resolveServerPath(id, `${safeFilename}.json`)
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
    const safeFilename = validateDataFileName(filename)
    const filePath = await resolveServerPath(id, `${safeFilename}.json`)
    await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2))
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

  ipcMain.handle('get-inventory', async (_, id, playerName) => {
    if (activeServers[id] && typeof activeServers[id].getInventory === 'function') {
      try {
        return await activeServers[id].getInventory(playerName)
      } catch (e) {
        console.error('Error fetching inventory:', e)
        return null
      }
    }
    return null
  })

  ipcMain.handle('get-player-nbt-stats', async (_, id, playerName) => {
    if (activeServers[id] && typeof activeServers[id].getPlayerNbtStats === 'function') {
      try {
        return await activeServers[id].getPlayerNbtStats(playerName)
      } catch (e) {
        console.error('Error fetching NBT stats:', e)
        return null
      }
    }
    return null
  })

  ipcMain.handle('edit-player-nbt', async (_, id, playerName, stats) => {
    if (activeServers[id] && typeof activeServers[id].editPlayerNbt === 'function') {
      try {
        return await activeServers[id].editPlayerNbt(playerName, stats)
      } catch (e) {
        console.error('Error editing NBT stats:', e)
        return false
      }
    }
    return false
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
      const serverDir = join(serverStorage.getPath(), id.toString())
      const backupsDir = join(serverDir, 'backups')
      if (!fs.existsSync(backupsDir)) {
        await fsPromises.mkdir(backupsDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const requestedName = typeof name === 'string' ? name.replace(/[^a-zA-Z0-9_-]/g, '') : ''
      const safeName = requestedName || 'backup'
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
      throw e instanceof Error ? e : new Error((e as any)?.message || String(e))
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
    const serverDir = join(serverStorage.getPath(), id.toString())
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
      const serverDir = join(serverStorage.getPath(), id.toString())
      const backupPath = await resolveServerPath(
        id,
        join('backups', validateBackupFilename(filename))
      )

      if (!fs.existsSync(backupPath)) throw new Error('Backup file not found')

      const worldFolders = ['world', 'world_nether', 'world_the_end']
      for (const folder of worldFolders) {
        const folderPath = join(serverDir, folder)
        if (fs.existsSync(folderPath)) {
          await fsPromises.rm(folderPath, { recursive: true, force: true })
        }
      }

      const AdmZip = require('adm-zip')
      const zip = new AdmZip(backupPath)
      for (const entry of zip.getEntries()) {
        const normalized = entry.entryName.replace(/\\/g, '/')
        if (
          normalized.startsWith('/') ||
          normalized.split('/').includes('..') ||
          !['world', 'world_nether', 'world_the_end'].includes(normalized.split('/')[0])
        ) {
          throw new Error(`Unsafe path in backup: ${entry.entryName}`)
        }
      }
      zip.extractAllTo(serverDir, true)
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
    const backupPath = await resolveServerPath(
      id,
      join('backups', validateBackupFilename(filename))
    )
    if (fs.existsSync(backupPath)) {
      await fsPromises.unlink(backupPath)
      return true
    }
    return false
  })

  ipcMain.handle('delete-all-backups', async (_, id) => {
    const serverDir = join(serverStorage.getPath(), id.toString())
    const backupsDir = join(serverDir, 'backups')
    if (!fs.existsSync(backupsDir)) return true

    const files = await fsPromises.readdir(backupsDir, { withFileTypes: true })
    await Promise.all(
      files
        .filter((entry) => entry.isFile() && entry.name.endsWith('.zip'))
        .map((entry) => fsPromises.unlink(join(backupsDir, entry.name)))
    )
    return true
  })
}

function validateDataFileName(filename: unknown): string {
  if (typeof filename !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(filename)) {
    throw new Error('Invalid data filename')
  }
  return filename
}

function validateBackupFilename(filename: unknown): string {
  if (typeof filename !== 'string' || !/^[a-zA-Z0-9_-]+_[0-9TZ-]+\.zip$/.test(filename)) {
    throw new Error('Invalid backup filename')
  }
  return filename
}
