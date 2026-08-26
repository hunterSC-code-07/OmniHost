import { app } from 'electron'
import { join } from 'path'
import axios from 'axios'
import { promises as fsPromises } from 'fs'
import fs from 'fs'
import AdmZip from 'adm-zip'
import { CacheManager } from '../CacheManager'

const MODRINTH_USER_AGENT = 'OmniHost/1.0 (contact: omnihost@example.com)'

export class MinecraftModManager {
  static async searchCurseforgeMods(
    search: string,
    type: string,
    version: string,
    page: number = 0,
    classId: number = 6,
    sortField: number = 2
  ) {
    // Shaders (6552) and Resource Packs (12) are universal and do not use modloaders
    if (classId === 6552 || classId === 12) {
      type = '';
    }

    // 1. Try CurseForge if an API key is provided
    if (process.env.CURSEFORGE_API_KEY) {
      try {
        let url = `https://api.curseforge.com/v1/mods/search?gameId=432&classId=${classId}&sortField=${sortField}&sortOrder=desc&index=${page * 50}`
        
        if (search) url += `&searchFilter=${encodeURIComponent(search)}`
        
        if (version) {
          const cfVersion = version.endsWith('.0') && version.split('.').length === 3 
            ? version.slice(0, -2) 
            : version
          url += `&gameVersion=${encodeURIComponent(cfVersion)}`
        }
        
        if (type) {
          if (type === 'Forge') url += '&modLoaderType=1'
          else if (type === 'Fabric') url += '&modLoaderType=4'
          else if (type === 'NeoForge') url += '&modLoaderType=6'
          else if (type === 'Quilt') url += '&modLoaderType=5'
        }

        const res = await axios.get(url, { headers: { 'x-api-key': process.env.CURSEFORGE_API_KEY } })
        if (res.data && res.data.data) {
          return res.data.data
        }
      } catch (e: any) {
        console.warn('[MinecraftModManager] CurseForge API request failed, falling back to Modrinth:', e.message)
      }
    }

    // 2. Modrinth keyless fallback
    try {
      return await this.searchModrinthMods(search, type, version, page, classId, sortField)
    } catch (e: any) {
      console.error('Error searching Minecraft mods:', e.message)
      return []
    }
  }

