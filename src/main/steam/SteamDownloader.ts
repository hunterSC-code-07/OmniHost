import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import fs from 'fs'

import { SteamAuth } from './SteamAuth'
import { SteamCache } from './SteamCache'
import { SteamCMDSetup } from './SteamCMDSetup'

export const ENSHROUDED_DEDICATED_SERVER_APP_ID = 2278520

const SUCCESS_EXIT_CODES = new Set([0, 7])
const MAX_CODE_EIGHT_RETRIES = 1
const OUTPUT_TAIL_LIMIT = 4000

type SteamUpdateResult = true | 'RETRY_FULL_LOGIN'

class SteamCmdExitError extends Error {
  constructor(
    readonly exitCode: number | null,
    message: string
  ) {
    super(message)
    this.name = 'SteamCmdExitError'
  }
}

export function shouldUseAnonymousSteamLogin(appId: number): boolean {
  return appId === ENSHROUDED_DEDICATED_SERVER_APP_ID
}

export function isSuccessfulSteamCmdExit(exitCode: number | null, cacheReady: boolean): boolean {
  return cacheReady || (exitCode !== null && SUCCESS_EXIT_CODES.has(exitCode))
}

function appendOutputTail(current: string, next: string): string {
  return `${current}\n${next}`.trim().slice(-OUTPUT_TAIL_LIMIT)
}

function buildSteamCmdError(appId: number, exitCode: number | null, outputTail: string): Error {
  const lowerOutput = outputTail.toLowerCase()
  let reason = ''

  if (lowerOutput.includes('no subscription')) {
    reason = 'Steam did not grant access to the dedicated-server app.'
  } else if (lowerOutput.includes('disk write failure')) {
    reason = 'SteamCMD could not write the downloaded files. Check free space and folder access.'
  } else if (
    lowerOutput.includes('timeout') ||
    lowerOutput.includes('failed to connect') ||
    lowerOutput.includes('connection failure')
  ) {
    reason = 'SteamCMD could not maintain a connection to Steam.'
  } else {
    const lastLine = outputTail
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1)
    if (lastLine) reason = lastLine
  }

  const detail = reason ? ` ${reason}` : ''
  return new SteamCmdExitError(
    exitCode,
    `SteamCMD failed to download App ${appId} (exit code ${exitCode ?? 'unknown'}).${detail}`
  )
}

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

    const useAnonymousLogin = shouldUseAnonymousSteamLogin(appId)
    let tryCached = !useAnonymousLogin && Boolean(username && !password && !steamGuardCode)
    let codeEightRetries = 0

    while (true) {
      if (this.activeProcess) {
        try {
          this.activeProcess.kill()
        } catch (error) {
          console.warn('Could not stop the previous SteamCMD process.', error)
        }
        this.activeProcess = null
      }

      try {
        const result = await this.runUpdateAttempt(
          serverId,
          appId,
          useAnonymousLogin ? undefined : username,
          useAnonymousLogin || tryCached ? undefined : password,
          useAnonymousLogin ? undefined : steamGuardCode,
          tryCached
        )

        if (result === 'RETRY_FULL_LOGIN') {
          tryCached = false
          console.log(
            `[SteamCMD App ${appId}] Cached login failed, falling back to full authentication...`
          )
          continue
        }

        return true
      } catch (error) {
        if (
          error instanceof SteamCmdExitError &&
          error.exitCode === 8 &&
          codeEightRetries < MAX_CODE_EIGHT_RETRIES
        ) {
          codeEightRetries += 1
          SteamCMDSetup.sendLog(
            serverId,
            0,
            `SteamCMD interrupted the download. Retrying (${codeEightRetries}/${MAX_CODE_EIGHT_RETRIES})...`
          )
          continue
        }
        throw error
      }
    }
  }

  private static runUpdateAttempt(
    serverId: number,
    appId: number,
    username: string | undefined,
    password: string | undefined,
    steamGuardCode: string | undefined,
    tryCached: boolean
  ): Promise<SteamUpdateResult> {
    return new Promise((resolve, reject) => {
      SteamCMDSetup.sendLog(serverId, 0, `Starting SteamCMD download for App ${appId}...`)

      const exePath = SteamCMDSetup.getExePath()
      const loginArgs = SteamAuth.getLoginArgs(username, password, steamGuardCode)
      const cacheDir = SteamCache.getCacheDir(appId)

      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })

      const args = [
        '+force_install_dir',
        cacheDir,
        ...loginArgs,
        '+app_update',
        appId.toString(),
        'validate',
        '+quit'
      ]

      const proc = spawn(exePath, args, { cwd: SteamCMDSetup.getSteamCMDDir() })
      proc.stdin?.end()
      this.activeProcess = proc

      let steamGuardRequested = false
      let invalidCredentials = false
      let outputTail = ''

      proc.stdout?.on('data', (data) => {
        const output = data.toString().trim()
        if (!output) return

        outputTail = appendOutputTail(outputTail, output)
        console.log(`[SteamCMD App ${appId}]:`, output)

        if (SteamAuth.isSteamGuardPrompt(output)) steamGuardRequested = true
        if (SteamAuth.isInvalidPassword(output) || SteamAuth.isAccountLogonDenied(output)) {
          invalidCredentials = true
        }

        if (SteamAuth.isMobileAuthRequested(output)) {
          SteamCMDSetup.sendLog(serverId, 50, 'Approve the login on your Steam Mobile App...')
        }

        const progressMatch = output.match(/progress:\s*([0-9.]+)/i)
        if (progressMatch) {
          const percent = Number.parseFloat(progressMatch[1])
          SteamCMDSetup.sendLog(
            serverId,
            percent,
            `Downloading Game Files (${percent.toFixed(1)}%)...`
          )
        } else if (output.includes('Success! App')) {
          SteamCMDSetup.sendLog(serverId, 100, 'Download Complete!')
        }
      })

      proc.stderr?.on('data', (data) => {
        const output = data.toString().trim()
        if (!output) return
        outputTail = appendOutputTail(outputTail, output)
        console.error(`[SteamCMD App ${appId} Error]:`, output)
      })

      proc.once('close', async (code) => {
        this.activeProcess = null

        if (tryCached && invalidCredentials) {
          resolve('RETRY_FULL_LOGIN')
          return
        }

        const cacheReady = await SteamCache.isCached(appId).catch(() => false)
        if (isSuccessfulSteamCmdExit(code, cacheReady)) {
          if (cacheReady && !SUCCESS_EXIT_CODES.has(code ?? -1)) {
            console.warn(
              `[SteamCMD App ${appId}] SteamCMD exited with code ${code}, but the verified server files are present.`
            )
          }
          resolve(true)
        } else if (code === 5 && steamGuardRequested) {
          reject(new Error('STEAM_GUARD_REQUIRED'))
        } else if (invalidCredentials) {
          reject(new Error('INVALID_CREDENTIALS'))
        } else {
          reject(buildSteamCmdError(appId, code, outputTail))
        }
      })

      proc.once('error', (error) => {
        this.activeProcess = null
        reject(error)
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
