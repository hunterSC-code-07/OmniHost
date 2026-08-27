import { app } from 'electron'
import { join } from 'path'
import { promises as fsPromises } from 'fs'
import { CacheManager } from '../CacheManager'

export class MinecraftModManager {
  static async installCurseforgeMod(event: any, id: number, downloadUrl: string, fileName: string, classId: number = 6) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      // 6 is Mods, 12 is Resource Packs, 17 is Worlds
      const folderName = classId === 12 ? 'resourcepacks' : classId === 17 ? 'saves' : 'mods'
      const targetDir = join(serverDir, folderName)
      
      await fsPromises.mkdir(targetDir, { recursive: true })
      const targetPath = join(targetDir, fileName)

      const cachedFile = await CacheManager.getOrDownload('mods', downloadUrl, fileName, (progress) => {
        if (event && event.sender) {
          event.sender.send(`download-progress-${id}`, progress, `Downloading ${fileName}...`)
        }
      })
      
      await fsPromises.copyFile(cachedFile, targetPath)
      return true
    } catch (e: any) {
      console.error('Failed to install mod:', e.message)
      throw new Error(e.message)
    }
  }

  static async installCurseforgeModpack(_event: any, _id: number, _modId: number, _version: string) {
    throw new Error('Modpack installation is not yet fully implemented.')
  }

  static async getInstalledMods(id: number) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const modsDir = join(serverDir, 'mods')
      
      try {
        await fsPromises.access(modsDir)
      } catch {
        return [] 
      }
      
      const files = await fsPromises.readdir(modsDir, { withFileTypes: true })
      return files
        .filter(f => f.isFile() && f.name.endsWith('.jar'))
        .map(f => ({ name: f.name }))
    } catch (e: any) {
      console.error('Error getting installed mods:', e.message)
      return []
    }
  }

  static async deleteMod(id: number, fileName: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const modPath = join(serverDir, 'mods', fileName)
      
      await fsPromises.unlink(modPath)
      return true
    } catch (e: any) {
      console.error('Error deleting mod:', e.message)
      throw new Error(e.message)
    }
  }
}
