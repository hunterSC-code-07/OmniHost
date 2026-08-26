import { app } from 'electron'
import { join } from 'path'
import axios from 'axios'
import { promises as fsPromises } from 'fs'
import { CacheManager } from '../CacheManager'

export class MinecraftModManager {
  static async searchCurseforgeMods(
    search: string,
    type: string,
    version: string,
    page: number = 0,
    classId: number = 6,
    sortField: number = 2
  ) {
    try {
      let url = `https://api.curseforge.com/v1/mods/search?gameId=432&classId=${classId}&sortField=${sortField}&sortOrder=desc&index=${page * 50}`
      
      if (search) url += `&searchFilter=${encodeURIComponent(search)}`
      
      if (version) {
        const cfVersion = version.endsWith('.0') && version.split('.').length === 3 
          ? version.slice(0, -2) 
          : version
        url += `&gameVersion=${encodeURIComponent(cfVersion)}`
      }
      
      if (type) {
        if (type === 'Forge') url += '&modLoaderType=1'
        else if (type === 'Fabric') url += '&modLoaderType=4'
        else if (type === 'NeoForge') url += '&modLoaderType=6'
        else if (type === 'Quilt') url += '&modLoaderType=5'
      }

      const res = await axios.get(url, { headers: { 'x-api-key': process.env.CURSEFORGE_API_KEY || '' } })
      return res.data.data
    } catch (e: any) {
      console.error('Error searching Curseforge mods:', e.message)
      return []
    }
  }

  static async getCurseforgeMod(modId: number) {
    try {
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}`, {
        headers: { 'x-api-key': process.env.CURSEFORGE_API_KEY || '' }
      })
      return res.data.data
    } catch (e: any) {
      console.error('Error getting Curseforge mod:', e.message)
      return null
    }
  }

  static async getCurseforgeFile(modId: number, fileId: number) {
    try {
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}/files/${fileId}`, {
        headers: { 'x-api-key': process.env.CURSEFORGE_API_KEY || '' }
      })
      return res.data.data
    } catch (e: any) {
      console.error('Error getting Curseforge file:', e.message)
      return null
    }
  }

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

  static async searchModpacks(query: string, version: string, modloader: string) {
    return this.searchCurseforgeMods(query, modloader, version, 0, 4471, 2)
  }

  static async getModpackDetails(modId: string) {
    return this.getCurseforgeMod(parseInt(modId))
  }
}
