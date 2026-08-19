import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getServers: () => ipcRenderer.invoke('get-servers'),
  startServer: (id: number) => ipcRenderer.invoke('start-server', id),
  stopServer: (id: number) => ipcRenderer.invoke('stop-server', id),
  startTunnel: (ip: string) => ipcRenderer.invoke('start-tunnel', ip),
  stopTunnel: () => ipcRenderer.invoke('stop-tunnel'),
  readConfig: (id: number) => ipcRenderer.invoke('read-config', id),
  writeConfig: (id: number, data: string) => ipcRenderer.invoke('write-config', id, data),
  readJson: (id: number, filename: string) => ipcRenderer.invoke('read-json', id, filename),
  writeJson: (id: number, filename: string, data: any) => ipcRenderer.invoke('write-json', id, filename, data),
  sendCommand: (id: number, cmd: string) => ipcRenderer.invoke('send-command', id, cmd),
  getInventory: (id: number, playerName: string) => ipcRenderer.invoke('get-inventory', id, playerName),
  onConsoleLog: (callback: (msg: string) => void) => {
    ipcRenderer.removeAllListeners('console-log')
    ipcRenderer.on('console-log', (_, msg) => callback(msg))
  },
  // --- NEW: Listens for the live player array ---
  onOnlinePlayers: (callback: (data: {id: number, players: string[]}) => void) => {
    ipcRenderer.removeAllListeners('online-players')
    ipcRenderer.on('online-players', (_, data) => callback(data))
  },
  onServerStats: (callback: (data: {id: number, cpu: number, ram: number}) => void) => {
    ipcRenderer.removeAllListeners('server-stats')
    ipcRenderer.on('server-stats', (_, data) => callback(data))
  },
  onServerTps: (callback: (data: {id: number, tps: number}) => void) => {
    ipcRenderer.removeAllListeners('server-tps')
    ipcRenderer.on('server-tps', (_, data) => callback(data))
  },
  
  // Versions & Downloads
  createServer: (name: string, type: string, version: string) => ipcRenderer.invoke('create-server', name, type, version),
  changeServerSoftware: (id: number, type: string, version: string) => ipcRenderer.invoke('change-server-software', id, type, version),
  deleteServer: (id: number) => ipcRenderer.invoke('delete-server', id),
  getVanillaVersions: () => ipcRenderer.invoke('get-vanilla-versions'),
  getPaperVersions: () => ipcRenderer.invoke('get-paper-versions'),
  getFabricVersions: () => ipcRenderer.invoke('get-fabric-versions'),
  getForgeVersions: () => ipcRenderer.invoke('get-forge-versions'),
  getNeoForgeVersions: () => ipcRenderer.invoke('get-neoforge-versions'),
  searchModpacks: (query: string, version: string, modloader: string) => ipcRenderer.invoke('search-modpacks', query, version, modloader),
  getModpackDetails: (modId: number) => ipcRenderer.invoke('get-modpack-details', modId),
  installCurseforgeModpack: (id: number, modId: number, version: string) => ipcRenderer.invoke('install-curseforge-modpack', id, modId, version),
  downloadServerJar: (id: number, type: string, version: string) => ipcRenderer.invoke('download-server-jar', id, type, version),
  onDownloadProgress: (id: number, callback: (progress: number, text?: string) => void) => {
    ipcRenderer.removeAllListeners(`download-progress-${id}`)
    ipcRenderer.on(`download-progress-${id}`, (_, progress, text) => callback(progress, text))
  },
  
  // Mod Browser
    getServerMeta: (id: number) => ipcRenderer.invoke('get-server-meta', id),
  updateServerMeta: (id: number, changes: any) => ipcRenderer.invoke('update-server-meta', id, changes),
  getPlayerStats: (id: number) => ipcRenderer.invoke('get-player-stats', id),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  toggleAutoStart: (id: number, enabled: boolean) => ipcRenderer.invoke('toggle-auto-start', id, enabled),
  getCurseforgeMod: (modId: number) => ipcRenderer.invoke('get-curseforge-mod', modId),
  getCurseforgeFile: (modId: number, fileId: number) => ipcRenderer.invoke('get-curseforge-file', modId, fileId),
  searchCurseforgeMods: (search: string, type: string, version: string, page?: number, classId?: number, sortField?: number) => ipcRenderer.invoke('search-curseforge-mods', search, type, version, page, classId, sortField),
  installCurseforgeMod: (id: number, downloadUrl: string, fileName: string, classId?: number) => ipcRenderer.invoke('install-curseforge-mod', id, downloadUrl, fileName, classId),
  getInstalledMods: (id: number) => ipcRenderer.invoke('get-installed-mods', id),
  deleteMod: (id: number, fileName: string) => ipcRenderer.invoke('delete-mod', id, fileName),
  
  // Cache
  
  // File Manager
  listDir: (id: number, relPath: string) => ipcRenderer.invoke('list-dir', id, relPath),
  deleteItem: (id: number, relPath: string) => ipcRenderer.invoke('delete-item', id, relPath),
  readFile: (id: number, relPath: string) => ipcRenderer.invoke('read-file', id, relPath),
  writeFile: (id: number, relPath: string, content: string) => ipcRenderer.invoke('write-file', id, relPath, content),

  getCacheInfo: () => ipcRenderer.invoke('get-cache-info'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),

  // Backups
  getBackups: (id: number) => ipcRenderer.invoke('get-backups', id),
  createBackup: (id: number, name: string) => ipcRenderer.invoke('create-backup', id, name),
  restoreBackup: (id: number, filename: string) => ipcRenderer.invoke('restore-backup', id, filename),
  deleteBackup: (id: number, filename: string) => ipcRenderer.invoke('delete-backup', id, filename)
}


if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}