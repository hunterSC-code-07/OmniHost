import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs'
import { app, safeStorage } from 'electron'
import { dirname, join } from 'path'
import type { DiscordBotSettings } from '@shared/discordSettings'

const SETTINGS_FILE_NAME = 'discord-bot.json'

export class DiscordBotSettingsService {
  constructor(private readonly getUserDataDirectory: () => string) {}

  private getSettingsPath(): string {
    return join(this.getUserDataDirectory(), SETTINGS_FILE_NAME)
  }

  readSettings(): DiscordBotSettings {
    const defaultSettings: DiscordBotSettings = {
      token: '',
      autoStart: false,
      enabled: true,
      guildId: '',
      defaultChannelId: '',
      announcementChannelId: '',
      dashboardMessageId: '',
      allowedRoleIds: [],
      allowedUserIds: [],
      adminRoleIds: [],
      announcePublicIp: false,
      announceLanIp: true,
      announceRadminIp: true,
      announceServerEvents: true,
      schedules: []
    }
    try {
      const rawSettings = JSON.parse(
        readFileSync(this.getSettingsPath(), 'utf8')
      ) as Partial<DiscordBotSettings>
      if (!rawSettings || typeof rawSettings !== 'object') {
        return defaultSettings
      }

      return {
        token: this.decodeToken(typeof rawSettings.token === 'string' ? rawSettings.token : ''),
        autoStart: typeof rawSettings.autoStart === 'boolean' ? rawSettings.autoStart : false,
        enabled: typeof rawSettings.enabled === 'boolean' ? rawSettings.enabled : true,
        guildId: typeof rawSettings.guildId === 'string' ? rawSettings.guildId : '',
        defaultChannelId:
          typeof rawSettings.defaultChannelId === 'string' ? rawSettings.defaultChannelId : '',
        announcementChannelId:
          typeof rawSettings.announcementChannelId === 'string'
            ? rawSettings.announcementChannelId
            : '',
        dashboardMessageId:
          typeof rawSettings.dashboardMessageId === 'string' ? rawSettings.dashboardMessageId : '',
        allowedRoleIds: Array.isArray(rawSettings.allowedRoleIds)
          ? rawSettings.allowedRoleIds.filter((value): value is string => typeof value === 'string')
          : [],
        allowedUserIds: Array.isArray(rawSettings.allowedUserIds)
          ? rawSettings.allowedUserIds.filter((value): value is string => typeof value === 'string')
          : [],
        adminRoleIds: Array.isArray(rawSettings.adminRoleIds)
          ? rawSettings.adminRoleIds.filter((value): value is string => typeof value === 'string')
          : [],
        announcePublicIp:
          typeof rawSettings.announcePublicIp === 'boolean' ? rawSettings.announcePublicIp : false,
        announceLanIp:
          typeof rawSettings.announceLanIp === 'boolean' ? rawSettings.announceLanIp : true,
        announceRadminIp:
          typeof rawSettings.announceRadminIp === 'boolean' ? rawSettings.announceRadminIp : true,
        announceServerEvents:
          typeof rawSettings.announceServerEvents === 'boolean'
            ? rawSettings.announceServerEvents
            : true,
        schedules: Array.isArray(rawSettings.schedules)
          ? rawSettings.schedules.filter(
              (schedule): schedule is DiscordBotSettings['schedules'][number] =>
                !!schedule &&
                typeof schedule === 'object' &&
                Number.isSafeInteger((schedule as { id?: unknown }).id) &&
                Number.isSafeInteger((schedule as { serverId?: unknown }).serverId) &&
                ((schedule as { action?: unknown }).action === 'start' ||
                  (schedule as { action?: unknown }).action === 'stop' ||
                  (schedule as { action?: unknown }).action === 'backup') &&
                typeof (schedule as { runAt?: unknown }).runAt === 'number' &&
                typeof (schedule as { createdBy?: unknown }).createdBy === 'string'
            )
          : []
      }
    } catch {
      return defaultSettings
    }
  }

  writeSettings(settings: DiscordBotSettings): void {
    const settingsPath = this.getSettingsPath()
    mkdirSync(dirname(settingsPath), { recursive: true })

    const temporaryPath = `${settingsPath}.${process.pid}.tmp`
    const persistedSettings = {
      ...settings,
      token: this.encodeToken(settings.token)
    }
    writeFileSync(temporaryPath, JSON.stringify(persistedSettings, null, 2), 'utf8')
    renameSync(temporaryPath, settingsPath)
  }

  private encodeToken(token: string): string {
    if (!token || !safeStorage.isEncryptionAvailable()) return token
    try {
      return `enc:v1:${safeStorage.encryptString(token).toString('base64')}`
    } catch {
      return token
    }
  }

  private decodeToken(token: string): string {
    if (!token.startsWith('enc:v1:') || !safeStorage.isEncryptionAvailable()) return token
    try {
      return safeStorage.decryptString(Buffer.from(token.slice('enc:v1:'.length), 'base64'))
    } catch {
      return ''
    }
  }

  setToken(token: string): DiscordBotSettings {
    const settings = this.readSettings()
    settings.token = token
    this.writeSettings(settings)
    return settings
  }

  setAutoStart(autoStart: boolean): DiscordBotSettings {
    const settings = this.readSettings()
    settings.autoStart = autoStart
    this.writeSettings(settings)
    return settings
  }
}

export const discordBotSettings = new DiscordBotSettingsService(() => app.getPath('userData'))
