import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import { SteamAuth } from './SteamAuth'
import { SteamCache } from './SteamCache'
import { SteamCMDSetup } from './SteamCMDSetup'

export class SteamDownloader {
  static activeProcess: ChildProcess | null = null

  static async updateCache(
    serverId: number,
    appId: number,
    username?: string,
    password?: string,
    steamGuardCode?: string
  ): Promise<boolean> {
    await SteamCMDSetup.ensureInstalled(serverId)

    return new Promise((resolve, reject) => {
      SteamCMDSetup.sendLog(serverId, 0, `Starting SteamCMD download for App ${appId}...`)

      const exePath = SteamCMDSetup.getExePath()
      const loginArgs = SteamAuth.getLoginArgs(username, password, steamGuardCode)
      const cacheDir = SteamCache.getCacheDir(appId)

      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })

      const args: string[] = [
        '+force_install_dir',
        cacheDir,
        ...loginArgs,
        '+app_update',
        appId.toString(),
        'validate',
        '+quit'
      ]

      const proc = spawn(exePath, args, { cwd: SteamCMDSetup.getSteamCMDDir() })
      this.activeProcess = proc

      let steamGuardRequested = false

      proc.stdout?.on('data', (data) => {
        const output = data.toString().trim()
        if (output) {
          console.log(`[SteamCMD App ${appId}]:`, output)

          if (SteamAuth.isSteamGuardPrompt(output)) {
            steamGuardRequested = true
          }

          const progressMatch = output.match(/progress:\s*([0-9.]+)/i)
          if (progressMatch) {
            const percent = parseFloat(progressMatch[1])
            SteamCMDSetup.sendLog(
              serverId,
              percent,
              `Downloading Game Files (${percent.toFixed(1)}%)...`
            )
          } else if (output.includes('Success! App')) {
            SteamCMDSetup.sendLog(serverId, 100, 'Download Complete!')
          }
        }
      })

      proc.stderr?.on('data', (data) => {
        console.error(`[SteamCMD App ${appId} Error]:`, data.toString().trim())
      })

      proc.on('close', async (code) => {
        this.activeProcess = null
        if (code === 0) {
          try {
            const buggyDir = require('path').join(
              cacheDir,
              'steamapps',
              'downloading',
              appId.toString()
            )
            if (fs.existsSync(buggyDir)) {
              fs.cpSync(buggyDir, cacheDir, { recursive: true })
              fs.rmSync(require('path').join(cacheDir, 'steamapps'), {
                recursive: true,
                force: true
              })
            }
          } catch (e) {
            console.error('Error cleaning up SteamCMD buggy downloading dir:', e)
          }
          resolve(true)
        } else if (code === 7) {
          SteamCMDSetup.sendLog(serverId, 0, 'SteamCMD updated itself, restarting download...')
          try {
            const success = await this.updateCache(
              serverId,
              appId,
              username,
              password,
              steamGuardCode
            )
            resolve(success)
          } catch (e) {
            reject(e)
          }
        } else if (code === 5 && steamGuardRequested) {
          reject(new Error('STEAM_GUARD_REQUIRED'))
        } else {
          reject(new Error(`SteamCMD exited with code ${code}`))
        }
      })

      proc.on('error', (err) => {
        reject(err)
      })
    })
  }

  static async installApp(
    serverId: number,
    appId: number,
    installDir: string,
    username?: string,
    password?: string,
    steamGuardCode?: string
  ): Promise<boolean> {
    await this.updateCache(serverId, appId, username, password, steamGuardCode)
    SteamCMDSetup.sendLog(serverId, 99, 'Copying from cache to server directory...')
    await SteamCache.copyFromCache(serverId, appId, installDir)
    SteamCMDSetup.sendLog(serverId, 100, 'Download and Setup Complete!')
    return true
  }
}
