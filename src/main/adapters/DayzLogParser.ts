import fs from 'fs'
import { join } from 'path'
import { ChildProcess } from 'child_process'

type LogCallback = (msg: string) => void
type PlayerCallback = (playerName: string, isConnected: boolean) => void

export class DayzLogParser {
  private logWatcher: NodeJS.Timeout | null = null
  private logFd: number | null = null
  private lastLogPos: number = 0
  private logBuffer: string = ''

  constructor(
    private serverDir: string,
    private startTime: number,
    private onLog: LogCallback,
    private onPlayerUpdate: PlayerCallback
  ) {}

  setupLogWatcher(process: ChildProcess | null) {
    const profilesDir = join(this.serverDir, 'Profiles')
    this.onLog(`[System] Initializing Log Watcher at: ${profilesDir}`)
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true })
    }
    this.pollForLogFile(profilesDir, process)
  }

  private pollForLogFile(profilesDir: string, process: ChildProcess | null) {
    const checkFile = () => {
      if (!process) return // Stop if server process exited

      try {
        let files = fs.readdirSync(profilesDir).filter((f) => f.toLowerCase().endsWith('.adm'))
        // Only consider files created/modified AFTER the server started
        files = files.filter((f) => fs.statSync(join(profilesDir, f)).mtimeMs > this.startTime)

        if (files.length > 0) {
          files.sort((a, b) => {
            return (
              fs.statSync(join(profilesDir, b)).mtimeMs - fs.statSync(join(profilesDir, a)).mtimeMs
            )
          })
          const latestFile = join(profilesDir, files[0])
          this.tailLogFile(latestFile)
        } else {
          setTimeout(checkFile, 2000)
        }
      } catch (e) {
        setTimeout(checkFile, 2000)
      }
    }
    setTimeout(checkFile, 2000)
  }

  private tailLogFile(filePath: string) {
    this.onLog(`[System] Attaching to DayZ Admin Log: ${filePath}`)

    try {
      this.logFd = fs.openSync(filePath, 'r')
      this.lastLogPos = 0 // Read from start to catch existing players
      this.logBuffer = '' // Clear buffer on new file
      this.readNewLogs()

      // Use setInterval instead of fs.watch for much faster and more reliable updates on Windows
      this.logWatcher = setInterval(() => {
        this.readNewLogs()
      }, 500)
    } catch (e) {
      this.onLog(`[System Error] Failed to tail log: ${e}`)
    }
  }

  private readNewLogs() {
    if (this.logFd === null) return
    try {
      const stats = fs.fstatSync(this.logFd)
      if (stats.size > this.lastLogPos) {
        const length = stats.size - this.lastLogPos
        const buffer = Buffer.alloc(length)
        fs.readSync(this.logFd, buffer, 0, length, this.lastLogPos)
        this.lastLogPos = stats.size

        const content = buffer.toString('utf8')
        this.logBuffer += content

        let newlineIdx
        while ((newlineIdx = this.logBuffer.indexOf('\n')) !== -1) {
          const line = this.logBuffer.substring(0, newlineIdx).trim()
          this.logBuffer = this.logBuffer.substring(newlineIdx + 1)

          if (line) {
            this.onLog(`[DayZ] ${line}`)
            this.parseLogLine(line)
          }
        }
      }
    } catch (e) {}
  }

  private parseLogLine(line: string) {
    const connectedMatch = line.match(/Player "([^"]+)" .*?is connected/i)
    if (connectedMatch) {
      const pName = connectedMatch[1]
      this.onPlayerUpdate(pName, true)
    }

    const disconnectedMatch = line.match(/Player "([^"]+)" .*?has been disconnected/i)
    if (disconnectedMatch) {
      const pName = disconnectedMatch[1]
      this.onPlayerUpdate(pName, false)
    }
  }

  cleanup() {
    if (this.logWatcher) {
      clearInterval(this.logWatcher)
      this.logWatcher = null
    }
    if (this.logFd !== null) {
      fs.closeSync(this.logFd)
      this.logFd = null
    }
  }
}
