import { serverStorage } from '../storage/ServerStorage'
import { join } from 'path'
import fsPromises from 'fs/promises'
import axios from 'axios'
import AdmZip from 'adm-zip'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export interface DayzMapRepoInfo {
  name: string
  repoZip: string
  templates: string[]
}

export const DAYZ_MAP_REPOS: Record<string, DayzMapRepoInfo> = {
  '2289456201': {
    // Namalsk Island
    name: 'Namalsk',
    repoZip: 'https://github.com/SumrakDZN/Namalsk-Server/archive/refs/heads/main.zip',
    templates: ['regular.namalsk', 'hardcore.namalsk']
  },
  '2289461232': {
    // Namalsk Survival
    name: 'Namalsk',
    repoZip: 'https://github.com/SumrakDZN/Namalsk-Server/archive/refs/heads/main.zip',
    templates: ['regular.namalsk', 'hardcore.namalsk']
  },
  '1602372402': {
    // Deer Isle
    name: 'Deer Isle',
    repoZip: 'https://github.com/johnmclane666/Deerisle-Stable/archive/refs/heads/master.zip',
    templates: ['empty.deerisle']
  },
  '2699824632': {
    // Banov
    name: 'Banov',
    repoZip: 'https://github.com/jeffday/dayzserver/archive/refs/heads/master.zip',
    templates: ['empty.banov']
  },
  '2415195639': {
    // Banov (alternate workshop ID)
    name: 'Banov',
    repoZip: 'https://github.com/jeffday/dayzserver/archive/refs/heads/master.zip',
    templates: ['empty.banov']
  },
  '2938009193': {
    // Pripyat
    name: 'Pripyat',
    repoZip: 'https://github.com/FrenchiestFry15/PripyatMissionFiles/archive/refs/heads/main.zip',
    templates: ['serverMission.Pripyat']
  }
}

export class DayzMissionManager {
  static findMapRepo(identifier: string): DayzMapRepoInfo | null {
    if (!identifier) return null
    if (DAYZ_MAP_REPOS[identifier]) return DAYZ_MAP_REPOS[identifier]

    const lower = identifier.toLowerCase()
    if (lower.includes('namalsk')) return DAYZ_MAP_REPOS['2289456201']
    if (lower.includes('deerisle') || lower.includes('deer isle')) return DAYZ_MAP_REPOS['1602372402']
    if (lower.includes('banov')) return DAYZ_MAP_REPOS['2699824632']
    if (lower.includes('pripyat')) return DAYZ_MAP_REPOS['2938009193']

    return null
  }

