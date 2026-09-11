import { app } from 'electron'
import { basename, isAbsolute, join, relative, resolve, sep } from 'path'
import { promises as fsPromises } from 'fs'
import AdmZip from 'adm-zip'
import { CacheManager } from '../CacheManager'
import { CurseForgeApiClient } from './CurseForgeApiClient'

type ProgressEvent = {
  sender?: { send: (channel: string, progress: number, text: string) => void }
}

interface CurseForgeManifest {
  minecraft: {
    version: string
    modLoaders?: Array<{ id: string; primary?: boolean }>
  }
  files: Array<{ projectID: number; fileID: number; required?: boolean }>
  overrides?: string
}

function getInstallDirectory(serverDirectory: string, classId: number): string {
  switch (classId) {
    case 5:
      return join(serverDirectory, 'plugins')
    case 12:
      return join(serverDirectory, 'resourcepacks')
    case 17:
      return join(serverDirectory, 'saves')
    case 6552:
      return join(serverDirectory, 'shaderpacks')
    case 6945:
      return join(serverDirectory, 'world', 'datapacks')
    default:
      return join(serverDirectory, 'mods')
  }
}

function getDownloadUrl(fileId: number, fileName: string, downloadUrl?: string): string {
  if (downloadUrl) return downloadUrl
  const firstPart = Math.floor(fileId / 1000)
  const secondPart = String(fileId % 1000).padStart(3, '0')
  return `https://edge.forgecdn.net/files/${firstPart}/${secondPart}/${encodeURIComponent(fileName)}`
}

function assertSafeFilename(fileName: string): void {
  if (!fileName || basename(fileName) !== fileName || fileName.includes('\0')) {
    throw new Error('Invalid mod filename')
  }
}

export class MinecraftModManager {
  static async installCurseforgeMod(
    event: ProgressEvent,
    id: number,
    downloadUrl: string,
    fileName: string,
    classId = 6
  ): Promise<boolean> {
    assertSafeFilename(fileName)
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid server ID')
    const serverDirectory = join(app.getPath('userData'), 'servers', String(id))
    const targetDirectory = getInstallDirectory(serverDirectory, classId)
    await fsPromises.mkdir(targetDirectory, { recursive: true })

    const cachedFile = await CacheManager.getOrDownload('mods', downloadUrl, fileName, (progress) =>
      event.sender?.send(`download-progress-${id}`, progress, `Downloading ${fileName}...`)
    )
    await fsPromises.copyFile(cachedFile, join(targetDirectory, fileName))
    return true
  }

