import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import AdmZip from 'adm-zip'
import { CacheManager } from '../CacheManager'

export class JavaManager {
  private static get javaDir() {
    return path.join(app.getPath('userData'), 'java')
  }

  /**
   * Returns the path to the javaw.exe or java.exe for the given version.
   * If it doesn't exist, it will download and extract it first.
   */
  public static async getJavaPath(
    version: 8 | 16 | 17 | 21 | 25,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const versionDir = path.join(this.javaDir, version.toString())

    // Check if we already have it downloaded
    if (fs.existsSync(versionDir)) {
      const execPath = this.findJavaExecutable(versionDir)
      if (execPath) return execPath
    }

    // Otherwise, we need to download it
    console.log(`[JavaManager] Downloading Java ${version}...`)
    await this.downloadAndExtractJava(version, versionDir, onProgress)

    const execPath = this.findJavaExecutable(versionDir)
    if (!execPath) {
      throw new Error(`Failed to locate java.exe in extracted archive for Java ${version}`)
    }

    return execPath
  }

  private static findJavaExecutable(dir: string): string | null {
    // Adoptium zips usually contain a single root folder like 'jdk-21.0.4+7'
    try {
      const contents = fs.readdirSync(dir)
      if (contents.length === 0) return null

      for (const item of contents) {
        const fullPath = path.join(dir, item, 'bin', 'java.exe')
        if (fs.existsSync(fullPath)) {
          return fullPath
        }
      }
    } catch (err) {
      return null
    }
    return null
  }

  private static async downloadAndExtractJava(
    version: number,
    targetDir: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    // 1. Fetch the latest release for this version from Adoptium
    const apiUrl = `https://api.adoptium.net/v3/assets/latest/${version}/hotspot?architecture=x64&image_type=jdk&os=windows&vendor=eclipse`
    const response = await axios.get(apiUrl)

    if (!response.data || response.data.length === 0) {
      throw new Error(`No Java ${version} releases found for Windows x64.`)
    }

    const downloadUrl = response.data[0].binary.package.link

    // 2. Download the zip
    const zipPath = await CacheManager.getOrDownload(
      'java',
      downloadUrl,
      `java-${version}.zip`,
      (progress) => {
        if (onProgress) onProgress(progress)
      }
    )

    // 3. Extract the zip
    console.log(`[JavaManager] Extracting Java ${version}...`)

    // AdmZip is synchronous, this will block the main thread for a few seconds during extraction.
    // That's acceptable for an Electron app during an explicit download action.
    const zip = new AdmZip(zipPath)
    zip.extractAllTo(targetDir, true)

    console.log(`[JavaManager] Java ${version} installed successfully.`)
  }
}
