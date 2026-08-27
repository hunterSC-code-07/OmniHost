const fs = require('fs')
let code = fs.readFileSync('src/main/ipc/MinecraftIpc.ts', 'utf8')

code = code.replace(
  /ipcMain\.handle\('get-vanilla-versions', async \(\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('get-vanilla-versions', async () => MinecraftDownloader.getVanillaVersions())"
)
code = code.replace(
  /ipcMain\.handle\('get-paper-versions', async \(\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('get-paper-versions', async () => MinecraftDownloader.getPaperVersions())"
)
code = code.replace(
  /ipcMain\.handle\('get-fabric-versions', async \(\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('get-fabric-versions', async () => MinecraftDownloader.getFabricVersions())"
)
code = code.replace(
  /ipcMain\.handle\('get-forge-versions', async \(\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('get-forge-versions', async () => MinecraftDownloader.getForgeVersions())"
)
code = code.replace(
  /ipcMain\.handle\('get-neoforge-versions', async \(\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('get-neoforge-versions', async () => MinecraftDownloader.getNeoForgeVersions())"
)
code = code.replace(
  /ipcMain\.handle\('get-loader-versions', async \(_, type(?:: string)?, mcVersion(?:: string)?\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('get-loader-versions', async (_, type, mcVersion) => MinecraftDownloader.getLoaderVersions(type, mcVersion))"
)
code = code.replace(
  /ipcMain\.handle\('search-modpacks', async \(_, query, version, modloader\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('search-modpacks', async (_, query, version, modloader) => MinecraftDownloader.searchModpacks(query, version, modloader))"
)
code = code.replace(
  /ipcMain\.handle\('get-modpack-details', async \(_, modId\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('get-modpack-details', async (_, modId) => MinecraftDownloader.getModpackDetails(modId))"
)
code = code.replace(
  /ipcMain\.handle\('download-modpack', async \(event, id, modpackId, fileId\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('download-modpack', async (event, id, modpackId, fileId) => MinecraftDownloader.downloadModpack(event, id, modpackId, fileId))"
)
code = code.replace(
  /ipcMain\.handle\('download-server-jar', async \(event, id, type, version, loaderVersion\) => \{\n([\s\S]*?)\n  \}\)/,
  "ipcMain.handle('download-server-jar', async (event, id, type, version, loaderVersion) => MinecraftDownloader.downloadServerJar(event, id, type, version, loaderVersion))"
)

if (!code.includes('MinecraftDownloader')) {
  code = "import { MinecraftDownloader } from '../minecraft/MinecraftDownloader'\n" + code
}

fs.writeFileSync('src/main/ipc/MinecraftIpc.ts', code)
