import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import pidusage from 'pidusage'

export class TerrariaProcessManager {
  serverId: number
  serverDir: string
  process: ChildProcess | null = null
  serverPid: number | null = null
  onlinePlayers: string[] = []
  logHistory: string[] = []
  omnihostMeta: any = {}

  private statsTimer: NodeJS.Timeout | null = null

  constructor(serverId: number) {
    this.serverId = serverId
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString())
  }

  sendLog(msg: string) {
    console.log(msg)
    this.logHistory.push(msg)
    if (this.logHistory.length > 2000) this.logHistory.shift()
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) win.webContents.send('console-log', { id: this.serverId, msg })
    })
  }

  sendPlayerUpdate() {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed())
        win.webContents.send('online-players', { id: this.serverId, players: this.onlinePlayers })
    })
  }

  sendCommand(cmd: string) {
    this.sendLog(`> ${cmd}`)
    if (this.process && this.process.stdin) {
      this.process.stdin.write(cmd + '\\n')
    }
  }

  async start() {
    if (this.process) return

    this.logHistory = []
    this.onlinePlayers = []
    this.sendPlayerUpdate()
    
    this.sendLog('[System] Starting Terraria Server...')

    const exePath = join(this.serverDir, 'TerrariaServer.exe')
    if (!fs.existsSync(exePath)) {
      this.sendLog(`[System Error] Executable not found at ${exePath}`)
      return
    }

    const configPath = join(this.serverDir, 'serverconfig.txt')
    const worldsDir = join(this.serverDir, 'worlds');
    if (!fs.existsSync(worldsDir)) fs.mkdirSync(worldsDir, { recursive: true });
    const worldFile = join(worldsDir, 'World1.wld');

    let needsConfig = !fs.existsSync(configPath)
    let content = ''
    if (!needsConfig) {
      content = fs.readFileSync(configPath, 'utf8')
      if (content.trim().length === 0) {
        needsConfig = true
      }
    }

    if (needsConfig) {
      this.sendLog('[System] Creating default serverconfig.txt...')
      content = `autocreate=2
world=${worldFile}
worldname=OmniHost World
difficulty=0
maxplayers=8
port=7777
password=
motd=Powered by OmniHost
worldpath=${worldsDir}
banlist=banlist.txt`
      fs.writeFileSync(configPath, content)
    } else {
      // Ensure world path is explicitly defined to bypass interactive prompt
      let updated = false
      if (!content.includes('world=')) {
        content += `\nworld=${worldFile}`
        updated = true
      }
      if (!content.includes('worldpath=')) {
        content += `\nworldpath=${worldsDir}`
        updated = true
      }
      if (!content.includes('autocreate=')) {
        content += `\nautocreate=2`
        updated = true
      }
      if (updated) {
        fs.writeFileSync(configPath, content)
      }
    }
    
    const args = ['-config', configPath]

    this.process = spawn(exePath, args, { cwd: this.serverDir })
    this.serverPid = this.process.pid || null

    if (this.process.stdout) {
      this.process.stdout.on('data', (data: Buffer) => {
        const text = data.toString()
        const lines = text.split('\\n')
        for (let line of lines) {
          line = line.replace(/\\r/g, '').trim()
          if (!line) continue
          this.sendLog(`[Terraria] ${line}`)
          this.parseLogLine(line)
        }
      })
    }

    if (this.process.stderr) {
      this.process.stderr.on('data', (data: Buffer) => {
        const errorText = data.toString().trim()
        this.sendLog(`[Terraria Error] ${errorText}`)
        
        if (errorText.includes('Microsoft.Xna.Framework')) {
          this.sendLog('[System Error] Microsoft XNA Framework 4.0 is required to run the Terraria server.')
          this.sendLog('[System Error] Please download and install it from: https://www.microsoft.com/en-us/download/details.aspx?id=20914')
        }
      })
    }

    this.process.on('close', (code) => {
      this.sendLog(`[System] Terraria Server stopped (Code: ${code})`)
      this.process = null
      this.serverPid = null
      this.onlinePlayers = []
      this.sendPlayerUpdate()
      if (this.statsTimer) {
        clearInterval(this.statsTimer)
        this.statsTimer = null
      }
    })

    this.process.on('error', (err) => {
      this.sendLog(`[System Error] ${err.message}`)
    })

    this.startStatsTimer()
  }

  parseLogLine(line: string) {
    // Player connected: "[Name] has joined."
    const joinMatch = line.match(/^(.+) has joined\\.$/)
    if (joinMatch) {
      const name = joinMatch[1].trim()
      if (!this.onlinePlayers.includes(name)) {
        this.onlinePlayers.push(name)
        this.sendPlayerUpdate()
      }
    }

    // Player disconnected: "[Name] has left."
    const leaveMatch = line.match(/^(.+) has left\\.$/)
    if (leaveMatch) {
      const name = leaveMatch[1].trim()
      this.onlinePlayers = this.onlinePlayers.filter(p => p !== name)
      this.sendPlayerUpdate()
    }
  }

  stop() {
    if (this.process) {
      this.sendLog('[System] Stopping Terraria Server...')
      if (this.process.stdin) {
        this.process.stdin.write('exit\\n')
      }
    }
  }

  startStatsTimer() {
    if (this.statsTimer) clearInterval(this.statsTimer)
    this.statsTimer = setInterval(async () => {
      if (this.serverPid) {
        try {
          const stats = await pidusage(this.serverPid)
          BrowserWindow.getAllWindows().forEach((win) => {
            if (!win.isDestroyed())
              win.webContents.send('server-stats', {
                id: this.serverId,
                cpu: stats.cpu,
                ram: stats.memory
              })
          })
        } catch (e) {
          // Process might have exited between checks
        }
      }
    }, 2000)
  }
}
