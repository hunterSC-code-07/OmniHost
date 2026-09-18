import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs'
import { app } from 'electron'
import { dirname, join } from 'path'
import type { DiscordBotSettings } from '@shared/discordSettings'

const SETTINGS_FILE_NAME = 'discord-bot.json'

export class DiscordBotSettingsService {
  constructor(private readonly getUserDataDirectory: () => string) {}

  private getSettingsPath(): string {
    return join(this.getUserDataDirectory(), SETTINGS_FILE_NAME)
  }

  readSettings(): DiscordBotSettings {
    const defaultSettings: DiscordBotSettings = { token: '', autoStart: false }
    try {
      const rawSettings = JSON.parse(
        readFileSync(this.getSettingsPath(), 'utf8')
      ) as Partial<DiscordBotSettings>
      if (!rawSettings || typeof rawSettings !== 'object') {
        return defaultSettings
      }

      return {
        token: typeof rawSettings.token === 'string' ? rawSettings.token : '',
        autoStart: typeof rawSettings.autoStart === 'boolean' ? rawSettings.autoStart : false
      }
    } catch {
      return defaultSettings
    }
  }

  writeSettings(settings: DiscordBotSettings): void {
    const settingsPath = this.getSettingsPath()
    mkdirSync(dirname(settingsPath), { recursive: true })

    const temporaryPath = `${settingsPath}.${process.pid}.tmp`
    writeFileSync(temporaryPath, JSON.stringify(settings, null, 2), 'utf8')
    renameSync(temporaryPath, settingsPath)
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
