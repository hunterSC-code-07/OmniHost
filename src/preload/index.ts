import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getServers: () => ipcRenderer.invoke('get-servers'),
  startServer: (id: number) => ipcRenderer.invoke('start-server', id),
  stopServer: (id: number) => ipcRenderer.invoke('stop-server', id),
  startTunnel: (ip: string) => ipcRenderer.invoke('start-tunnel', ip),
  stopTunnel: () => ipcRenderer.invoke('stop-tunnel'),
  radminCheck: () => ipcRenderer.invoke('radmin-check'),
  radminInstall: () => ipcRenderer.invoke('radmin-install'),
  radminOpen: () => ipcRenderer.invoke('radmin-open'),
  radminGetIp: () => ipcRenderer.invoke('radmin-get-ip'),
  getTunnelStatus: () => ipcRenderer.invoke('get-tunnel-status'),
  readConfig: (id: number) => ipcRenderer.invoke('read-config', id),
  writeConfig: (id: number, data: string) => ipcRenderer.invoke('write-config', id, data),
  readDayzConfig: (id: number) => ipcRenderer.invoke('read-dayz-config', id),
  writeDayzConfig: (id: number, data: string) => ipcRenderer.invoke('write-dayz-config', id, data),
  getDayzEconomy: (id: number) => ipcRenderer.invoke('get-dayz-economy', id),
  updateDayzEconomy: (id: number, settings: any) => ipcRenderer.invoke('update-dayz-economy', id, settings),
  wipeDayzLoot: (id: number) => ipcRenderer.invoke('wipe-dayz-loot', id),
  readJson: (id: number, filename: string) => ipcRenderer.invoke('read-json', id, filename),
  writeJson: (id: number, filename: string, data: any) => ipcRenderer.invoke('write-json', id, filename, data),
  sendCommand: (id: number, cmd: string) => ipcRenderer.invoke('send-command', id, cmd),
  getInventory: (id: number, playerName: string) => ipcRenderer.invoke('get-inventory', id, playerName),
  onConsoleLog: (callback: (data: { id: number | string, msg: string }) => void) => {
    ipcRenderer.removeAllListeners('console-log')
    ipcRenderer.on('console-log', (_, data) => callback(data))
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
  onServersUpdate: (callback: (data: any[]) => void) => {
    ipcRenderer.removeAllListeners('servers-update')
    ipcRenderer.on('servers-update', (_, data) => callback(data))
  },
  
  // Versions & Downloads
  createServer: (name: string, game: string, type: string, version: string, loaderVersion?: string) => ipcRenderer.invoke('create-server', name, game, type, version, loaderVersion),
  changeServerSoftware: (id: number, type: string, version: string, loaderVersion?: string) => ipcRenderer.invoke('change-server-software', id, type, version, loaderVersion),
  deleteServer: (id: number) => ipcRenderer.invoke('delete-server', id),
  getVanillaVersions: () => ipcRenderer.invoke('get-vanilla-versions'),
  getPaperVersions: () => ipcRenderer.invoke('get-paper-versions'),
  getFabricVersions: () => ipcRenderer.invoke('get-fabric-versions'),
  getForgeVersions: () => ipcRenderer.invoke('get-forge-versions'),
  getNeoForgeVersions: () => ipcRenderer.invoke('get-neoforge-versions'),
  getLoaderVersions: (type: string, mcVersion: string) => ipcRenderer.invoke('get-loader-versions', type, mcVersion),
  searchModpacks: (query: string, version: string, modloader: string) => ipcRenderer.invoke('search-modpacks', query, version, modloader),
  getModpackDetails: (modId: number) => ipcRenderer.invoke('get-modpack-details', modId),
  installCurseforgeModpack: (id: number, modId: number, version: string) => ipcRenderer.invoke('install-curseforge-modpack', id, modId, version),
  downloadServerJar: (id: number, type: string, version: string, loaderVersion?: string) => ipcRenderer.invoke('download-server-jar', id, type, version, loaderVersion),
  installSteamApp: (id: number, appId: number, username?: string, password?: string, steamGuardCode?: string) => ipcRenderer.invoke('install-steam-app', id, appId, username, password, steamGuardCode),
  checkSteamCache: (appId: number) => ipcRenderer.invoke('check-steam-cache', appId),
  deleteSteamCache: (appId: number) => ipcRenderer.invoke('delete-steam-cache', appId),
  updateSteamCache: (id: number, appId: number, username?: string, password?: string, steamGuardCode?: string) => ipcRenderer.invoke('update-steam-cache', id, appId, username, password, steamGuardCode),
  copySteamCache: (id: number, appId: number) => ipcRenderer.invoke('copy-steam-cache', id, appId),
  sendSteamCmdInput: (data: string) => ipcRenderer.invoke('send-steamcmd-input', data),
  onSteamGuardPrompt: (callback: (message: string) => void) => {
    ipcRenderer.removeAllListeners('steam-guard-prompt')
    ipcRenderer.on('steam-guard-prompt', (_, message) => callback(message))
  },
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
  listDir: (id: number, relPath: string) => ipcRenderer.invoke('fs-list-dir', id, relPath),
  deleteItem: (id: number, relPath: string) => ipcRenderer.invoke('fs-delete', id, relPath),
  readFile: (id: number, relPath: string) => ipcRenderer.invoke('fs-read-file', id, relPath),
  writeFile: (id: number, relPath: string, content: string) => ipcRenderer.invoke('fs-write-file', id, relPath, content),
  createFolder: (id: number, relPath: string) => ipcRenderer.invoke('fs-create-folder', id, relPath),

  getCacheInfo: () => ipcRenderer.invoke('get-cache-info'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),

  // Backups
  getBackups: (id: number) => ipcRenderer.invoke('get-backups', id),
  createBackup: (id: number, name: string) => ipcRenderer.invoke('create-backup', id, name),
  restoreBackup: (id: number, filename: string) => ipcRenderer.invoke('restore-backup', id, filename),
  deleteBackup: (id: number, filename: string) => ipcRenderer.invoke('delete-backup', id, filename),

  // DayZ Mods
  searchSteamWorkshop: (query: string, queryType?: number, page?: number, requiredTags?: string[]) => ipcRenderer.invoke('search-steam-workshop', query, queryType, page, requiredTags),
  getModDependencies: (modId: string) => ipcRenderer.invoke('get-mod-dependencies', modId),
  getWorkshopItemDetails: (modIds: string[]) => ipcRenderer.invoke('get-workshop-item-details', modIds),
  getDayzInstalledMods: (id: number) => ipcRenderer.invoke('get-dayz-installed-mods', id),
  installDayzMod: (id: number, modId: string, title: string, user?: string, pass?: string, guard?: string) => ipcRenderer.invoke('install-dayz-mod', id, modId, title, user, pass, guard),
  uninstallDayzMod: (id: number, modIdOrFolder: string) => ipcRenderer.invoke('uninstall-dayz-mod', id, modIdOrFolder)
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