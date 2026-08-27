import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import { DayzModGraph } from '../adapters/DayzModGraph'
import { DayzLogParser } from '../adapters/DayzLogParser'
import { DayzConfigManager } from './DayzConfigManager'

export class DayzProcessManager {
  serverId: number
  serverDir: string
  process: ChildProcess | null = null
  onlinePlayers: string[] = []
  logHistory: string[] = []
  omnihostMeta: Record<string, unknown> = {}

  private logParser: DayzLogParser | null = null

  constructor(serverId: number) {
    this.serverId = serverId
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString())
  }

  sendLog(msg: string): void {
    console.log(msg) // Guaranteed VS Code output!
    this.logHistory.push(msg)
    if (this.logHistory.length > 2000) this.logHistory.shift()
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) win.webContents.send('console-log', { id: this.serverId, msg })
    })
  }

  sendPlayerUpdate(): void {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed())
        win.webContents.send('online-players', { id: this.serverId, players: this.onlinePlayers })
    })
  }

  sendCommand(cmd: string): void {
    // Basic implementation (later use RCon/BEC for DayZ)
    this.sendLog(
      `[System] Sending commands to DayZ requires RCon setup (not yet implemented). Command: ${cmd}`
    )
  }

  async start(): Promise<void> {
    await DayzConfigManager.ensureDefaultConfig(this.serverDir)

    const exePath = join(this.serverDir, 'DayZServer_x64.exe')
    if (!fs.existsSync(exePath)) {
      this.sendLog(
        `[System] DayZ Server executable not found at ${exePath}. Did you finish the SteamCMD download?`
      )
      return
    }

    this.sendLog('[System] Starting DayZ Server...')

    const args = [
      '-config=serverDZ.cfg',
      '-port=2302',
      '-profiles=Profiles',
      '-BEpath=BattlEye',
      '-dologs',
      '-adminlog',
      '-netlog',
      '-freezecheck'
    ]

    // Load mods
    try {
      const sortedMods = DayzModGraph.resolveMods(this.serverDir)

      if (sortedMods.length > 0) {
        args.push(`"-mod=${sortedMods.join(';')}"`)
        this.sendLog(`[System] Loading mods: ${sortedMods.join(', ')}`)
      }
    } catch (e) {
      this.sendLog(`[System Error] Failed to load mods: ${e}`)
    }

    const startTime = Date.now() - 5000 // Buffer of 5 seconds

    this.process = spawn(`"${exePath}"`, args, { cwd: this.serverDir, shell: true })

    this.process.stdout?.on('data', (data) => {
      this.sendLog(`[DayZ] ${data.toString().trim()}`)
    })

    this.process.stderr?.on('data', (data) => {
      this.sendLog(`[DayZ Error] ${data.toString().trim()}`)
    })

    this.logParser = new DayzLogParser(
      this.serverDir,
      startTime,
      (msg) => this.sendLog(msg),
      (playerName, isConnected) => {
        if (isConnected && !this.onlinePlayers.includes(playerName)) {
          this.onlinePlayers.push(playerName)
          this.sendPlayerUpdate()
        } else if (!isConnected) {
          this.onlinePlayers = this.onlinePlayers.filter((p) => p !== playerName)
          this.sendPlayerUpdate()
        }
      }
    )

    this.logParser.setupLogWatcher(this.process)

    this.process.on('close', (code) => {
      this.sendLog(`[System] DayZ Server stopped (Code: ${code})`)
      this.logParser?.cleanup()
      this.process = null
      this.onlinePlayers = []
      this.sendPlayerUpdate()
    })

    this.process.on('error', (err) => {
      this.sendLog(`[System Error] ${err.message}`)
    })
  }

  stop(): void {
    if (this.process) {
      this.sendLog('[System] Stopping DayZ Server...')
      if (this.process.pid) {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', this.process.pid.toString(), '/f', '/t'])
        } else {
          this.process.kill()
        }
      }
      this.process = null
      this.logParser?.cleanup()
    }

    this.onlinePlayers = []
    this.sendPlayerUpdate()
  }
}
