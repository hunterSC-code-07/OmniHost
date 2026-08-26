import { MinecraftDownloader } from '../minecraft/MinecraftDownloader'
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
    MinecraftDownloader.searchModpacks(query, version, modloader)
  )
  
  ipcMain.handle('get-modpack-details', async (_, modId: string) => 
    MinecraftDownloader.getModpackDetails(modId)
  )
  
  ipcMain.handle('download-server-jar', async (event, id: number, type: string, version: string, loaderVersion: string) => 
    MinecraftDownloader.downloadServerJar(event, id, type, version, loaderVersion)
  )
}
