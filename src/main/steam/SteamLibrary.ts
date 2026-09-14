import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export class SteamLibrary {
  /**
   * Reads the Steam installation path from the Windows Registry.
   */
  public static getSteamPath(): string | null {
    if (process.platform !== 'win32') {
      console.warn('Steam path auto-detection is currently only supported on Windows.')
      return null
    }
    try {
      const output = execSync('reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath').toString()
      const match = output.match(/REG_SZ\s+(.+)/)
      if (match) return match[1].trim()
    } catch (err) {
      console.error('Failed to read Steam path from registry:', err)
    }
    return null
  }

  /**
   * Parses libraryfolders.vdf and returns a list of all library folder paths.
   */
  public static getLibraryFolders(): string[] {
    const steamPath = this.getSteamPath()
    if (!steamPath) return []

    const folders = [steamPath]
    const vdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf')

    if (fs.existsSync(vdfPath)) {
      try {
        const content = fs.readFileSync(vdfPath, 'utf8')
        // Simple regex to extract all "path" values
        const pathRegex = /"path"\s+"([^"]+)"/g
        let match
        while ((match = pathRegex.exec(content)) !== null) {
          const folderPath = match[1].replace(/\\\\/g, '\\')
          if (!folders.includes(folderPath)) {
            folders.push(folderPath)
          }
        }
      } catch (err) {
        console.error('Failed to parse libraryfolders.vdf:', err)
      }
    }

    return folders
  }

  /**
   * Finds the installation directory for a specific AppID by checking all library folders.
   */
  public static getGameInstallPath(appId: number, gameFolderName: string): string | null {
    const libraries = this.getLibraryFolders()

    for (const lib of libraries) {
      const manifestPath = path.join(lib, 'steamapps', `appmanifest_${appId}.acf`)
      if (fs.existsSync(manifestPath)) {
        const installDir = path.join(lib, 'steamapps', 'common', gameFolderName)
        if (fs.existsSync(installDir)) {
          return installDir
        }
      }
    }
    return null
  }
}
