import { MinecraftDownloader } from '../minecraft/MinecraftDownloader'
import { MinecraftModManager } from '../minecraft/MinecraftModManager'
import { ipcMain } from 'electron'

export function registerMinecraftIpc() {
  ipcMain.handle('get-vanilla-versions', async () => MinecraftDownloader.getVanillaVersions())
  ipcMain.handle('get-paper-versions', async () => MinecraftDownloader.getPaperVersions())
  ipcMain.handle('get-fabric-versions', async () => MinecraftDownloader.getFabricVersions())
  ipcMain.handle('get-forge-versions', async () => MinecraftDownloader.getForgeVersions())
  ipcMain.handle('get-neoforge-versions', async () => MinecraftDownloader.getNeoForgeVersions())
  
  ipcMain.handle('get-loader-versions', async (_, type: string, mcVersion: string) => 
    MinecraftDownloader.getLoaderVersions(type, mcVersion)
  )
  
  ipcMain.handle('search-modpacks', async (_, query: string, version: string, modloader: string) => 
    MinecraftModManager.searchModpacks(query, version, modloader) 
  )
  
  ipcMain.handle('get-modpack-details', async (_, modId: string) => 
    MinecraftModManager.getModpackDetails(modId) 
  )

  // Mod Management (CurseForge)
  ipcMain.handle('search-curseforge-mods', async (_, search: string, type: string, version: string, page?: number, classId?: number, sortField?: number) => 
    MinecraftModManager.searchCurseforgeMods(search, type, version, page, classId, sortField)
  )

  ipcMain.handle('get-curseforge-mod', async (_, modId: number) => 
    MinecraftModManager.getCurseforgeMod(modId)
  )

  ipcMain.handle('get-curseforge-file', async (_, modId: number, fileId: number) => 
    MinecraftModManager.getCurseforgeFile(modId, fileId)
  )

  ipcMain.handle('install-curseforge-mod', async (event, id: number, downloadUrl: string, fileName: string, classId?: number) => 
    MinecraftModManager.installCurseforgeMod(event, id, downloadUrl, fileName, classId)
  )

  ipcMain.handle('install-curseforge-modpack', async (event, id: number, modId: number, version: string) => 
    MinecraftModManager.installCurseforgeModpack(event, id, modId, version)
  )

  ipcMain.handle('get-installed-mods', async (_, id: number) => 
    MinecraftModManager.getInstalledMods(id)
  )

  ipcMain.handle('delete-mod', async (_, id: number, fileName: string) => 
    MinecraftModManager.deleteMod(id, fileName)
  )
  
  ipcMain.handle('download-server-jar', async (event, id: number, type: string, version: string, loaderVersion: string) => 
    MinecraftDownloader.downloadServerJar(event, id, type, version, loaderVersion)
  )
}