  static async installCurseforgeModpack(
    event: ProgressEvent,
    id: number,
    modId: number,
    requestedVersion: string
  ): Promise<{ isClientPack: true; modloader: string; version: string; loaderVersion: string }> {
    const mod = await CurseForgeApiClient.getCurseforgeMod(modId)
    if (!mod) throw new Error('Could not load the selected modpack')

    const selectedFile =
      mod.latestFiles?.find((file: { gameVersions?: string[] }) =>
        file.gameVersions?.includes(requestedVersion)
      ) ?? mod.latestFiles?.[0]
    if (!selectedFile?.id) throw new Error('The selected modpack has no downloadable file')

    const file = await CurseForgeApiClient.getCurseforgeFile(modId, selectedFile.id)
    if (!file?.fileName) throw new Error('Could not load the modpack file details')
    const downloadUrl = getDownloadUrl(file.id, file.fileName, file.downloadUrl)
    const archivePath = await CacheManager.getOrDownload(
      'modpacks',
      downloadUrl,
      file.fileName,
      (progress) =>
        event.sender?.send(`download-progress-${id}`, progress, 'Downloading modpack...')
    )

    const archive = new AdmZip(archivePath)
    const manifestEntry = archive.getEntry('manifest.json')
    if (!manifestEntry) throw new Error('This archive is not a CurseForge modpack')
    const manifest = JSON.parse(manifestEntry.getData().toString('utf8')) as CurseForgeManifest
    const serverDirectory = resolve(app.getPath('userData'), 'servers', String(id))

    const overridesPrefix = `${(manifest.overrides || 'overrides').replace(/\\/g, '/').replace(/\/$/, '')}/`
    for (const entry of archive.getEntries()) {
      if (entry.isDirectory || !entry.entryName.startsWith(overridesPrefix)) continue
      const relativeEntry = entry.entryName.slice(overridesPrefix.length)
      if (!relativeEntry || isAbsolute(relativeEntry)) continue
      const targetPath = resolve(serverDirectory, relativeEntry)
      const relativeTarget = relative(serverDirectory, targetPath)
      if (
        relativeTarget === '..' ||
        relativeTarget.startsWith(`..${sep}`) ||
        isAbsolute(relativeTarget)
      ) {
        throw new Error(`Unsafe path in modpack archive: ${entry.entryName}`)
      }
      await fsPromises.mkdir(resolve(targetPath, '..'), { recursive: true })
      await fsPromises.writeFile(targetPath, entry.getData())
    }

    let completed = 0
    for (const dependency of manifest.files.filter((item) => item.required !== false)) {
      const dependencyFile = await CurseForgeApiClient.getCurseforgeFile(
        dependency.projectID,
        dependency.fileID
      )
      if (!dependencyFile?.fileName) {
        throw new Error(`Could not resolve modpack dependency ${dependency.projectID}`)
      }
      await this.installCurseforgeMod(
        event,
        id,
        getDownloadUrl(dependency.fileID, dependencyFile.fileName, dependencyFile.downloadUrl),
        dependencyFile.fileName,
        6
      )
      completed += 1
      event.sender?.send(
        `download-progress-${id}`,
        Math.round((completed / Math.max(manifest.files.length, 1)) * 100),
        `Installing modpack files (${completed}/${manifest.files.length})...`
      )
    }

    const loaderId =
      manifest.minecraft.modLoaders?.find((loader) => loader.primary)?.id ??
      manifest.minecraft.modLoaders?.[0]?.id ??
      'vanilla'
    const loaderType = loaderId.startsWith('neoforge-')
      ? 'NeoForge'
      : loaderId.startsWith('forge-')
        ? 'Forge'
        : loaderId.startsWith('fabric-')
          ? 'Fabric'
          : 'Vanilla'
    const loaderVersion = loaderId.includes('-') ? loaderId.slice(loaderId.indexOf('-') + 1) : ''

    return {
      isClientPack: true,
      modloader: loaderType,
      version: manifest.minecraft.version,
      loaderVersion
    }
  }

  static async getInstalledMods(id: number, classId = 6): Promise<Array<{ name: string }>> {
    const directory = getInstallDirectory(
      join(app.getPath('userData'), 'servers', String(id)),
      classId
    )
    try {
      const files = await fsPromises.readdir(directory, { withFileTypes: true })
      return files
        .filter((file) => file.isFile() && /\.(jar|zip)$/i.test(file.name))
        .map((file) => ({ name: file.name }))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw error
    }
  }

  static async deleteMod(id: number, fileName: string, classId = 6): Promise<boolean> {
    assertSafeFilename(fileName)
    const directory = getInstallDirectory(
      join(app.getPath('userData'), 'servers', String(id)),
      classId
    )
    await fsPromises.unlink(join(directory, fileName))
    return true
  }

  static async deleteAllMods(id: number, classId = 6): Promise<boolean> {
    const directory = getInstallDirectory(
      join(app.getPath('userData'), 'servers', String(id)),
      classId
    )
    try {
      const entries = await fsPromises.readdir(directory, { withFileTypes: true })
      await Promise.all(
        entries.map((entry) =>
          fsPromises.rm(join(directory, entry.name), { recursive: true, force: true })
        )
      )
      return true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true
      throw error
    }
  }
}
