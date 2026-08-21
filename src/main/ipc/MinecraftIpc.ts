import { app, ipcMain } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import axios from 'axios'
import semver from 'semver'
import extractZip from 'extract-zip'
import { spawn } from 'child_process'
import { CacheManager } from '../CacheManager'
import { JavaManager } from '../adapters/JavaManager'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}
const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY || ''

export function registerMinecraftIpc(activeServers: Record<number, any>) {
  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-vanilla-versions', async () => {
    try {
      const res = await axios.get(
        'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json'
      )
      const releases = res.data.versions.filter((v: any) => v.type === 'release')
      return releases
        .map((v: any) => v.id)
        .filter((v: string) => {
          const coerced = semver.coerce(v)
          return coerced && semver.gte(coerced, '1.16.0')
        })
    } catch (e) {
      console.error(e)
      return []
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-paper-versions', async () => {
    try {
      const res = await axios.get('https://fill.papermc.io/v3/projects/paper', {
        headers: { 'User-Agent': 'OmniHost/1.0.0 (contact@example.com)' }
      })
      const versionsObj = res.data.versions
      let allVersions: string[] = []
      for (const key of Object.keys(versionsObj)) {
        allVersions = allVersions.concat(versionsObj[key])
      }
      return allVersions
        .filter((v: string) => {
          const coerced = semver.coerce(v)
          return coerced && semver.gte(coerced, '1.16.0')
        })
        .sort((a, b) => {
          const cA = semver.coerce(a)
          const cB = semver.coerce(b)
          return cA && cB ? semver.rcompare(cA, cB) : 0
        }) // newest first
    } catch (e) {
      console.error(e)
      return []
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-fabric-versions', async () => {
    try {
      const res = await axios.get('https://meta.fabricmc.net/v2/versions/game')
      return res.data.filter((v: any) => v.stable).map((v: any) => v.version)
    } catch (e) {
      console.error(e)
      return []
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-forge-versions', async () => {
    try {
      const res = await axios.get(
        'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
      )
      const promos = res.data.promos
      const versions = new Set<string>()
      for (const key of Object.keys(promos)) {
        if (key.endsWith('-latest')) {
          versions.add(key.replace('-latest', ''))
        }
      }
      return Array.from(versions).reverse()
    } catch (e) {
      console.error(e)
      return []
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-neoforge-versions', async () => {
    try {
      const res = await axios.get(
        'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge'
      )
      const all: string[] = res.data.versions
      const mcVersions = new Set<string>()
      for (const v of all) {
        const parts = v.split('.')
        if (parts.length >= 2) {
          if (parts[0] === '20' || parts[0] === '21') {
            mcVersions.add('1.' + parts[0] + '.' + parts[1])
          } else {
            mcVersions.add(parts[0] + '.' + parts[1])
          }
        }
      }
      return Array.from(mcVersions).reverse()
    } catch (e) {
      console.error(e)
      return []
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-loader-versions', async (_, type: string, mcVersion: string) => {
    try {
      if (type === 'Forge') {
        const promoRes = await axios.get(
          'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
        )
        const recommended = promoRes.data.promos[`${mcVersion}-recommended`]

        const mavenRes = await axios.get(
          'https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml'
        )
        const xml = mavenRes.data
        const versionMatches = xml.match(/<version>(.*?)<\/version>/g) || []

        const versions = new Set<string>()
        for (const vTag of versionMatches) {
          const v = vTag.replace('<version>', '').replace('</version>', '')
          if (v.startsWith(mcVersion + '-')) {
            versions.add(v.replace(mcVersion + '-', ''))
          }
        }

        let result = Array.from(versions).sort((a, b) => {
          const vA = a.split('.').map(Number)
          const vB = b.split('.').map(Number)
          for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
            const numA = vA[i] || 0
            const numB = vB[i] || 0
            if (numA !== numB) return numB - numA
          }
          return 0
        })

        if (recommended && result.includes(recommended)) {
          result = result.filter((v) => v !== recommended)
          result.unshift(recommended + ' (Recommended)')
        }
        return result
      } else if (type === 'Fabric') {
        const res = await axios.get('https://meta.fabricmc.net/v2/versions/loader')
        const loaders = res.data
        return loaders.map((l: any) => l.version)
      } else if (type === 'NeoForge') {
        const res = await axios.get(
          'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge'
        )
        const all: string[] = res.data.versions

        let prefix = mcVersion.replace('1.', '')
        if (mcVersion.startsWith('1.20') || mcVersion.startsWith('1.21')) {
          prefix = prefix.split('.')[0] + '.'
        } else {
          prefix = prefix + '.'
        }

        const versions = all.filter((v: string) => v.startsWith(prefix))
        return versions.sort((a, b) => {
          const vA = a.split('.').map(Number)
          const vB = b.split('.').map(Number)
          for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
            const numA = vA[i] || 0
            const numB = vB[i] || 0
            if (numA !== numB) return numB - numA
          }
          return 0
        })
      }
      return []
    } catch (e: any) {
      console.error('Error fetching loader versions:', e.message)
      return []
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('search-modpacks', async (_, query, version, modloader) => {
    try {
      let url = `https://api.curseforge.com/v1/mods/search?gameId=432&classId=4471&sortField=2&sortOrder=desc`
      if (query) url += `&searchFilter=${encodeURIComponent(query)}`
      if (version) {
        const cfVersion =
          version.endsWith('.0') && version.split('.').length === 3 ? version.slice(0, -2) : version
        url += `&gameVersion=${encodeURIComponent(cfVersion)}`
      }
      if (modloader) {
        if (modloader === 'Forge') url += '&modLoaderType=1'
        else if (modloader === 'Fabric') url += '&modLoaderType=4'
        else if (modloader === 'NeoForge') url += '&modLoaderType=6'
      }

      const res = await axios.get(url, { headers: { 'x-api-key': CURSEFORGE_API_KEY } })
      return res.data.data
    } catch (e: any) {
      console.error('Error searching modpacks:', e.message)
      return []
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-modpack-details', async (_, modId) => {
    try {
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}`, {
        headers: { 'x-api-key': CURSEFORGE_API_KEY }
      })
      return res.data.data
    } catch (e: any) {
      console.error(e.message)
      return null
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle(
    'search-curseforge-mods',
    async (_, search, type, version, page, classId = 6, sortField = 2) => {
      try {
        let modLoaderType = 0
        if (type === 'Forge') modLoaderType = 1
        else if (type === 'Fabric') modLoaderType = 4
        else if (type === 'NeoForge') modLoaderType = 6

        const index = page * 20
        const cfVersion =
          version.endsWith('.0') && version.split('.').length === 3 ? version.slice(0, -2) : version
        let url = `https://api.curseforge.com/v1/mods/search?gameId=432&classId=${classId}&sortField=${sortField}&sortOrder=desc&gameVersion=${cfVersion}&index=${index}&pageSize=20`

        // Only apply modLoaderType for the "Mods" class (id 6)
        if (classId === 6 && modLoaderType !== 0) {
          url += `&modLoaderType=${modLoaderType}`
        }

        if (search) url += `&searchFilter=${encodeURIComponent(search)}`

        const res = await axios.get(url, { headers: { 'x-api-key': CURSEFORGE_API_KEY } })
        return res.data.data
      } catch (e: any) {
        console.error(e.message)
        return []
      }
    }
  )

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-curseforge-mod', async (_, modId) => {
    try {
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}`, {
        headers: { 'x-api-key': CURSEFORGE_API_KEY }
      })
      return res.data.data
    } catch (e: any) {
      console.error(e.message)
      return null
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-curseforge-file', async (_, modId, fileId) => {
    try {
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}/files/${fileId}`, {
        headers: { 'x-api-key': CURSEFORGE_API_KEY }
      })
      return res.data.data
    } catch (e: any) {
      console.error(e.message)
      return null
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('install-curseforge-mod', async (_, id, downloadUrl, fileName, classId = 6) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())

      let destFolder = 'mods'
      if (classId === 5) destFolder = 'plugins'
      else if (classId === 6945) destFolder = join('world', 'datapacks')
      else if (classId === 12) destFolder = 'resourcepacks'

      const targetDir = join(serverDir, destFolder)
      if (!(await exists(targetDir))) {
        await fsPromises.mkdir(targetDir, { recursive: true })
      }

      const filePath = join(targetDir, fileName)
      const cachedFile = await CacheManager.getOrDownload('mods', downloadUrl, fileName)
      await fsPromises.copyFile(cachedFile, filePath)

      return true
    } catch (e: any) {
      console.error(e.message)
      return false
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('get-installed-mods', async (_, id) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const modsDir = join(serverDir, 'mods')
      if (!(await exists(modsDir))) return []

      const files = await fsPromises.readdir(modsDir)
      const jarFiles = files.filter((f) => f.endsWith('.jar'))
      const modsInfo = await Promise.all(
        jarFiles.map(async (f) => {
          const stats = await fsPromises.stat(join(modsDir, f))
          return { name: f, size: stats.size }
        })
      )
      return modsInfo
    } catch (e: any) {
      console.error(e.message)
      return []
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('delete-mod', async (_, id, fileName) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const filePath = join(serverDir, 'mods', fileName)
      if (await exists(filePath)) {
        await fsPromises.unlink(filePath)
        return true
      }
      return false
    } catch (e: any) {
      console.error(e.message)
      return false
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('install-curseforge-modpack', async (event, id, modId, version) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())

    try {
      event.sender.send(`download-progress-${id}`, 0, 'Fetching pack details...')

      const filesRes = await axios.get(`https://api.curseforge.com/v1/mods/${modId}/files`, {
        headers: { 'x-api-key': CURSEFORGE_API_KEY }
      })
      const allFiles: any[] = filesRes.data.data

      // Try to find the latest file for the requested version
      let match = allFiles.filter((f) => f.gameVersions.includes(version))
      if (match.length === 0) match = allFiles // Fallback to latest

      match.sort((a, b) => new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime())

      let targetFile = match[0]
      let isServerPack = false

      if (targetFile.serverPackFileId) {
        const serverFile = allFiles.find((f) => f.id === targetFile.serverPackFileId)
        if (serverFile) {
          targetFile = serverFile
          isServerPack = true
        } else {
          try {
            const singleRes = await axios.get(
              `https://api.curseforge.com/v1/mods/${modId}/files/${targetFile.serverPackFileId}`,
              { headers: { 'x-api-key': CURSEFORGE_API_KEY } }
            )
            targetFile = singleRes.data.data
            isServerPack = true
          } catch (e) {}
        }
      } else if (targetFile.fileName.toLowerCase().includes('server')) {
        isServerPack = true
      }

      if (!targetFile.downloadUrl)
        throw new Error('Modpack file does not expose a direct download URL.')

      event.sender.send(
        `download-progress-${id}`,
        0,
        `Downloading ${isServerPack ? 'Server Pack' : 'Client Pack'}...`
      )

      const zipPath = join(serverDir, 'modpack.zip')
      const cachedFile = await CacheManager.getOrDownload(
        'modpacks',
        targetFile.downloadUrl,
        targetFile.fileName,
        (progress, text) => {
          event.sender.send(
            `download-progress-${id}`,
            progress,
            isServerPack
              ? text === 'Downloading...'
                ? 'Downloading Server Pack...'
                : text
              : text === 'Downloading...'
                ? 'Downloading Client Pack...'
                : text
          )
        }
      )

      await fsPromises.copyFile(cachedFile, zipPath)

      event.sender.send(`download-progress-${id}`, 100, 'Extracting pack...')

      await extractZip(zipPath, { dir: serverDir })
      await fsPromises.unlink(zipPath)

      const overridesDir = join(serverDir, 'overrides')
      let modloader = 'Forge'

      if (isServerPack) {
        // Find if extracted into a subfolder
        const files = await fsPromises.readdir(serverDir)
        if (files.length === 2 && files.includes('omnihost.json')) {
          const sub = files.find((f) => f !== 'omnihost.json')
          if (sub && (await fsPromises.stat(join(serverDir, sub))).isDirectory()) {
            const subPath = join(serverDir, sub)
            for (const subFile of await fsPromises.readdir(subPath)) {
              await fsPromises.rename(join(subPath, subFile), join(serverDir, subFile))
            }
            await fsPromises.rmdir(subPath)
          }
        }
        event.sender.send(
          `download-progress-${id}`,
          100,
          'Server Pack Extracted! Installing Modloader if needed...'
        )

        // Search for Forge or NeoForge installer in the extracted files and run it
        const extracted = await fsPromises.readdir(serverDir)
        const installer = extracted.find(
          (f) =>
            (f.startsWith('forge-') || f.startsWith('neoforge-')) &&
            f.includes('installer') &&
            f.endsWith('.jar')
        )
        if (installer) {
          let javaRequired: 8 | 16 | 17 | 21 | 25 = 17
          const coerced = semver.coerce(version)
          if (coerced) {
            if (semver.lt(coerced, '1.17.0')) javaRequired = 8
            else if (semver.lt(coerced, '1.18.0')) javaRequired = 16
            else if (semver.lt(coerced, '1.20.5')) javaRequired = 17
            else if (semver.lt(coerced, '26.0.0')) javaRequired = 21
            else javaRequired = 25
          }
          const javaPath = await JavaManager.getJavaPath(javaRequired)
          await new Promise((resolve, reject) => {
            const proc = spawn(javaPath, ['-jar', installer, '--installServer'], {
              cwd: serverDir,
              stdio: 'inherit'
            })
            proc.on('close', resolve)
            proc.on('error', reject)
          })
          await fsPromises.unlink(join(serverDir, installer))
        }
      } else {
        event.sender.send(
          `download-progress-${id}`,
          100,
          'Parsing manifest and downloading mods...'
        )
        const manifestPath = join(serverDir, 'manifest.json')
        if (!(await exists(manifestPath)))
          throw new Error('Invalid Client Pack: Missing manifest.json')

        const manifest = JSON.parse(await fsPromises.readFile(manifestPath, 'utf-8'))
        const modsDir = join(serverDir, 'mods')
        if (!(await exists(modsDir))) await fsPromises.mkdir(modsDir)

        const modFiles = manifest.files || []
        let count = 0
        for (const mod of modFiles) {
          count++
          event.sender.send(
            `download-progress-${id}`,
            Math.round((count / modFiles.length) * 100),
            `Downloading Mods (${count}/${modFiles.length})...`
          )
          try {
            const fRes = await axios.get(
              `https://api.curseforge.com/v1/mods/${mod.projectID}/files/${mod.fileID}/download-url`,
              { headers: { 'x-api-key': CURSEFORGE_API_KEY } }
            )
            let dUrl = fRes.data.data
            if (!dUrl) {
              const manualRes = await axios.get(
                `https://api.curseforge.com/v1/mods/${mod.projectID}/files/${mod.fileID}`,
                { headers: { 'x-api-key': CURSEFORGE_API_KEY } }
              )
              dUrl = manualRes.data.data.downloadUrl
            }
            if (dUrl) {
              const nameParts = dUrl.split('/')
              const fileName = decodeURIComponent(nameParts[nameParts.length - 1])
              const cachedOverride = await CacheManager.getOrDownload('mods', dUrl, fileName)
              await fsPromises.copyFile(cachedOverride, join(modsDir, fileName))
            }
          } catch (e) {
            console.error('Failed to download mod', mod.projectID)
          }
        }

        if (await exists(overridesDir)) {
          const cp = require('child_process')
          if (process.platform === 'win32') {
            cp.execSync(`xcopy "${overridesDir}\\*" "${serverDir}\\" /s /e /y`)
          } else {
            cp.execSync(`cp -r "${overridesDir}/"* "${serverDir}/"`)
          }
          await fsPromises.rm(overridesDir, { recursive: true, force: true })
        }

        if (manifest.minecraft.modLoaders && manifest.minecraft.modLoaders.length > 0) {
          const mlId = manifest.minecraft.modLoaders[0].id.toLowerCase()
          if (mlId.includes('fabric')) modloader = 'Fabric'
          else if (mlId.includes('neoforge')) modloader = 'NeoForge'
        }

        const configPath = join(serverDir, 'omnihost.json')
        if (await exists(configPath)) {
          const conf = JSON.parse(await fsPromises.readFile(configPath, 'utf-8'))
          conf.type = modloader
          await fsPromises.writeFile(configPath, JSON.stringify(conf, null, 2))
        }
      }

      return {
        isClientPack: !isServerPack,
        modloader: !isServerPack ? modloader : undefined,
        version
      }
    } catch (e: any) {
      console.error(e)
      throw new Error(e.message)
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  ipcMain.handle('download-server-jar', async (event, id, type, version, loaderVersion) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const jarPath = join(serverDir, 'server.jar')
    const installerPath = join(serverDir, 'installer.jar')

    try {
      let downloadUrl = ''
      let isInstaller = false
      let installerArgs: string[] = []
      let buildNumberStr = ''

      if (type === 'Vanilla') {
        const manifestRes = await axios.get(
          'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json'
        )
        const vData = manifestRes.data.versions.find((v: any) => v.id === version)
        if (!vData) throw new Error('Version not found')
        const vRes = await axios.get(vData.url)
        downloadUrl = vRes.data.downloads.server.url
      } else if (type === 'Paper') {
        const buildsRes = await axios.get(
          `https://fill.papermc.io/v3/projects/paper/versions/${version}`,
          { headers: { 'User-Agent': 'OmniHost/1.0.0 (contact@example.com)' } }
        )
        const build = buildsRes.data.builds[0]
        buildNumberStr = `-b${build}`
        const buildData = await axios.get(
          `https://fill.papermc.io/v3/projects/paper/versions/${version}/builds/${build}`,
          { headers: { 'User-Agent': 'OmniHost/1.0.0 (contact@example.com)' } }
        )
        downloadUrl = buildData.data.downloads['server:default'].url
      } else if (type === 'Fabric') {
        const loader = loaderVersion
          ? loaderVersion.replace(' (Recommended)', '')
          : (await axios.get('https://meta.fabricmc.net/v2/versions/loader')).data.find(
              (v: any) => v.stable
            ).version
        const installerRes = await axios.get('https://meta.fabricmc.net/v2/versions/installer')
        const installer = installerRes.data.find((v: any) => v.stable).version
        downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${loader}/${installer}/server/jar`
      } else if (type === 'Forge') {
        let forgeVersion = loaderVersion ? loaderVersion.replace(' (Recommended)', '') : null
        if (!forgeVersion) {
          const forgeRes = await axios.get(
            'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
          )
          forgeVersion =
            forgeRes.data.promos[version + '-latest'] ||
            forgeRes.data.promos[version + '-recommended']
        }
        if (!forgeVersion) throw new Error('Forge version not found for ' + version)
        downloadUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${version}-${forgeVersion}/forge-${version}-${forgeVersion}-installer.jar`
        isInstaller = true
        installerArgs = ['--installServer']
      } else if (type === 'NeoForge') {
        let neoVersion = loaderVersion ? loaderVersion.replace(' (Recommended)', '') : null
        if (!neoVersion) {
          const neoRes = await axios.get(
            'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge'
          )
          const all: string[] = neoRes.data.versions
          const prefix = version.startsWith('1.') ? version.substring(2) : version
          const matched = all
            .filter((v: string) => v.startsWith(prefix + '.'))
            .sort((a: string, b: string) => semver.rcompare(semver.coerce(a)!, semver.coerce(b)!))
          if (matched.length === 0) throw new Error('NeoForge version not found for ' + version)
          neoVersion = matched[0]
        }
        downloadUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVersion}/neoforge-${neoVersion}-installer.jar`
        isInstaller = true
        installerArgs = ['--installServer']
      }

      if (!downloadUrl) throw new Error('Could not resolve download URL')

      const targetPath = isInstaller ? installerPath : jarPath
      const fileName = `${type}-${version}${buildNumberStr}${isInstaller ? '-installer' : ''}.jar`
      const cachedFile = await CacheManager.getOrDownload(
        'jars',
        downloadUrl,
        fileName,
        (progress, text) => {
          event.sender.send(
            `download-progress-${id}`,
            progress,
            isInstaller
              ? text === 'Downloading...'
                ? 'Downloading Installer...'
                : text
              : text === 'Downloading...'
                ? 'Downloading Jar...'
                : text
          )
        }
      )

      await fsPromises.copyFile(cachedFile, targetPath)

      if (isInstaller) {
        event.sender.send(`download-progress-${id}`, 100, 'Installing Modloader...')

        let javaRequired: 8 | 16 | 17 | 21 | 25 = 17
        const coerced = semver.coerce(version)
        if (coerced) {
          if (semver.lt(coerced, '1.17.0')) javaRequired = 8
          else if (semver.lt(coerced, '1.18.0')) javaRequired = 16
          else if (semver.lt(coerced, '1.20.5')) javaRequired = 17
          else if (semver.lt(coerced, '26.0.0')) javaRequired = 21
          else javaRequired = 25
        }

        const javaPath = await JavaManager.getJavaPath(javaRequired)

        await new Promise((resolve, reject) => {
          const proc = spawn(javaPath, ['-jar', 'installer.jar', ...installerArgs], {
            cwd: serverDir,
            stdio: 'inherit'
          })
          proc.on('close', (code) => {
            if (code === 0) resolve(true)
            else reject(new Error('Installer failed with code ' + code))
          })
          proc.on('error', reject)
        })

        if (await exists(installerPath)) {
          await fsPromises.unlink(installerPath)
        }
      }

      return true
    } catch (e: any) {
      console.error(e)
      throw new Error(e.message)
    }
  })

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  ipcMain.handle('get-inventory', async (_, id, playerName) => {
    if (activeServers[id]) {
      return await activeServers[id].getPlayerInventory(playerName)
    }

    // Read offline
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const cachePath = join(serverDir, 'usercache.json')
      if (!fs.existsSync(cachePath)) return null

      const cache = JSON.parse(await fsPromises.readFile(cachePath, 'utf-8'))
      const playerEntry = cache.find((p: any) => p.name.toLowerCase() === playerName.toLowerCase())
      if (!playerEntry) return null

      let datPath = join(serverDir, 'world', 'playerdata', `${playerEntry.uuid}.dat`)
      if (!fs.existsSync(datPath)) {
        datPath = join(serverDir, 'world', 'players', 'data', `${playerEntry.uuid}.dat`)
      }
      if (!fs.existsSync(datPath)) return null

      const buffer = await fsPromises.readFile(datPath)

      const nbt = require('prismarine-nbt')
      const { parsed } = await nbt.parse(buffer)

      const inventory = parsed.value.Inventory?.value?.value || []
      return inventory.map((item: any) => ({
        slot: item.Slot?.value ?? 0,
        id: item.id?.value?.replace('minecraft:', '') ?? 'air',
        count: item.Count?.value ?? item.count?.value ?? 1
      }))
    } catch (err: any) {
      console.log(`[System] Offline Inventory Error: ${err.message}`)
      return null
    }
  })
}
