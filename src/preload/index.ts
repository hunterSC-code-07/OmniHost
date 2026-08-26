import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  server: {
    getServers: () => ipcRenderer.invoke('get-servers'),
    createServer: (name: string, game: string, type: string, version: string, loaderVersion?: string) => ipcRenderer.invoke('create-server', name, game, type, version, loaderVersion),
    deleteServer: (id: number) => ipcRenderer.invoke('delete-server', id),
    startServer: (id: number) => ipcRenderer.invoke('start-server', id),
    stopServer: (id: number) => ipcRenderer.invoke('stop-server', id),
    getServerMeta: (id: number) => ipcRenderer.invoke('get-server-meta', id),
    updateServerMeta: (id: number, changes: any) => ipcRenderer.invoke('update-server-meta', id, changes),
    getPlayerStats: (id: number) => ipcRenderer.invoke('get-player-stats', id),
    sendCommand: (id: number, cmd: string) => ipcRenderer.invoke('send-command', id, cmd),
    toggleAutoStart: (id: number, enabled: boolean) => ipcRenderer.invoke('toggle-auto-start', id, enabled),
    readConfig: (id: number) => ipcRenderer.invoke('read-config', id),
    writeConfig: (id: number, data: string) => ipcRenderer.invoke('write-config', id, data),
    readJson: (id: number, filename: string) => ipcRenderer.invoke('read-json', id, filename),
    writeJson: (id: number, filename: string, data: any) => ipcRenderer.invoke('write-json', id, filename, data),
    getInventory: (id: number, playerName: string) => ipcRenderer.invoke('get-inventory', id, playerName),
    getPlayerNbtStats: (id: number, playerName: string) => ipcRenderer.invoke('get-player-nbt-stats', id, playerName),
    editPlayerNbt: (id: number, playerName: string, stats: any) => ipcRenderer.invoke('edit-player-nbt', id, playerName, stats),
    
    // Events
    onServersUpdate: (callback: (data: any[]) => void) => {
      ipcRenderer.removeAllListeners('servers-update')
      ipcRenderer.on('servers-update', (_, data) => callback(data))
    },
    onServerStats: (callback: (data: {id: number, cpu: number, ram: number}) => void) => {
      ipcRenderer.removeAllListeners('server-stats')
      ipcRenderer.on('server-stats', (_, data) => callback(data))
    },
    onServerTps: (callback: (data: {id: number, tps: number}) => void) => {
      ipcRenderer.removeAllListeners('server-tps')
      ipcRenderer.on('server-tps', (_, data) => callback(data))
    },
    onOnlinePlayers: (callback: (data: {id: number, players: string[]}) => void) => {
      ipcRenderer.removeAllListeners('online-players')
      ipcRenderer.on('online-players', (_, data) => callback(data))
    },
    onConsoleLog: (callback: (data: { id: number | string, msg: string }) => void) => {
      ipcRenderer.removeAllListeners('console-log')
      ipcRenderer.on('console-log', (_, data) => callback(data))
    },
    onDownloadProgress: (id: number, callback: (progress: number, text?: string) => void) => {
      ipcRenderer.removeAllListeners(`download-progress-${id}`)
      ipcRenderer.on(`download-progress-${id}`, (_, progress, text) => callback(progress, text))
    }
  },

  system: {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    getCacheInfo: () => ipcRenderer.invoke('get-cache-info'),
    clearCache: () => ipcRenderer.invoke('clear-cache'),
    startTunnel: (ip: string) => ipcRenderer.invoke('start-tunnel', ip),
    stopTunnel: () => ipcRenderer.invoke('stop-tunnel'),
    getTunnelStatus: () => ipcRenderer.invoke('get-tunnel-status'),
    radminCheck: () => ipcRenderer.invoke('radmin-check'),
    radminInstall: () => ipcRenderer.invoke('radmin-install'),
    radminOpen: () => ipcRenderer.invoke('radmin-open'),
    radminGetIp: () => ipcRenderer.invoke('radmin-get-ip'),
  },

  fs: {
    listDir: (id: number, relPath: string) => ipcRenderer.invoke('fs-list-dir', id, relPath),
    deleteItem: (id: number, relPath: string) => ipcRenderer.invoke('fs-delete', id, relPath),
    readFile: (id: number, relPath: string) => ipcRenderer.invoke('fs-read-file', id, relPath),
    writeFile: (id: number, relPath: string, content: string) => ipcRenderer.invoke('fs-write-file', id, relPath, content),
    createFolder: (id: number, relPath: string) => ipcRenderer.invoke('fs-create-folder', id, relPath),
  },

  backup: {
    getBackups: (id: number) => ipcRenderer.invoke('get-backups', id),
    createBackup: (id: number, name: string) => ipcRenderer.invoke('create-backup', id, name),
    restoreBackup: (id: number, filename: string) => ipcRenderer.invoke('restore-backup', id, filename),
    deleteBackup: (id: number, filename: string) => ipcRenderer.invoke('delete-backup', id, filename),
    deleteAllBackups: (id: number) => ipcRenderer.invoke('delete-all-backups', id),
  },

  minecraft: {
    getVanillaVersions: () => ipcRenderer.invoke('get-vanilla-versions'),
    getPaperVersions: () => ipcRenderer.invoke('get-paper-versions'),
    getFabricVersions: () => ipcRenderer.invoke('get-fabric-versions'),
    getForgeVersions: () => ipcRenderer.invoke('get-forge-versions'),
    getNeoForgeVersions: () => ipcRenderer.invoke('get-neoforge-versions'),
    getLoaderVersions: (type: string, mcVersion: string) => ipcRenderer.invoke('get-loader-versions', type, mcVersion),
    downloadServerJar: (id: number, type: string, version: string, loaderVersion?: string) => ipcRenderer.invoke('download-server-jar', id, type, version, loaderVersion),
    changeServerSoftware: (id: number, type: string, version: string, loaderVersion?: string) => ipcRenderer.invoke('change-server-software', id, type, version, loaderVersion),
    searchModpacks: (query: string, version: string, modloader: string) => ipcRenderer.invoke('search-modpacks', query, version, modloader),
    getModpackDetails: (modId: number | string) => ipcRenderer.invoke('get-modpack-details', modId),
    installCurseforgeModpack: (id: number, modId: number | string, version: string) => ipcRenderer.invoke('install-curseforge-modpack', id, modId, version),
    getCurseforgeMod: (modId: number | string) => ipcRenderer.invoke('get-curseforge-mod', modId),
    getCurseforgeFile: (modId: number | string, fileId: number | string) => ipcRenderer.invoke('get-curseforge-file', modId, fileId),
    searchCurseforgeMods: (search: string, type: string, version: string, page?: number, classId?: number, sortField?: number) => ipcRenderer.invoke('search-curseforge-mods', search, type, version, page, classId, sortField),
    installCurseforgeMod: (id: number, downloadUrl: string, fileName: string, classId?: number) => ipcRenderer.invoke('install-curseforge-mod', id, downloadUrl, fileName, classId),
    getInstalledMods: (id: number) => ipcRenderer.invoke('get-installed-mods', id),
    getInstalledModDependencies: (id: number) => ipcRenderer.invoke('get-installed-mod-dependencies', id),
    deleteMod: (id: number, fileName: string) => ipcRenderer.invoke('delete-mod', id, fileName),
    deleteAllMods: (id: number) => ipcRenderer.invoke('delete-all-mods', id),
  },

  dayz: {
    readConfig: (id: number) => ipcRenderer.invoke('read-dayz-config', id),
    writeConfig: (id: number, data: string) => ipcRenderer.invoke('write-dayz-config', id, data),
    getEconomy: (id: number) => ipcRenderer.invoke('get-dayz-economy', id),
    updateEconomy: (id: number, settings: any) => ipcRenderer.invoke('update-dayz-economy', id, settings),
    wipeLoot: (id: number, wipePlayers: boolean) => ipcRenderer.invoke('wipe-dayz-loot', id, wipePlayers),
    getInstalledMods: (id: number) => ipcRenderer.invoke('get-dayz-installed-mods', id),
    installMod: (id: number, modId: string, title: string, user?: string, pass?: string, guard?: string) => ipcRenderer.invoke('install-dayz-mod', id, modId, title, user, pass, guard),
    installMods: (id: number, modsToInstall: { modId: string, modTitle: string }[], user?: string, pass?: string, guard?: string) => ipcRenderer.invoke('install-dayz-mods', id, modsToInstall, user, pass, guard),
    uninstallMod: (id: number, modIdOrFolder: string) => ipcRenderer.invoke('uninstall-dayz-mod', id, modIdOrFolder),
    toggleMapMod: (id: number, folderName: string, isMap: boolean) => ipcRenderer.invoke('toggle-dayz-map-mod', id, folderName, isMap),
    toggleModStatus: (id: number, folderName: string, isDisabled: boolean) => ipcRenderer.invoke('toggle-dayz-mod-status', id, folderName, isDisabled),
    downloadMission: (id: number, modId: string) => ipcRenderer.invoke('download-dayz-mission', id, modId),
    extractLocalMission: (id: number, localMissionsPath: string) => ipcRenderer.invoke('extract-dayz-local-mission', id, localMissionsPath),
    rebuildModDependencies: (id: number | string) => ipcRenderer.invoke('rebuild-mod-dependencies', id),
    importLocalWorkshop: (id: number, workshopPath: string) => ipcRenderer.invoke('import-local-workshop', id, workshopPath)
  },

  steam: {
    searchWorkshop: (query: string, queryType?: number, page?: number, requiredTags?: string[]) => ipcRenderer.invoke('search-steam-workshop', query, queryType, page, requiredTags),
    getModDependencies: (modId: string) => ipcRenderer.invoke('get-mod-dependencies', modId),
    getWorkshopItemDetails: (modIds: string[]) => ipcRenderer.invoke('get-workshop-item-details', modIds),
    selectWorkshopFolder: () => ipcRenderer.invoke('select-workshop-folder'),
    installApp: (id: number, appId: number, username?: string, password?: string, steamGuardCode?: string) => ipcRenderer.invoke('install-steam-app', id, appId, username, password, steamGuardCode),
    checkCache: (appId: number) => ipcRenderer.invoke('check-steam-cache', appId),
    deleteCache: (appId: number) => ipcRenderer.invoke('delete-steam-cache', appId),
    updateCache: (id: number, appId: number, username?: string, password?: string, steamGuardCode?: string) => ipcRenderer.invoke('update-steam-cache', id, appId, username, password, steamGuardCode),
    copyCache: (id: number, appId: number) => ipcRenderer.invoke('copy-steam-cache', id, appId),
    sendCmdInput: (data: string) => ipcRenderer.invoke('send-steamcmd-input', data),
    onGuardPrompt: (callback: (message: string) => void) => {
      ipcRenderer.removeAllListeners('steam-guard-prompt')
      ipcRenderer.on('steam-guard-prompt', (_, message) => callback(message))
    }
  }
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