import fs from 'fs'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import axios from 'axios'
import AdmZip from 'adm-zip'

export class SteamCMDSetup {
  static getSteamCMDDir() {
    return join(app.getPath('userData'), 'steamcmd')
  }

  static getExePath() {
    return join(this.getSteamCMDDir(), 'steamcmd.exe')
  }

  static sendLog(serverId: number, progress: number, msg: string) {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      windows[0].webContents.send(`download-progress-${serverId}`, progress, msg)
    }
  }

  static async ensureInstalled(serverId: number): Promise<void> {
    const dir = this.getSteamCMDDir()
    const exePath = this.getExePath()

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    if (!fs.existsSync(exePath)) {
      this.sendLog(serverId, 10, 'Downloading SteamCMD...')
      const zipPath = join(dir, 'steamcmd.zip')
      const url = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip'

      const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' })
      fs.writeFileSync(zipPath, response.data)

      this.sendLog(serverId, 50, 'Extracting SteamCMD...')
      const zip = new AdmZip(zipPath)
      zip.extractAllTo(dir, true)

      fs.unlinkSync(zipPath)
      this.sendLog(serverId, 100, 'SteamCMD setup complete!')
    }
  }
}
