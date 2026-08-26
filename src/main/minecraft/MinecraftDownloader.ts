import fsPromises from 'fs/promises'
import axios from 'axios'
import semver from 'semver'
import { spawn } from 'child_process'
import { CacheManager } from '../CacheManager'
import { JavaManager } from '../adapters/JavaManager'
import { join } from 'path'
import { app } from 'electron'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export class MinecraftDownloader {
  static async getVanillaVersions() {
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
    }  }

  static async getPaperVersions() {
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
    }  }

  static async getFabricVersions() {
    try {
      const res = await axios.get('https://meta.fabricmc.net/v2/versions/game')
      return res.data.filter((v: any) => v.stable).map((v: any) => v.version)
    } catch (e) {
      console.error(e)
      return []
    }  }

  static async getForgeVersions() {
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
    }  }

  static async getNeoForgeVersions() {
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
    }  }

  static async getLoaderVersions(type: string, mcVersion: string) {
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
    }  }

  static async searchModpacks(query: string, version: string, modloader: string) {
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

      const res = await axios.get(url, { headers: { 'x-api-key': process.env.CURSEFORGE_API_KEY || '' } })
      return res.data.data
    } catch (e: any) {
      console.error('Error searching modpacks:', e.message)
      return []
    }  }

  static async getModpackDetails(modId: string) {
    try {
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}`, {
        headers: { 'x-api-key': process.env.CURSEFORGE_API_KEY || '' }
      })
      return res.data.data
    } catch (e: any) {
      console.error(e.message)
      return null
    }  }

  static async downloadServerJar(event: any, id: number, type: string, version: string, loaderVersion: string) {
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
    }  }
}