  private static async searchModrinthMods(
    search: string,
    type: string,
    version: string,
    page: number = 0,
    classId: number = 6,
    sortField: number = 2
  ) {
    // Shaders (6552) and Resource Packs (12) are universal and do not use modloaders
    if (classId === 6552 || classId === 12) {
      type = '';
    }

    // Map classId to Modrinth project_type
    const classToType: Record<number, string> = {
      6: 'mod',
      4471: 'modpack',
      5: 'plugin',
      6945: 'datapack',
      12: 'resourcepack',
      6552: 'shader'
    }
    const projectType = classToType[classId] || 'mod'

    // Map sortField to Modrinth index
    const sortToIndex: Record<number, string> = {
      1: 'relevance',
      2: 'downloads',
      3: 'updated',
      4: 'title'
    }
    const index = sortToIndex[sortField] || 'downloads'

    // Build facets
    const facets: string[][] = [[`project_type:${projectType}`]]

    // ModLoader facet
    if (type) {
      const lowerType = type.toLowerCase()
      if (lowerType === 'forge') facets.push(['categories:forge'])
      else if (lowerType === 'fabric') facets.push(['categories:fabric'])
      else if (lowerType === 'neoforge') facets.push(['categories:neoforge'])
      else if (lowerType === 'quilt') facets.push(['categories:quilt'])
      else if (lowerType === 'paper') facets.push(['categories:paper', 'categories:spigot', 'categories:purpur'])
    }

    // Version facet
    if (version) {
      facets.push([`versions:${version}`])
    }

    const searchRes = await axios.get('https://api.modrinth.com/v2/search', {
      params: {
        query: search || '',
        limit: 50,
        offset: page * 50,
        index,
        facets: JSON.stringify(facets)
      },
      headers: { 'User-Agent': MODRINTH_USER_AGENT }
    })

    const hits = searchRes.data.hits || []
    if (hits.length === 0) return []

    // Fetch versions in bulk for download URLs & filenames
    const versionIds = hits.map((h: any) => h.latest_version).filter(Boolean)
    const versionMap: Record<string, any> = {}

    if (versionIds.length > 0) {
      try {
        const vRes = await axios.get(
          `https://api.modrinth.com/v2/versions?ids=${encodeURIComponent(JSON.stringify(versionIds))}`,
          { headers: { 'User-Agent': MODRINTH_USER_AGENT } }
        )
        if (Array.isArray(vRes.data)) {
          for (const v of vRes.data) {
            versionMap[v.project_id] = v
            versionMap[v.id] = v
          }
        }
      } catch (err: any) {
        console.warn('[MinecraftModManager] Failed to fetch bulk Modrinth versions:', err.message)
      }
    }

    return hits.map((hit: any) => {
      const v = versionMap[hit.project_id] || versionMap[hit.latest_version]
      const primaryFile = v?.files?.find((f: any) => f.primary) || v?.files?.[0]

      return {
        id: hit.project_id,
        name: hit.title,
        summary: hit.description,
        slug: hit.slug,
        logo: { thumbnailUrl: hit.icon_url },
        authors: [{ name: hit.author || 'Author' }],
        downloadCount: hit.downloads || 0,
        dateModified: hit.date_modified || hit.date_created,
        categories: (hit.display_categories || hit.categories || []).map((c: string, idx: number) => ({
          id: idx,
          name: c
        })),
        latestFiles: v
          ? [
              {
                id: v.id,
                fileName: primaryFile?.filename,
                downloadUrl: primaryFile?.url,
                fileLength: primaryFile?.size,
                gameVersions: v.game_versions,
                dependencies: (v.dependencies || []).map((d: any) => ({
                  modId: d.project_id,
                  relationType: d.dependency_type === 'required' ? 3 : 1
                }))
              }
            ]
          : []
      }
    })
  }

