import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import axios from 'axios'

export class PlayitAdapter {
  process: ChildProcess | null = null
  exePath: string

  constructor() {
    // We renamed this to playit-agent.exe to bypass the corrupted old file!
    this.exePath = join(app.getPath('userData'), 'playit-agent.exe')
  }

  sendLog(msg: string) {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      windows[0].webContents.send('console-log', { id: 'global', msg })
    }
  }

  async start() {
    // 1. Download Playit directly from their official GitHub
    if (!fs.existsSync(this.exePath)) {
      this.sendLog('[Playit] Downloading Agent... please wait!')
      const url =
        'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-windows-x86_64.exe'

      const response = await axios({ url, method: 'GET', responseType: 'stream' })
      const writer = fs.createWriteStream(this.exePath)
      response.data.pipe(writer)

      await new Promise<void>((resolve, reject) => {
        // CRUCIAL FIX: We use 'close' instead of 'finish' so Windows has time to save the file!
        writer.on('close', () => resolve())
        writer.on('error', reject)
      })
      this.sendLog('[Playit] Download fully saved to disk!')
    }

    const playitDir = join(app.getPath('userData'), 'playit_config')
    if (!fs.existsSync(playitDir)) fs.mkdirSync(playitDir)

    this.sendLog('[Playit] Starting secure tunnel...')

    // 3. Launch the agent
    this.process = spawn(this.exePath, [], { cwd: playitDir })

    this.process.stderr?.on('data', (data) => this.sendLog(`[Playit]: ${data.toString().trim()}`))
    this.process.stderr?.on('data', (data) =>
      this.sendLog(`[Playit Error]: ${data.toString().trim()}`)
    )

    // Catch any future crash events so it doesn't break the app
    this.process.on('error', (err) => {
      this.sendLog(`[Playit Fatal Error]: ${err.message}`)
    })
  }

  stop() {
    if (this.process) {
      this.sendLog('[Playit] Stopping tunnel...')
      this.process.kill()
      this.process = null
    }
  }
}