  static async fetchDayzMission(serverId: number, modIdOrName: string) {
    let repoInfo = DAYZ_MAP_REPOS[modIdOrName]
    if (!repoInfo) {
      repoInfo = DayzMissionManager.findMapRepo(modIdOrName) || undefined!
    }
    if (!repoInfo || !repoInfo.repoZip) {
      throw new Error(`No mission repository found for map '${modIdOrName}'.`)
    }

    const serverDir = join(serverStorage.getPath(), serverId.toString())
    const mpmissionsDir = join(serverDir, 'mpmissions')
    const keysDir = join(serverDir, 'keys')

    if (!(await exists(mpmissionsDir))) {
      await fsPromises.mkdir(mpmissionsDir, { recursive: true })
    }
    if (!(await exists(keysDir))) {
      await fsPromises.mkdir(keysDir, { recursive: true })
    }

    // Download ZIP
    const response = await axios({
      url: repoInfo.repoZip,
      method: 'GET',
      responseType: 'arraybuffer',
      maxRedirects: 5
    })

    const tempZipPath = join(serverDir, `mission_${Date.now()}.zip`)
    await fsPromises.writeFile(tempZipPath, response.data)

    // Extract ZIP
    const zip = new AdmZip(tempZipPath)
    const tempExtractDir = join(serverDir, `temp_mission_${Date.now()}`)
    zip.extractAllTo(tempExtractDir, true)

    const templatesToFind = repoInfo.templates || []
    const extractedTemplates: string[] = []

    async function searchAndCopy(dir: string) {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const entryLower = entry.name.toLowerCase()
          const matchedTemplate = templatesToFind.find((t) => t.toLowerCase() === entryLower)
          if (matchedTemplate) {
            const targetPath = join(mpmissionsDir, matchedTemplate)
            if (await exists(targetPath)) {
              await fsPromises.rm(targetPath, { recursive: true, force: true })
            }
            await fsPromises.cp(join(dir, entry.name), targetPath, { recursive: true })
            extractedTemplates.push(matchedTemplate)
          } else if (entryLower === 'keys') {
            try {
              const keyFiles = await fsPromises.readdir(join(dir, entry.name))
              for (const kf of keyFiles) {
                if (kf.endsWith('.bikey')) {
                  await fsPromises.copyFile(join(dir, entry.name, kf), join(keysDir, kf))
                }
              }
            } catch {
              // Ignore individual key copy errors
            }
            await searchAndCopy(join(dir, entry.name))
          } else {
            await searchAndCopy(join(dir, entry.name))
          }
        }
      }
    }

    await searchAndCopy(tempExtractDir)

    // Cleanup
    await fsPromises.rm(tempZipPath, { force: true }).catch(() => {})
    await fsPromises.rm(tempExtractDir, { recursive: true, force: true }).catch(() => {})

    if (extractedTemplates.length === 0) {
      throw new Error(`None of the mission templates [${templatesToFind.join(', ')}] were found in the downloaded repository.`)
    }

    // Update serverDZ.cfg template if currently default or not set
    const cfgPath = join(serverDir, 'serverDZ.cfg')
    if (await exists(cfgPath)) {
      let cfgContent = await fsPromises.readFile(cfgPath, 'utf-8')
      const currentMatch = cfgContent.match(/template\s*=\s*"([^"]*)"/i)
      const currentTemplate = currentMatch ? currentMatch[1] : ''
      if (!currentTemplate || currentTemplate === 'dayzOffline.chernarusplus') {
        cfgContent = cfgContent.replace(/template\s*=\s*"[^"]*"/g, `template="${extractedTemplates[0]}"`)
        await fsPromises.writeFile(cfgPath, cfgContent, 'utf-8')
      }
    }

    return { success: true, templates: extractedTemplates }
  }

  static async extractLocalMission(serverId: number, localMissionsPath: string) {
    try {
      const serverDir = join(serverStorage.getPath(), serverId.toString())
      const mpmissionsDir = join(serverDir, 'mpmissions')

      if (!(await exists(mpmissionsDir))) {
        await fsPromises.mkdir(mpmissionsDir, { recursive: true })
      }

      // Read directories in localMissionsPath
      const entries = await fsPromises.readdir(localMissionsPath, { withFileTypes: true })
      const extractedTemplates: string[] = []

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sourcePath = join(localMissionsPath, entry.name)
          const destPath = join(mpmissionsDir, entry.name)

          if (await exists(destPath)) {
            await fsPromises.rm(destPath, { recursive: true, force: true })
          }
          await fsPromises.cp(sourcePath, destPath, { recursive: true })
          extractedTemplates.push(entry.name)
        }
      }

      if (extractedTemplates.length > 0) {
        const cfgPath = join(serverDir, 'serverDZ.cfg')
        if (await exists(cfgPath)) {
          let cfgContent = await fsPromises.readFile(cfgPath, 'utf-8')
          const currentMatch = cfgContent.match(/template\s*=\s*"([^"]*)"/i)
          const currentTemplate = currentMatch ? currentMatch[1] : ''
          if (!currentTemplate || currentTemplate === 'dayzOffline.chernarusplus') {
            cfgContent = cfgContent.replace(/template\s*=\s*"[^"]*"/g, `template="${extractedTemplates[0]}"`)
            await fsPromises.writeFile(cfgPath, cfgContent, 'utf-8')
          }
        }
      }

      return { success: true, templates: extractedTemplates }
    } catch (e: any) {
      console.error('Failed to extract local DayZ mission', e)
      throw e
    }
  }

  static async ensureInstalledMapMissions(serverId: number) {
    try {
      const serverDir = join(serverStorage.getPath(), serverId.toString())
      if (!(await exists(serverDir))) return []

      const mpmissionsDir = join(serverDir, 'mpmissions')
      if (!(await exists(mpmissionsDir))) {
        await fsPromises.mkdir(mpmissionsDir, { recursive: true })
      }

      const existingEntries = await fsPromises.readdir(mpmissionsDir, { withFileTypes: true }).catch(() => [])
      const existingMissions = new Set(existingEntries.filter((e) => e.isDirectory()).map((e) => e.name.toLowerCase()))

      const folders = await fsPromises.readdir(serverDir, { withFileTypes: true }).catch(() => [])
      const modFolders = folders.filter((f) => (f.isDirectory() || f.isSymbolicLink()) && f.name.startsWith('@'))

      const newlyInstalled: string[] = []

      for (const mod of modFolders) {
        const modDir = join(serverDir, mod.name)
        const isMapPath = join(modDir, 'is_map.txt')
        const modIdPath = join(modDir, 'modid.txt')
        let isMap = false
        if (await exists(isMapPath)) {
          const content = (await fsPromises.readFile(isMapPath, 'utf-8')).trim()
          isMap = content === 'true'
        }

        let modId = ''
        let modTitle = mod.name.substring(1)
        if (await exists(modIdPath)) {
          const content = (await fsPromises.readFile(modIdPath, 'utf-8')).trim()
          const parts = content.split(':')
          if (parts.length >= 2) {
            modId = parts.shift() || ''
            modTitle = parts.join(':')
          }
        } else {
          const metaPath = join(modDir, 'meta.cpp')
          if (await exists(metaPath)) {
            const metaContent = await fsPromises.readFile(metaPath, 'utf-8')
            const idMatch = metaContent.match(/publishedid\s*=\s*(\d+)/i)
            if (idMatch && idMatch[1]) modId = idMatch[1]
            const nameMatch = metaContent.match(/name\s*=\s*"([^"]+)"/i)
            if (nameMatch && nameMatch[1]) modTitle = nameMatch[1]
          }
        }

        const repoInfo =
          DayzMissionManager.findMapRepo(modId) ||
          DayzMissionManager.findMapRepo(modTitle) ||
          DayzMissionManager.findMapRepo(mod.name)

        if (isMap || repoInfo) {
          if (!isMap && repoInfo) {
            await fsPromises.writeFile(isMapPath, 'true', 'utf-8').catch(() => {})
          }

          const mp1 = join(modDir, 'mpmissions')
          const mp2 = join(modDir, 'ServerFiles', 'mpmissions')
          const localMissionsPath = (await exists(mp1)) ? mp1 : (await exists(mp2)) ? mp2 : ''

          if (localMissionsPath) {
            const localDirs = await fsPromises.readdir(localMissionsPath, { withFileTypes: true }).catch(() => [])
            const missingLocal = localDirs.filter((d) => d.isDirectory() && !existingMissions.has(d.name.toLowerCase()))
            if (missingLocal.length > 0) {
              const res = await DayzMissionManager.extractLocalMission(serverId, localMissionsPath)
              newlyInstalled.push(...res.templates)
              res.templates.forEach((t) => existingMissions.add(t.toLowerCase()))
            }
          } else if (repoInfo) {
            const missingTemplates = repoInfo.templates.filter((t) => !existingMissions.has(t.toLowerCase()))
            if (missingTemplates.length > 0) {
              try {
                const res = await DayzMissionManager.fetchDayzMission(serverId, modId || repoInfo.name)
                newlyInstalled.push(...res.templates)
                res.templates.forEach((t) => existingMissions.add(t.toLowerCase()))
              } catch (err) {
                console.warn(`[DayzMissionManager] Failed to auto-provision mission for ${modTitle}:`, err)
              }
            }
          }
        }
      }

      await DayzMissionManager.patchNamalskInitScript(serverDir)
      return newlyInstalled
    } catch (e) {
      console.error('Failed to ensure installed map missions', e)
      return []
    }
  }

  static async patchNamalskInitScript(serverDir: string) {
    try {
      const folders = await fsPromises.readdir(serverDir, { withFileTypes: true }).catch(() => [])
      let hasNamalskSurvival = false

      for (const f of folders) {
        if (!f.isDirectory() && !f.isSymbolicLink()) continue
        const lower = f.name.toLowerCase()
        if (lower.includes('namalsksurvival') || lower.includes('namalsk survival')) {
          hasNamalskSurvival = true
          break
        }
        const modIdPath = join(serverDir, f.name, 'modid.txt')
        if (await exists(modIdPath)) {
          const content = await fsPromises.readFile(modIdPath, 'utf-8')
          if (content.includes('2289461232')) {
            hasNamalskSurvival = true
            break
          }
        }
      }

      const mpmissionsDir = join(serverDir, 'mpmissions')
      const namalskMissionDirs = ['regular.namalsk', 'hardcore.namalsk']

      for (const subDir of namalskMissionDirs) {
        const initPath = join(mpmissionsDir, subDir, 'init.c')
        if (await exists(initPath)) {
          let content = await fsPromises.readFile(initPath, 'utf-8')
          if (!hasNamalskSurvival) {
            const activePattern = /(\n\s*)(if\s*\(\s*m_EventManagerServer\s*\)\s*\{[\s\S]*?m_EventManagerServer\.RegisterEvent[\s\S]*?\})/
            if (activePattern.test(content)) {
              content = content.replace(
                activePattern,
                '\n\t\t/* [OmniHost] Disabled until Namalsk Survival mod is installed:\n$2\n\t\t*/'
              )
              await fsPromises.writeFile(initPath, content, 'utf-8')
            }
          } else {
            const commentedPattern = /\/\*\s*\[OmniHost\] Disabled until Namalsk Survival mod is installed:\s*\n([\s\S]*?)\s*\n\t*\*\//
            if (commentedPattern.test(content)) {
              content = content.replace(commentedPattern, '$1')
              await fsPromises.writeFile(initPath, content, 'utf-8')
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to patch Namalsk init script', e)
    }
  }
}

