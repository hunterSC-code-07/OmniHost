import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import fs from 'fs'
import { join } from 'path'

import { SteamAuth } from './SteamAuth'
import { SteamCache } from './SteamCache'
import { SteamCMDSetup } from './SteamCMDSetup'

export const ENSHROUDED_DEDICATED_SERVER_APP_ID = 2278520

const SUCCESS_EXIT_CODES = new Set([0, 7])
const MAX_CODE_EIGHT_RETRIES = 1
const OUTPUT_TAIL_LIMIT = 16_000
const LOG_READ_LIMIT = 64 * 1024

type SteamUpdateResult = true | 'RETRY_FULL_LOGIN'

class SteamCmdExitError extends Error {
  constructor(
    readonly exitCode: number | null,
    message: string,
    readonly retryable = true
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

function parseByteSize(value: string): number | null {
  const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)\s*([kmgt]?i?b)$/i)
  if (!match) return null

  const amount = Number.parseFloat(match[1])
  const unit = match[2].toLowerCase().replace('ib', 'b')
  const exponent = ['b', 'kb', 'mb', 'gb', 'tb'].indexOf(unit)
  if (!Number.isFinite(amount) || exponent < 0) return null
  return Math.ceil(amount * 1024 ** exponent)
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'an unknown amount of space'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

export function parseSteamDiskSpaceFailure(output: string): {
  requiredLabel?: string
  requiredBytes?: number
} | null {
  if (!/not enough disk space|failed to preallocate/i.test(output)) return null

  const sizeMatch = output.match(
    /(?:not enough disk space|failed to preallocate)[^\r\n]*?["']([0-9.]+\s*[kmgt]?i?b)["']/i
  )
  const requiredLabel = sizeMatch?.[1]?.trim()
  const requiredBytes = requiredLabel ? parseByteSize(requiredLabel) : null
  return {
    ...(requiredLabel ? { requiredLabel } : {}),
    ...(requiredBytes !== null ? { requiredBytes } : {})
  }
}

export function parseIncompleteManifestRequirement(manifest: string): number | null {
  const readNumber = (key: string): number | null => {
    const match = manifest.match(new RegExp(`"${key}"\\s+"(\\d+)"`, 'i'))
    if (!match) return null
    const value = Number.parseInt(match[1], 10)
    return Number.isSafeInteger(value) ? value : null
  }

  const sizeOnDisk = readNumber('SizeOnDisk')
  const bytesToStage = readNumber('BytesToStage')
  const bytesStaged = readNumber('BytesStaged') ?? 0
  if (sizeOnDisk !== 0 || bytesToStage === null) return null
  return Math.max(0, bytesToStage - bytesStaged)
}

function getAvailableBytes(directory: string): number | null {
  try {
    const stats = fs.statfsSync(directory, { bigint: true })
    return Number(stats.bavail * stats.bsize)
  } catch {
    return null
  }
}

function buildDiskSpaceError(
  appId: number,
  cacheDir: string,
  exitCode: number | null,
  requirement: { requiredLabel?: string; requiredBytes?: number }
): SteamCmdExitError {
  const availableBytes = getAvailableBytes(cacheDir)
  const required =
    requirement.requiredLabel ??
    (requirement.requiredBytes !== undefined
      ? formatBytes(requirement.requiredBytes)
      : 'more space')
  const available =
    availableBytes === null ? '' : `, but only ${formatBytes(availableBytes)} is available`
  const deficit =
    availableBytes !== null && requirement.requiredBytes !== undefined
      ? ` Free at least ${formatBytes(Math.max(0, requirement.requiredBytes - availableBytes))}`
      : ' Free additional space'

  return new SteamCmdExitError(
    exitCode,
    `Insufficient disk space for Steam App ${appId}. SteamCMD needs ${required} free in "${cacheDir}"${available}.${deficit}, or choose a different Steam cache folder in Settings > Storage.`,
    false
  )
}

function getLogSize(path: string): number {
  try {
    return fs.statSync(path).size
  } catch {
    return 0
  }
}

function readLogSince(path: string, offset: number): string {
  let descriptor: number | undefined
  try {
    const size = fs.statSync(path).size
    const validOffset = size >= offset ? offset : 0
    const start = Math.max(validOffset, size - LOG_READ_LIMIT)
    const length = size - start
    if (length <= 0) return ''

    descriptor = fs.openSync(path, 'r')
    const buffer = Buffer.alloc(length)
    fs.readSync(descriptor, buffer, 0, length, start)
    return buffer.toString('utf8')
  } catch {
    return ''
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor)
  }
}

function readIncompleteCacheRequirement(cacheDir: string, appId: number): number | null {
  try {
    const manifest = fs.readFileSync(
      join(cacheDir, 'steamapps', `appmanifest_${appId}.acf`),
      'utf8'
    )
    return parseIncompleteManifestRequirement(manifest)
  } catch {
    return null
  }
}

function buildSteamCmdError(
  appId: number,
  cacheDir: string,
  exitCode: number | null,
  outputTail: string
): SteamCmdExitError {
  const lowerOutput = outputTail.toLowerCase()
  let reason = ''
  let retryable = true

  const diskSpaceFailure = parseSteamDiskSpaceFailure(outputTail)
  if (diskSpaceFailure) {
    return buildDiskSpaceError(appId, cacheDir, exitCode, diskSpaceFailure)
  }

  if (lowerOutput.includes('no subscription')) {
    reason = 'Steam did not grant access to the dedicated-server app.'
    retryable = false
  } else if (lowerOutput.includes('disk write failure')) {
    reason = 'SteamCMD could not write the downloaded files. Check free space and folder access.'
    retryable = false
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
    `SteamCMD failed to download App ${appId} (exit code ${exitCode ?? 'unknown'}).${detail}`,
    retryable
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
          error.retryable &&
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
        if (error instanceof Error) SteamCMDSetup.sendLog(serverId, 0, error.message)
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

      const incompleteRequirement = readIncompleteCacheRequirement(cacheDir, appId)
      const availableBytes = getAvailableBytes(cacheDir)
      if (
        incompleteRequirement !== null &&
        availableBytes !== null &&
        availableBytes < incompleteRequirement
      ) {
        reject(
          buildDiskSpaceError(appId, cacheDir, null, {
            requiredBytes: incompleteRequirement
          })
        )
        return
      }

      const contentLogPath = join(SteamCMDSetup.getSteamCMDDir(), 'logs', 'content_log.txt')
      const contentLogOffset = getLogSize(contentLogPath)

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
          const diagnosticOutput = appendOutputTail(
            outputTail,
            readLogSince(contentLogPath, contentLogOffset)
          )
          reject(buildSteamCmdError(appId, cacheDir, code, diagnosticOutput))
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
