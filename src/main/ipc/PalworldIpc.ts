import { ipcMain, app } from 'electron'
import { PalworldConfigManager } from '../palworld/PalworldConfigManager'
import { PalworldModManager } from '../palworld/PalworldModManager'
import fs from 'fs'
import path from 'path'

export function registerPalworldIpc() {
  ipcMain.handle('get-palworld-config', async (_, serverId: number) => {
    return await PalworldConfigManager.getConfig(serverId)
  })

  ipcMain.handle(
    'set-palworld-config',
    async (_, serverId: number, config: Record<string, string>) => {
      return await PalworldConfigManager.setConfig(serverId, config)
    }
  )

  ipcMain.handle(
    'search-palworld-mods',
    async (_, query: string, categoryId?: number, index?: number, pageSize?: number) => {
      return await PalworldModManager.searchMods(query, categoryId, index, pageSize)
    }
  )

  ipcMain.handle('get-palworld-mod', async (_, modId: number) => {
    return await PalworldModManager.getModDetails(modId)
  })

  ipcMain.handle(
    'install-palworld-mod',
    async (_, serverId: number, modId: number, fileId: number) => {
      return await PalworldModManager.installMod(serverId, modId, fileId)
    }
  )

  ipcMain.handle('get-installed-palworld-mods', async (_, serverId: number) => {
    return await PalworldModManager.getInstalledMods(serverId)
  })

  ipcMain.handle(
    'uninstall-palworld-mod',
    async (_, serverId: number, modType: string, modName: string) => {
      const serverDir = path.join(app.getPath('userData'), 'servers', serverId.toString())
      let targetPath = ''
      if (modType === 'Pak') {
        targetPath = path.join(serverDir, 'Pal', 'Content', 'Paks', 'LogicMods', modName)
      } else if (modType === 'UE4SS') {
        targetPath = path.join(serverDir, 'Pal', 'Binaries', 'Win64', 'Mods', modName)
      }

      if (targetPath && fs.existsSync(targetPath)) {
        if (fs.statSync(targetPath).isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true })
        } else {
          fs.unlinkSync(targetPath)
        }
        return true
      }
      return false
    }
  )

  ipcMain.handle('get-banned-players', async (_, serverId: number) => {
    const serverDir = path.join(app.getPath('userData'), 'servers', serverId.toString())
    const banlistPath = path.join(serverDir, 'Pal', 'Saved', 'SaveGames', 'banlist.txt')
    const namesFile = path.join(serverDir, 'banned_names.json')
    let namesMap: Record<string, string> = {}
    if (fs.existsSync(namesFile)) {
      try { namesMap = JSON.parse(fs.readFileSync(namesFile, 'utf8')) } catch (e) {}
    }
    
    if (fs.existsSync(banlistPath)) {
      const data = fs.readFileSync(banlistPath, 'utf8')
      const lines = data.split('\n').map(l => l.trim()).filter(l => l)
      return lines.map(line => {
        const parts = line.split(',')
        const userId = parts[0] || 'Unknown'
        const playerId = parts[1] || 'Unknown'
        return {
          userId,
          playerId,
          name: namesMap[userId] || namesMap[playerId] || null
        }
      })
    }
    return []
  })
}
