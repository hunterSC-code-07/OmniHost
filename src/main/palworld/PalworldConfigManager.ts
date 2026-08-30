import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export class PalworldConfigManager {
  static getConfigPath(serverId: number): string {
    return path.join(
      app.getPath('userData'),
      'servers',
      serverId.toString(),
      'Pal',
      'Saved',
      'Config',
      'WindowsServer',
      'PalWorldSettings.ini'
    )
  }

  static getDefaultConfigPath(serverId: number): string {
    return path.join(
      app.getPath('userData'),
      'servers',
      serverId.toString(),
      'DefaultPalWorldSettings.ini'
    )
  }

  static async getConfig(serverId: number): Promise<Record<string, string>> {
    const configPath = this.getConfigPath(serverId)
    const defaultPath = this.getDefaultConfigPath(serverId)

    let content = ''

    // Create directory if it doesn't exist
    const dir = path.dirname(configPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (fs.existsSync(configPath)) {
      content = fs.readFileSync(configPath, 'utf8')
    }

    // If empty or missing, fallback to Default
    if (!content.trim() && fs.existsSync(defaultPath)) {
      content = fs.readFileSync(defaultPath, 'utf8')
      fs.writeFileSync(configPath, content, 'utf8')
    }

    return this.parseIni(content)
  }

  static async setConfig(serverId: number, updates: Record<string, string>): Promise<boolean> {
    const configPath = this.getConfigPath(serverId)
    let currentConfig = await this.getConfig(serverId)

    const newConfig = { ...currentConfig, ...updates }

    const content = this.stringifyIni(newConfig)
    fs.writeFileSync(configPath, content, 'utf8')
    return true
  }

  private static parseIni(content: string): Record<string, string> {
    const result: Record<string, string> = {}
    const match = content.match(/OptionSettings=\((.*)\)/s)
    if (match && match[1]) {
      let optionsStr = match[1];
      
      // We must split by commas, BUT ignore commas inside parentheses.
      // A trick is to match key=value pairs up to the next key= or end of string.
      const regex = /([a-zA-Z0-9_]+)=([^=]+)(?:,|$)(?=[a-zA-Z0-9_]+=|$)/g;
      
      let m;
      while ((m = regex.exec(optionsStr)) !== null) {
        // Because the value might end with a comma if it's not the last one, we trim trailing commas
        let val = m[2].trim();
        if (val.endsWith(',')) val = val.slice(0, -1);
        result[m[1].trim()] = val;
      }
    }
    return result
  }

  private static stringifyIni(config: Record<string, string>): string {
    const pairs = Object.entries(config).map(([k, v]) => `${k}=${v}`)
    return `[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(${pairs.join(',')})\n`
  }
}
