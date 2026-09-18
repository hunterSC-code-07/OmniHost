import { BrowserWindow } from 'electron'
import { handleTrusted } from '../security/ipcSecurity'
import { SteamLibrary } from '../steam/SteamLibrary'
import { ModManifestEntry } from './ModSyncServer'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export class ModSyncClient {
  public registerIpc(): void {
    handleTrusted(
      'start-mod-sync',
      async (
        _event,
        hostIp: string,
        port: number,
        gameId: string,
        serverId: number,
        appId: number,
        gameFolderName: string
      ) => {
        return this.startSync(hostIp, port, gameId, serverId, appId, gameFolderName)
      }
    )
  }

  private sendProgress(progress: number, text: string): void {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      windows[0].webContents.send('mod-sync-progress', progress, text)
    }
  }

  private async calculateHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)
      stream.on('error', (err) => reject(err))
      stream.on('data', (chunk) => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
    })
  }

  public async startSync(
    hostIp: string,
    port: number,
    gameId: string,
    serverId: number,
    appId: number,
    gameFolderName: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      this.sendProgress(0, 'Detecting game installation...')
      const gamePath = SteamLibrary.getGameInstallPath(appId, gameFolderName)

      if (!gamePath) {
        return {
          success: false,
          message: 'Could not auto-detect game installation. Please ensure the game is installed.'
        }
      }

      const localModsDir = path.join(gamePath, 'Mods')
      if (!fs.existsSync(localModsDir)) {
        fs.mkdirSync(localModsDir, { recursive: true })
      }

      this.sendProgress(5, 'Fetching server mod manifest...')
      const manifestUrl = `http://${hostIp}:${port}/api/manifest?gameId=${gameId}&serverId=${serverId}`

      let response
      try {
        response = await axios.get<{ files: ModManifestEntry[] }>(manifestUrl, { timeout: 10000 })
      } catch (err) {
        return { success: false, message: 'Could not connect to the host. They might be offline.' }
      }

      const remoteFiles = response.data.files
      const filesToDownload: ModManifestEntry[] = []

      this.sendProgress(10, 'Comparing local files with server...')
      for (let i = 0; i < remoteFiles.length; i++) {
        const remoteFile = remoteFiles[i]
        const localFilePath = path.join(localModsDir, remoteFile.relativePath)

        if (!fs.existsSync(localFilePath)) {
          filesToDownload.push(remoteFile)
        } else {
          const localHash = await this.calculateHash(localFilePath)
          if (localHash !== remoteFile.hash) {
            filesToDownload.push(remoteFile)
          }
        }

        // Update progress slightly during hash comparison
        this.sendProgress(10 + 10 * (i / remoteFiles.length), 'Comparing local files...')
      }

      let downloadedCount = 0
      const totalToDownload = filesToDownload.length

      for (const file of filesToDownload) {
        this.sendProgress(
          20 + 80 * (downloadedCount / totalToDownload),
          `Downloading ${file.relativePath} (${downloadedCount + 1}/${totalToDownload})...`
        )

        const downloadUrl = `http://${hostIp}:${port}/api/download?gameId=${gameId}&serverId=${serverId}&file=${encodeURIComponent(file.relativePath)}`
        const localFilePath = path.join(localModsDir, file.relativePath)

        // Ensure subdirectories exist
        const fileDir = path.dirname(localFilePath)
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true })
        }

        const fileResponse = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream'
        })

        const writer = fs.createWriteStream(localFilePath)
        fileResponse.data.pipe(writer)

        await new Promise((resolve, reject) => {
          writer.on('finish', () => resolve(null))
          writer.on('error', reject)
        })

        downloadedCount++
      }

      this.sendProgress(100, 'Sync complete! Launching game...')
      return { success: true }
    } catch (error: any) {
      console.error('[ModSyncClient] Sync failed:', error)
      return { success: false, message: error.message || 'Unknown error occurred during sync.' }
    }
  }
}

export const modSyncClient = new ModSyncClient()
