import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app } from 'electron'
import fs from 'fs'
import { MinecraftCommandBuilder } from './MinecraftCommandBuilder'
import pidusage from 'pidusage'
import { MinecraftConfigManager } from './MinecraftConfigManager'
import { MinecraftPlayerManager } from './MinecraftPlayerManager'
import { minecraftEventBus } from './MinecraftEventBus'

export class MinecraftProcessManager {
  serverId: number
  serverDir: string
  process: ChildProcess | null = null
  playerManager: MinecraftPlayerManager
  autoStopTimer: NodeJS.Timeout | null = null
  statsTimer: NodeJS.Timeout | null = null
  omnihostMeta: any = {}
  javaPid: number | null = null
  isFullyStarted: boolean = false
  logHistory: string[] = []
  logBuffer: string[] = []
  logFlushTimer: NodeJS.Timeout | null = null
  private launchSequence = 0

  constructor(serverId: number) {
    this.serverId = serverId
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString())
    this.playerManager = new MinecraftPlayerManager(serverId, this.serverDir)
  }

  get onlinePlayers(): string[] {
    return this.playerManager.getOnlinePlayers()
  }

  private clearAutoStopTimer(): void {
    if (this.autoStopTimer) clearTimeout(this.autoStopTimer)
    this.autoStopTimer = null
  }

  private scheduleAutoStop(): void {
    this.clearAutoStopTimer()
    if (!this.omnihostMeta.autoStop || this.onlinePlayers.length > 0 || !this.process) return
    this.autoStopTimer = setTimeout(
      () => {
        if (this.process && this.onlinePlayers.length === 0) {
          this.sendLog('[System] No players for 10 minutes. Auto-stopping server...')
          void this.stop()
        }
      },
      10 * 60 * 1000
    )
  }

  sendLog(msg: string) {
    console.log(msg) // Guaranteed VS Code output!
    this.logHistory.push(msg)
    if (this.logHistory.length > 2000) this.logHistory.shift()

    this.logBuffer.push(msg)
    if (!this.logFlushTimer) {
      this.logFlushTimer = setTimeout(() => {
        const msgs = [...this.logBuffer]
        this.logBuffer = []
        this.logFlushTimer = null
        if (msgs.length > 0) {
          const batchedMsg = msgs.join('\n')
          minecraftEventBus.emit('console-log', this.serverId, batchedMsg)
        }
      }, 50)
    }
  }

  sendCommand(cmd: string) {
    if (this.process && this.process.stdin) {
      this.process.stdin.write(cmd + '\n')
      this.sendLog(`> ${cmd}`)
    } else {
      this.sendLog(`[System] Cannot send command: Server is offline.`)
    }
  }

  private getActualPid(): Promise<number> {
    return new Promise((resolve) => {
      const proc = this.process
      if (!proc || !proc.pid) return resolve(0)
      if (this.javaPid) return resolve(this.javaPid)
      if (process.platform !== 'win32') return resolve(proc.pid)

      const { spawn } = require('child_process')
      const ps = spawn('powershell', ['-NoProfile', '-Command', '-'])

      let out = ''
      ps.stdout.on('data', (data: any) => (out += data.toString()))

      ps.on('close', () => {
        const pid = parseInt(out.trim())
        if (!isNaN(pid) && pid > 0) {
          this.javaPid = pid
          resolve(pid)
        } else {
          resolve(proc.pid!)
        }
      })

      const script = `
        $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name
        $target = ${proc.pid}
        $children = @{}
        foreach ($p in $all) {
            $parentId = [string]$p.ParentProcessId
            if (-not $children.ContainsKey($parentId)) {
                $children[$parentId] = @()
            }
            $children[$parentId] += $p
        }
        $queue = [System.Collections.Generic.Queue[string]]::new()
        $queue.Enqueue([string]$target)
        $found = 0
        while ($queue.Count -gt 0) {
            $curr = $queue.Dequeue()
            if ($children.ContainsKey($curr)) {
                foreach ($c in $children[$curr]) {
                    if ($c.Name -match 'java') {
                        $found = $c.ProcessId
                        break
                    }
                    $queue.Enqueue($c.ProcessId)
                }
            }
            if ($found -ne 0) { break }
        }
        Write-Output $found
      `
      ps.stdin.write(script)
      ps.stdin.end()
    })
  }

  async start(): Promise<void> {
    if (this.process) throw new Error(`Server ${this.serverId} is already running or starting`)

    await MinecraftConfigManager.init(this.serverDir)
    this.playerManager.clearOnlinePlayers()
    this.logHistory = []
    this.isFullyStarted = false
    this.playerManager.sendPlayerUpdate()

    this.sendLog(`[System] Starting Server ${this.serverId}...`)

    const metaPath = join(this.serverDir, 'omnihost.json')
    if (fs.existsSync(metaPath)) {
      try {
        this.omnihostMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      } catch (e) {}
    }

    const command = await MinecraftCommandBuilder.buildCommand(this.serverDir, (msg) =>
      this.sendLog(msg)
    )
    if (!command) throw new Error('Unable to build the Minecraft server command')

    const { targetExecutable, targetArgs, env } = command

    this.sendLog(`[System] Launching Java with args: ${targetArgs.join(' ')}`)
    const launchId = ++this.launchSequence
    const launchedProcess = spawn(targetExecutable, targetArgs, { cwd: this.serverDir, env })
    this.process = launchedProcess
    this.javaPid = null

    if (launchedProcess.pid) {
      this.statsTimer = setInterval(async () => {
        if (!this.process || !this.process.pid) return
        try {
          const actualPid = await this.getActualPid()
          if (actualPid === 0) return
          const stats = await pidusage(actualPid)
          minecraftEventBus.emit('server-stats', this.serverId, stats.cpu, stats.memory)
        } catch (e: any) {
          // PID might not exist anymore (e.g. temporary java check process finished)
          this.sendLog(`[System Error Debug] Stats error: ${e.message}`)
          this.javaPid = null
        }
      }, 2000)
    }

    const readline = require('readline')
    if (launchedProcess.stdout) {
      const rl = readline.createInterface({ input: launchedProcess.stdout, terminal: false })
      rl.on('line', (line: string) => {
        const rawText = line.trim()
        const cleanText = rawText.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
        if (!cleanText) return

        this.sendLog(`[Minecraft]: ${cleanText}`)

        if (cleanText.match(/Done \(.+?\)! For help, type "help"/i)) {
          this.isFullyStarted = true
          this.scheduleAutoStop()
        }

        const joinMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) joined the game/)
        if (joinMatch) {
          this.playerManager.handlePlayerJoin(joinMatch[1])
          this.clearAutoStopTimer()
        }
        const leaveMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) left the game/)
        if (leaveMatch) {
          this.playerManager.handlePlayerLeave(leaveMatch[1])
          if (this.onlinePlayers.length <= 1) setTimeout(() => this.scheduleAutoStop(), 0)
        }
      })
    }
    launchedProcess.stderr?.on('data', (data) =>
      this.sendLog(`[Minecraft Error]: ${data.toString().trim()}`)
    )

    launchedProcess.on('exit', () => {
      this.sendLog(`[System] Server process exited.`)
      if (this.process !== launchedProcess || this.launchSequence !== launchId) return
      if (this.autoStopTimer) clearTimeout(this.autoStopTimer)
      if (this.statsTimer) clearInterval(this.statsTimer)
      this.autoStopTimer = null
      this.statsTimer = null
      this.process = null
      this.javaPid = null
      this.playerManager.handleServerStop()
      minecraftEventBus.emit('server-stopped', this.serverId)
      minecraftEventBus.emit('server-stats', this.serverId, 0, 0)
    })

    await new Promise<void>((resolve, reject) => {
      launchedProcess.once('spawn', resolve)
      launchedProcess.once('error', (error) => {
        this.sendLog(`[System Error] Failed to start server: ${error.message}`)
        if (this.process === launchedProcess) this.process = null
        reject(error)
      })
    })
  }

  async stop(): Promise<void> {
    return new Promise(async (resolve) => {
      if (!this.process) {
        resolve()
        return
      }

      this.sendLog(`[System] Stopping Server ${this.serverId}...`)
      this.process.stdin?.write('stop\n')

      const p = this.process
      if (this.autoStopTimer) clearTimeout(this.autoStopTimer)
      if (this.statsTimer) clearInterval(this.statsTimer)
      this.autoStopTimer = null
      this.statsTimer = null

      // Update stats for all players before clearing them
      await this.playerManager.handleServerStop()

      let isResolved = false

      p.once('exit', () => {
        if (!isResolved) {
          isResolved = true
          resolve()
        }
      })

      // Force kill after 15 seconds if it hasn't gracefully exited
      setTimeout(() => {
        if (!isResolved) {
          try {
            if (p.pid) {
              // Check if process is still alive
              process.kill(p.pid, 0)
              this.sendLog(`[System] Server took too long to stop. Force killing process tree...`)
              if (process.platform === 'win32') {
                const killer = spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'])
                killer.once('close', () => {
                  if (this.process === p) this.process = null
                  isResolved = true
                  resolve()
                })
              } else {
                p.kill('SIGKILL')
              }
            } else {
              isResolved = true
              resolve()
            }
          } catch (e) {
            // Process already dead
            isResolved = true
            resolve()
          }
        }
      }, 15000)
    })
  }
}
