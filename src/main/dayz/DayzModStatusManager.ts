import { serverStorage } from '../storage/ServerStorage'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import { SteamWebAPI } from '../api/SteamWebAPI'
import { DayzMissionManager, DAYZ_MAP_REPOS } from './DayzMissionManager'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export class DayzModStatusManager {
  static async rebuildModDependencies(serverId: number) {
    try {
      const serverDir = join(serverStorage.getPath(), serverId.toString())
      const depsPath = join(serverDir, 'mod_dependencies.json')
      const modDeps: Record<string, string[]> = {}

      const folders = await fsPromises.readdir(serverDir, { withFileTypes: true })
      const mods = folders.filter(
        (f) => (f.isDirectory() || f.isSymbolicLink()) && f.name.startsWith('@')
      )

      for (const mod of mods) {
        const modDir = join(serverDir, mod.name)
        const modIdPath = join(modDir, 'modid.txt')
        if (fs.existsSync(modIdPath)) {
          const content = fs.readFileSync(modIdPath, 'utf-8').trim()
          const parts = content.split(':')
          if (parts.length >= 2) {
            const modId = parts.shift() || ''
            if (modId) {
              const deps = await SteamWebAPI.getModDependencies(modId)
              modDeps[modId] = deps
            }
          }
        }
      }

      await fsPromises.writeFile(depsPath, JSON.stringify(modDeps, null, 2))
      return modDeps
    } catch (e) {
      console.error('rebuild-mod-dependencies error:', e)
      throw e
    }
  }

  static async getInstalledMods(serverId: number) {
    try {
      const serverDir = join(serverStorage.getPath(), serverId.toString())
      if (!(await exists(serverDir))) return []

      const folders = await fsPromises.readdir(serverDir, { withFileTypes: true })
      const mods = folders.filter(
        (f) => (f.isDirectory() || f.isSymbolicLink()) && f.name.startsWith('@')
      )

      const modDetails = await Promise.all(
        mods.map(async (f) => {
          const modDir = join(serverDir, f.name)
          const modIdPath = join(modDir, 'modid.txt')
          const isMapPath = join(modDir, 'is_map.txt')
          const disabledPath = join(modDir, 'disabled.txt')
          let title = f.name.substring(1)
          let idStr = ''
          if (fs.existsSync(modIdPath)) {
            const content = fs.readFileSync(modIdPath, 'utf-8').trim()
            const parts = content.split(':')
            if (parts.length >= 2) {
              idStr = parts.shift() || ''
              title = parts.join(':')
            }
          } else {
            // Fallback to meta.cpp for locally imported mods
            const metaPath = join(modDir, 'meta.cpp')
            if (fs.existsSync(metaPath)) {
              const metaContent = fs.readFileSync(metaPath, 'utf-8')
              const idMatch = metaContent.match(/publishedid\s*=\s*(\d+)/i)
              if (idMatch && idMatch[1]) {
                idStr = idMatch[1]
              }
              const nameMatch = metaContent.match(/name\s*=\s*"([^"]+)"/i)
              if (nameMatch && nameMatch[1]) {
                title = nameMatch[1]
              }
            }
          }

          let isMap = false
          if (fs.existsSync(isMapPath)) {
            const isMapContent = fs.readFileSync(isMapPath, 'utf-8').trim()
            isMap = isMapContent === 'true'
          } else {
            const repo =
              (idStr && DAYZ_MAP_REPOS[idStr]) ||
              DayzMissionManager.findMapRepo(idStr) ||
              DayzMissionManager.findMapRepo(title) ||
              DayzMissionManager.findMapRepo(f.name)

            if (repo) {
              isMap = true
              fs.writeFileSync(isMapPath, 'true', 'utf-8')
            } else {
              const mpmissionsPath1 = join(modDir, 'mpmissions')
              const mpmissionsPath2 = join(modDir, 'ServerFiles', 'mpmissions')
              if (fs.existsSync(mpmissionsPath1) || fs.existsSync(mpmissionsPath2)) {
                isMap = true
                fs.writeFileSync(isMapPath, 'true', 'utf-8')
              }
            }
          }

          let hasLocalMissions = false
          let localMissionsPath = ''
          const mp1 = join(modDir, 'mpmissions')
          const mp2 = join(modDir, 'ServerFiles', 'mpmissions')
          if (fs.existsSync(mp1)) {
            hasLocalMissions = true
            localMissionsPath = mp1
          } else if (fs.existsSync(mp2)) {
            hasLocalMissions = true
            localMissionsPath = mp2
          }

          const isDisabled = fs.existsSync(disabledPath)

          return {
            id: idStr || f.name,
            title,
            folderName: f.name,
            isMap,
            hasLocalMissions,
            localMissionsPath,
            isDisabled
          }
        })
      )

      return modDetails
    } catch (e) {
      console.error('Failed to get installed DayZ mods', e)
      return []
    }
  }

  static async toggleMapMod(serverId: number, folderName: string, isMap: boolean) {
    try {
      const serverDir = join(serverStorage.getPath(), serverId.toString())
      const modDir = join(serverDir, folderName)
      if (await exists(modDir)) {
        await fsPromises.writeFile(join(modDir, 'is_map.txt'), isMap ? 'true' : 'false', 'utf-8')

        let missionResult: any = null
        if (isMap) {
          // Check for local missions
          const mp1 = join(modDir, 'mpmissions')
          const mp2 = join(modDir, 'ServerFiles', 'mpmissions')
          const localMissionsPath = fs.existsSync(mp1) ? mp1 : fs.existsSync(mp2) ? mp2 : ''

          if (localMissionsPath) {
            missionResult = await DayzMissionManager.extractLocalMission(serverId, localMissionsPath)
          } else {
            // Find modId and title
            let modId = ''
            let modTitle = folderName.replace(/^@/, '')
            const modIdPath = join(modDir, 'modid.txt')
            if (fs.existsSync(modIdPath)) {
              const content = fs.readFileSync(modIdPath, 'utf-8').trim()
              const parts = content.split(':')
              if (parts.length >= 2) {
                modId = parts.shift() || ''
                modTitle = parts.join(':')
              }
            } else {
              const metaPath = join(modDir, 'meta.cpp')
              if (fs.existsSync(metaPath)) {
                const metaContent = fs.readFileSync(metaPath, 'utf-8')
                const idMatch = metaContent.match(/publishedid\s*=\s*(\d+)/i)
                if (idMatch && idMatch[1]) modId = idMatch[1]
                const nameMatch = metaContent.match(/name\s*=\s*"([^"]+)"/i)
                if (nameMatch && nameMatch[1]) modTitle = nameMatch[1]
              }
            }

            const repoInfo =
              DayzMissionManager.findMapRepo(modId) ||
              DayzMissionManager.findMapRepo(modTitle) ||
              DayzMissionManager.findMapRepo(folderName)

            if (repoInfo) {
              missionResult = await DayzMissionManager.fetchDayzMission(serverId, modId || repoInfo.name)
            }
          }
        }

        return { success: true, isMap, missionResult }
      }
      return { success: false }
    } catch (e: any) {
      console.error('Failed to toggle DayZ map mod', e)
      return { success: false, error: e.message }
    }
  }

  static async toggleModStatus(serverId: number, folderName: string, isDisabled: boolean) {
    try {
      const serverDir = join(serverStorage.getPath(), serverId.toString())
      const modDir = join(serverDir, folderName)
      if (await exists(modDir)) {
        const disabledPath = join(modDir, 'disabled.txt')
        if (isDisabled) {
          await fsPromises.writeFile(disabledPath, 'true', 'utf-8')
        } else {
          if (await exists(disabledPath)) {
            await fsPromises.rm(disabledPath)
          }
        }
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to toggle DayZ mod status', e)
      return false
    }
  }
}
