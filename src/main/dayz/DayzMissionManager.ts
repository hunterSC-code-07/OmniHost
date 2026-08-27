import { app } from 'electron'
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

export const DAYZ_MAP_REPOS: Record<string, { name: string; repoZip: string; template: string }> = {
  '2289456201': {
    // Namalsk Island
    name: 'Namalsk',
    repoZip: 'https://github.com/SumrakDZN/Namalsk-Server/archive/refs/heads/master.zip',
    template: 'regular.namalsk'
  },
  '1602372402': {
    // Deer Isle
    name: 'Deer Isle',
    repoZip:
      'https://github.com/ExpansionModTeam/DayZ-Expansion-Missions/archive/refs/heads/master.zip',
    template: 'empty.deerisle'
  },
  '2699824632': {
    // Banov
    name: 'Banov',
    repoZip: 'https://github.com/KubeloLive/Banov/archive/refs/heads/main.zip',
    template: 'empty.banov'
  },
  '2938009193': {
    // Pripyat
    name: 'Pripyat',
    repoZip: 'https://github.com/FrenchiestFry15/PripyatMissionFiles/archive/refs/heads/main.zip',
    template: 'serverMission.Pripyat'
  }
}

export class DayzMissionManager {
  static async fetchDayzMission(serverId: number, modId: string) {
    const repoInfo = DAYZ_MAP_REPOS[modId]
    if (!repoInfo || !repoInfo.repoZip) {
      throw new Error('No mission repository found for this map mod.')
    }
    const serverDir = join(app.getPath('userData'), 'servers', serverId.toString())
    const mpmissionsDir = join(serverDir, 'mpmissions')

    if (!(await exists(mpmissionsDir))) {
      await fsPromises.mkdir(mpmissionsDir, { recursive: true })
    }

    // Download ZIP
    const response = await axios({
      url: repoInfo.repoZip,
      method: 'GET',
      responseType: 'arraybuffer'
    })

    const tempZipPath = join(serverDir, `mission_${modId}_${Date.now()}.zip`)
    await fsPromises.writeFile(tempZipPath, response.data)

    // Extract ZIP
    const zip = new AdmZip(tempZipPath)

    const tempExtractDir = join(serverDir, `temp_mission_${modId}_${Date.now()}`)
    zip.extractAllTo(tempExtractDir, true)

    // Recursively search for the template folder
    let foundMissionPath = ''
    async function findFolder(dir: string, targetFolder: string) {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name.toLowerCase() === targetFolder.toLowerCase()) {
            foundMissionPath = join(dir, entry.name)
            return
          }
          await findFolder(join(dir, entry.name), targetFolder)
        }
      }
    }

    await findFolder(tempExtractDir, repoInfo.template)

    if (foundMissionPath) {
      const targetPath = join(mpmissionsDir, repoInfo.template)
      if (await exists(targetPath)) {
        await fsPromises.rm(targetPath, { recursive: true, force: true })
      }
      await fsPromises.cp(foundMissionPath, targetPath, { recursive: true })
    } else {
      throw new Error(`Mission folder ${repoInfo.template} not found in the downloaded repository.`)
    }

    // Cleanup
    await fsPromises.rm(tempZipPath, { force: true })
    await fsPromises.rm(tempExtractDir, { recursive: true, force: true })

    // Update serverDZ.cfg
    const cfgPath = join(serverDir, 'serverDZ.cfg')
    if (await exists(cfgPath)) {
      let cfgContent = await fsPromises.readFile(cfgPath, 'utf-8')
      cfgContent = cfgContent.replace(/template\s*=\s*"[^"]*"/g, `template="${repoInfo.template}"`)
      await fsPromises.writeFile(cfgPath, cfgContent, 'utf-8')
    }

    return true
  }

  static async extractLocalMission(serverId: number, localMissionsPath: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString())
      const mpmissionsDir = join(serverDir, 'mpmissions')

      if (!(await exists(mpmissionsDir))) {
        await fsPromises.mkdir(mpmissionsDir, { recursive: true })
      }

      // Read directories in localMissionsPath
      const entries = await fsPromises.readdir(localMissionsPath, { withFileTypes: true })
      let firstTemplate = ''

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sourcePath = join(localMissionsPath, entry.name)
          const destPath = join(mpmissionsDir, entry.name)

          if (await exists(destPath)) {
            await fsPromises.rm(destPath, { recursive: true, force: true })
          }
          await fsPromises.cp(sourcePath, destPath, { recursive: true })

          if (!firstTemplate) {
            firstTemplate = entry.name
          }
        }
      }

      if (firstTemplate) {
        const cfgPath = join(serverDir, 'serverDZ.cfg')
        if (await exists(cfgPath)) {
          let cfgContent = await fsPromises.readFile(cfgPath, 'utf-8')
          cfgContent = cfgContent.replace(/template\s*=\s*"[^"]*"/g, `template="${firstTemplate}"`)
          await fsPromises.writeFile(cfgPath, cfgContent, 'utf-8')
        }
      }

      return true
    } catch (e: any) {
      console.error('Failed to extract local DayZ mission', e)
      throw e
    }
  }
}