  static async getCurseforgeMod(modId: number | string) {
    if (process.env.CURSEFORGE_API_KEY && typeof modId === 'number') {
      try {
        const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}`, {
          headers: { 'x-api-key': process.env.CURSEFORGE_API_KEY }
        })
        return res.data.data
      } catch (e: any) {
        console.warn('[MinecraftModManager] CurseForge getMod failed, trying Modrinth fallback')
      }
    }

    try {
      const res = await axios.get(`https://api.modrinth.com/v2/project/${modId}`, {
        headers: { 'User-Agent': MODRINTH_USER_AGENT }
      })
      const p = res.data
      return {
        id: p.id,
        name: p.title,
        summary: p.description,
        slug: p.slug,
        logo: { thumbnailUrl: p.icon_url },
        authors: [{ name: p.team || 'Author' }],
        downloadCount: p.downloads || 0,
        dateModified: p.updated || p.published,
        categories: (p.categories || []).map((c: string, idx: number) => ({ id: idx, name: c }))
      }
    } catch (e: any) {
      console.error('Error getting mod:', e.message)
      return null
    }
  }

  static async getCurseforgeFile(modId: number | string, fileId: number | string) {
    if (process.env.CURSEFORGE_API_KEY && typeof modId === 'number' && typeof fileId === 'number') {
      try {
        const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}/files/${fileId}`, {
          headers: { 'x-api-key': process.env.CURSEFORGE_API_KEY }
        })
        return res.data.data
      } catch (e: any) {
        console.warn('[MinecraftModManager] CurseForge getFile failed, trying Modrinth fallback')
      }
    }

    try {
      const res = await axios.get(`https://api.modrinth.com/v2/version/${fileId}`, {
        headers: { 'User-Agent': MODRINTH_USER_AGENT }
      })
      const v = res.data
      const primaryFile = v.files?.find((f: any) => f.primary) || v.files?.[0]
      return {
        id: v.id,
        fileName: primaryFile?.filename,
        downloadUrl: primaryFile?.url,
        fileLength: primaryFile?.size,
        gameVersions: v.game_versions,
        dependencies: (v.dependencies || []).map((d: any) => ({
          modId: d.project_id,
          relationType: d.dependency_type === 'required' ? 3 : 1
        }))
      }
    } catch (e: any) {
      console.error('Error getting file:', e.message)
      return null
    }
  }

  static async installCurseforgeMod(event: any, id: number, downloadUrl: string, fileName: string, classId: number = 6) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      // 6 is Mods, 12 is Resource Packs, 17 is Worlds, 6552 is Shaders
      const folderName = classId === 12 ? 'resourcepacks' : classId === 17 ? 'saves' : classId === 6552 ? 'shaderpacks' : 'mods'
      const targetDir = join(serverDir, folderName)
      
      await fsPromises.mkdir(targetDir, { recursive: true })
      const targetPath = join(targetDir, fileName)

      const cachedFile = await CacheManager.getOrDownload('mods', downloadUrl, fileName, (progress) => {
        if (event && event.sender) {
          event.sender.send(`download-progress-${id}`, progress, `Downloading ${fileName}...`)
        }
      })
      
      await fsPromises.copyFile(cachedFile, targetPath)
      return true
    } catch (e: any) {
      console.error('Failed to install mod:', e.message)
      throw new Error(e.message)
    }
  }

  static async installCurseforgeModpack(event: any, id: number, modId: number | string, version: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      await fsPromises.mkdir(serverDir, { recursive: true })

      let downloadUrl = ''
      let fileName = 'modpack.mrpack'

      // 1. Resolve download URL if not already a direct URL
      if (typeof version === 'string' && (version.startsWith('http://') || version.startsWith('https://'))) {
        downloadUrl = version
        fileName = downloadUrl.split('/').pop()?.split('?')[0] || 'modpack.mrpack'
      } else if (process.env.CURSEFORGE_API_KEY && typeof modId === 'number') {
        try {
          const filesRes = await axios.get(`https://api.curseforge.com/v1/mods/${modId}/files`, {
            headers: { 'x-api-key': process.env.CURSEFORGE_API_KEY }
          })
          const files = filesRes.data?.data || []
          const selectedFile = (version && version !== 'latest')
            ? files.find((f: any) => f.id === Number(version) || f.displayName === version) || files[0]
            : files[0]
          if (selectedFile) {
            downloadUrl = selectedFile.downloadUrl
            fileName = selectedFile.fileName
          }
        } catch (e: any) {
          console.warn('[MinecraftModManager] CurseForge modpack file resolution failed:', e.message)
        }
      }

      // Modrinth fallback / direct resolution
      if (!downloadUrl) {
        try {
          const versionsRes = await axios.get(`https://api.modrinth.com/v2/project/${modId}/version`, {
            headers: { 'User-Agent': MODRINTH_USER_AGENT }
          })
          const versions = versionsRes.data || []
          const selectedVer = (version && version !== 'latest')
            ? versions.find((v: any) => v.id === version || v.version_number === version) || versions[0]
            : versions[0]

          if (selectedVer && selectedVer.files) {
            const primary = selectedVer.files.find((f: any) => f.primary) || selectedVer.files[0]
            if (primary) {
              downloadUrl = primary.url
              fileName = primary.filename
            }
          }
        } catch (e: any) {
          console.error('[MinecraftModManager] Modrinth modpack resolution error:', e.message)
        }
      }

      if (!downloadUrl) {
        throw new Error(`Could not resolve download URL for modpack ${modId}`)
      }

      // 2. Download modpack archive
      if (event && event.sender) {
        event.sender.send(`download-progress-${id}`, 5, `Downloading modpack archive (${fileName})...`)
      }

      const cachedArchive = await CacheManager.getOrDownload('modpacks', downloadUrl, fileName, (pct) => {
        if (event && event.sender) {
          event.sender.send(`download-progress-${id}`, Math.round(5 + pct * 0.15), `Downloading modpack archive... ${pct}%`)
        }
      })

      const zip = new AdmZip(cachedArchive)

      // Backup existing mods directory
      const modsDir = join(serverDir, 'mods')
      if (fs.existsSync(modsDir)) {
        const currentFiles = await fsPromises.readdir(modsDir)
        if (currentFiles.length > 0) {
          const backupDir = join(serverDir, `mods_backup_${Date.now()}`)
          await fsPromises.rename(modsDir, backupDir)
          await fsPromises.mkdir(modsDir, { recursive: true })
        }
      } else {
        await fsPromises.mkdir(modsDir, { recursive: true })
      }

      // 3. Check format: Modrinth (.mrpack) or CurseForge (manifest.json)
      const modrinthIndexEntry = zip.getEntry('modrinth.index.json')
      const curseforgeManifestEntry = zip.getEntry('manifest.json')

      if (modrinthIndexEntry) {
        const index = JSON.parse(zip.readAsText(modrinthIndexEntry))

        // Extract overrides
        const entries = zip.getEntries()
        for (const entry of entries) {
          if (!entry.isDirectory) {
            let targetRel = ''
            if (entry.entryName.startsWith('overrides/')) {
              targetRel = entry.entryName.replace(/^overrides\//, '')
            } else if (entry.entryName.startsWith('server-overrides/')) {
              targetRel = entry.entryName.replace(/^server-overrides\//, '')
            }
            if (targetRel) {
              const targetFull = join(serverDir, targetRel)
              await fsPromises.mkdir(join(targetFull, '..'), { recursive: true })
              await fsPromises.writeFile(targetFull, entry.getData())
            }
          }
        }

        // Download mod files
        const files = (index.files || []).filter((f: any) => f.env?.server !== 'unsupported')
        const totalFiles = files.length
        for (let i = 0; i < totalFiles; i++) {
          const f = files[i]
          const dl = f.downloads?.[0]
          if (!dl) continue

          const targetPath = join(serverDir, f.path)
          await fsPromises.mkdir(join(targetPath, '..'), { recursive: true })

          const modName = f.path.split('/').pop() || 'mod.jar'
          const pct = Math.round(20 + ((i + 1) / totalFiles) * 80)
          if (event && event.sender) {
            event.sender.send(`download-progress-${id}`, pct, `Installing mod (${i + 1}/${totalFiles}): ${modName}`)
          }

          try {
            const resp = await axios.get(dl, { responseType: 'arraybuffer' })
            await fsPromises.writeFile(targetPath, Buffer.from(resp.data))
          } catch (e: any) {
            console.warn(`[MinecraftModManager] Failed to download modpack file ${modName}:`, e.message)
          }
        }

        // Update omnihost.json with modpack loader/version info
        if (index.dependencies) {
          try {
            const metaPath = join(serverDir, 'omnihost.json')
            let meta: any = {}
            if (fs.existsSync(metaPath)) {
              meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
            }
            if (index.dependencies.minecraft) meta.version = index.dependencies.minecraft
            if (index.dependencies['fabric-loader']) {
              meta.type = 'Fabric'
              meta.loaderVersion = index.dependencies['fabric-loader']
            } else if (index.dependencies['forge']) {
              meta.type = 'Forge'
              meta.loaderVersion = index.dependencies['forge']
            } else if (index.dependencies['neoforge']) {
              meta.type = 'NeoForge'
              meta.loaderVersion = index.dependencies['neoforge']
            } else if (index.dependencies['quilt-loader']) {
              meta.type = 'Quilt'
              meta.loaderVersion = index.dependencies['quilt-loader']
            }
            fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
          } catch {}
        }
      } else if (curseforgeManifestEntry) {
        const manifest = JSON.parse(zip.readAsText(curseforgeManifestEntry))
        const overridesPrefix = (manifest.overrides || 'overrides') + '/'

        // Extract overrides
        const entries = zip.getEntries()
        for (const entry of entries) {
          if (!entry.isDirectory && entry.entryName.startsWith(overridesPrefix)) {
            const targetRel = entry.entryName.slice(overridesPrefix.length)
            const targetFull = join(serverDir, targetRel)
            await fsPromises.mkdir(join(targetFull, '..'), { recursive: true })
            await fsPromises.writeFile(targetFull, entry.getData())
          }
        }

        // Download files
        const files = manifest.files || []
        const totalFiles = files.length
        for (let i = 0; i < totalFiles; i++) {
          const f = files[i]
          const pct = Math.round(20 + ((i + 1) / totalFiles) * 80)
          if (event && event.sender) {
            event.sender.send(`download-progress-${id}`, pct, `Installing mod (${i + 1}/${totalFiles})...`)
          }
          try {
            const fileData = await this.getCurseforgeFile(f.projectID, f.fileID)
            if (fileData && fileData.downloadUrl) {
              const targetPath = join(serverDir, 'mods', fileData.fileName)
              const resp = await axios.get(fileData.downloadUrl, { responseType: 'arraybuffer' })
              await fsPromises.writeFile(targetPath, Buffer.from(resp.data))
            }
          } catch (e: any) {
            console.warn(`[MinecraftModManager] Failed to fetch CurseForge file ${f.projectID}:`, e.message)
          }
        }

        // Update omnihost.json
        if (manifest.minecraft) {
          try {
            const metaPath = join(serverDir, 'omnihost.json')
            let meta: any = {}
            if (fs.existsSync(metaPath)) {
              meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
            }
            if (manifest.minecraft.version) meta.version = manifest.minecraft.version
            const loader = manifest.minecraft.modLoaders?.[0]?.id || ''
            if (loader.startsWith('fabric-')) {
              meta.type = 'Fabric'
              meta.loaderVersion = loader.replace('fabric-', '')
            } else if (loader.startsWith('forge-')) {
              meta.type = 'Forge'
              meta.loaderVersion = loader.replace('forge-', '')
            } else if (loader.startsWith('neoforge-')) {
              meta.type = 'NeoForge'
              meta.loaderVersion = loader.replace('neoforge-', '')
            }
            fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
          } catch {}
        }
      } else {
        throw new Error('Unrecognized modpack format. Neither modrinth.index.json nor manifest.json was found.')
      }

      if (event && event.sender) {
        event.sender.send(`download-progress-${id}`, 100, 'Modpack installed successfully!')
      }
      return true
    } catch (e: any) {
      console.error('[MinecraftModManager] Failed to install modpack:', e.message)
      throw new Error(e.message)
    }
  }

  static async getInstalledMods(id: number) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const modsDir = join(serverDir, 'mods')
      
      try {
        await fsPromises.access(modsDir)
      } catch {
        return [] 
      }
      
      const files = await fsPromises.readdir(modsDir, { withFileTypes: true })
      const jarFiles = files.filter(f => f.isFile() && f.name.endsWith('.jar'))

      return await Promise.all(
        jarFiles.map(async (f) => {
          try {
            const stats = await fsPromises.stat(join(modsDir, f.name))
            return { name: f.name, size: stats.size }
          } catch {
            return { name: f.name, size: 0 }
          }
        })
      )
    } catch (e: any) {
      console.error('Error getting installed mods:', e.message)
      return []
    }
  }

  static async getInstalledModDependencies(id: number): Promise<any[]> {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const modsDir = join(serverDir, 'mods')

      try {
        await fsPromises.access(modsDir)
      } catch {
        return []
      }

      const files = await fsPromises.readdir(modsDir, { withFileTypes: true })
      const jarFiles = files.filter(f => f.isFile() && f.name.endsWith('.jar'))

      const parsedMods: Array<{
        name: string
        fileName: string
        modId: string
        version: string
        description?: string
        authors?: string[]
        icon?: string
        size: number
        loaderType?: string
        rawDeps: Array<{ id: string; name: string; version: string; mandatory: boolean }>
      }> = []

      for (const f of jarFiles) {
        const fullPath = join(modsDir, f.name)
        let size = 0
        try {
          const st = await fsPromises.stat(fullPath)
          size = st.size
        } catch {}

        let modId = f.name.replace(/\.jar$/i, '')
        let name = modId
        let version = ''
        let description = ''
        let authors: string[] = []
        let icon = ''
        let loaderType = 'Mod'
        const rawDeps: Array<{ id: string; name: string; version: string; mandatory: boolean }> = []

        try {
          const buffer = await fsPromises.readFile(fullPath)
          const zip = new AdmZip(buffer)
          const fabricEntry = zip.getEntry('fabric.mod.json')
          const quiltEntry = zip.getEntry('quilt.mod.json')
          const forgeEntry = zip.getEntry('META-INF/mods.toml')
          const pluginEntry = zip.getEntry('plugin.yml')

          if (fabricEntry) {
            loaderType = 'Fabric'
            try {
              const json = JSON.parse(zip.readAsText(fabricEntry))
              modId = json.id || modId
              name = json.name || json.id || name
              version = json.version || ''
              description = json.description || ''
              if (Array.isArray(json.authors)) {
                authors = json.authors.map((a: any) => typeof a === 'string' ? a : (a?.name || ''))
              }

              const depends = json.depends || {}
              for (const [depId, ver] of Object.entries(depends)) {
                const cleanId = String(depId).trim()
                if (cleanId !== 'fabricloader' && cleanId !== 'minecraft' && cleanId !== 'java') {
                  rawDeps.push({
                    id: cleanId,
                    name: cleanId,
                    version: String(ver || '*'),
                    mandatory: true
                  })
                }
              }

              const recommends = json.recommends || {}
              for (const [depId, ver] of Object.entries(recommends)) {
                const cleanId = String(depId).trim()
                if (cleanId !== 'fabricloader' && cleanId !== 'minecraft') {
                  rawDeps.push({
                    id: cleanId,
                    name: cleanId,
                    version: String(ver || '*'),
                    mandatory: false
                  })
                }
              }
            } catch {}
          } else if (quiltEntry) {
            loaderType = 'Quilt'
            try {
              const json = JSON.parse(zip.readAsText(quiltEntry))
              const qmod = json.quilt_loader || {}
              modId = qmod.id || modId
              name = qmod.metadata?.name || modId
              version = qmod.version || ''
              description = qmod.metadata?.description || ''
              const depends = qmod.depends || []
              for (const d of depends) {
                const depId = typeof d === 'string' ? d : d?.id
                if (depId && depId !== 'quilt_loader' && depId !== 'minecraft') {
                  rawDeps.push({
                    id: depId,
                    name: depId,
                    version: typeof d === 'object' && d?.versions ? String(d.versions) : '*',
                    mandatory: true
                  })
                }
              }
            } catch {}
          } else if (forgeEntry) {
            loaderType = 'Forge'
            try {
              const text = zip.readAsText(forgeEntry)
              const modIdMatch = text.match(/modId\s*=\s*["']([^"']+)["']/)
              const nameMatch = text.match(/displayName\s*=\s*["']([^"']+)["']/)
              const verMatch = text.match(/version\s*=\s*["']([^"']+)["']/)
              const descMatch = text.match(/description\s*=\s*'''([^']+)'''/) || text.match(/description\s*=\s*["']([^"']+)["']/)
              if (modIdMatch) modId = modIdMatch[1]
              if (nameMatch) name = nameMatch[1]
              if (verMatch) version = verMatch[1]
              if (descMatch) description = descMatch[1].trim()

              const blocks = text.split(/\[\[dependencies\.[^\]]+\]\]/).slice(1)
              for (const block of blocks) {
                const depIdMatch = block.match(/modId\s*=\s*["']([^"']+)["']/)
                if (depIdMatch) {
                  const depId = depIdMatch[1].trim()
                  if (depId !== 'minecraft' && depId !== 'forge' && depId !== 'neoforge') {
                    const mandatoryMatch = block.match(/mandatory\s*=\s*(true|false)/i)
                    const verRangeMatch = block.match(/versionRange\s*=\s*["']([^"']+)["']/)
                    rawDeps.push({
                      id: depId,
                      name: depId,
                      version: verRangeMatch ? verRangeMatch[1] : '*',
                      mandatory: mandatoryMatch ? mandatoryMatch[1].toLowerCase() === 'true' : true
                    })
                  }
                }
              }
            } catch {}
          } else if (pluginEntry) {
            loaderType = 'Paper/Spigot'
            try {
              const text = zip.readAsText(pluginEntry)
              const nameMatch = text.match(/^name:\s*(.+)$/m)
              const verMatch = text.match(/^version:\s*(.+)$/m)
              const descMatch = text.match(/^description:\s*(.+)$/m)
              if (nameMatch) {
                name = nameMatch[1].trim()
                modId = name.toLowerCase()
              }
              if (verMatch) version = verMatch[1].trim()
              if (descMatch) description = descMatch[1].trim()

              const dependMatch = text.match(/^depend:\s*\[(.*)\]/m)
              if (dependMatch) {
                dependMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(d => {
                  rawDeps.push({ id: d.toLowerCase(), name: d, version: '*', mandatory: true })
                })
              }
              const softDependMatch = text.match(/^softdepend:\s*\[(.*)\]/m)
              if (softDependMatch) {
                softDependMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(d => {
                  rawDeps.push({ id: d.toLowerCase(), name: d, version: '*', mandatory: false })
                })
              }
            } catch {}
          }
        } catch (e: any) {
          console.warn(`[MinecraftModManager] Could not read zip manifest for ${f.name}:`, e.message)
        }

        parsedMods.push({
          name,
          fileName: f.name,
          modId,
          version,
          description,
          authors,
          icon,
          size,
          loaderType,
          rawDeps
        })
      }

      // Compile set of all installed identifiers for matching dependencies
      const installedIdentifiers = new Set<string>()
      for (const m of parsedMods) {
        if (m.modId) installedIdentifiers.add(m.modId.toLowerCase())
        if (m.name) installedIdentifiers.add(m.name.toLowerCase())
        installedIdentifiers.add(m.fileName.toLowerCase().replace(/\.jar$/i, ''))
      }

      return parsedMods.map((m) => {
        const dependencies = m.rawDeps.map((dep) => {
          const lowerId = dep.id.toLowerCase()
          // Check exact or partial match in installed identifiers
          const isSatisfied = installedIdentifiers.has(lowerId) ||
            Array.from(installedIdentifiers).some(inst => inst.includes(lowerId) || lowerId.includes(inst))

          return {
            id: dep.id,
            name: dep.name,
            version: dep.version,
            mandatory: dep.mandatory,
            satisfied: isSatisfied
          }
        })

        return {
          name: m.name,
          fileName: m.fileName,
          modId: m.modId,
          version: m.version,
          description: m.description,
          authors: m.authors,
          size: m.size,
          loaderType: m.loaderType,
          dependencies
        }
      })
    } catch (e: any) {
      console.error('[MinecraftModManager] Error getting installed mod dependencies:', e.message)
      return []
    }
  }

  static async deleteMod(id: number, fileName: string) {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString())
      const modPath = join(serverDir, 'mods', fileName)
      
      await fsPromises.unlink(modPath)
      return true
    } catch (e: any) {
      console.error('Error deleting mod:', e.message)
      throw new Error(e.message)
    }
  }

  static async searchModpacks(query: string, version: string, modloader: string) {
    return this.searchCurseforgeMods(query, modloader, version, 0, 4471, 2)
  }

  static async getModpackDetails(modId: string | number) {
    return this.getCurseforgeMod(modId)
  }
}
