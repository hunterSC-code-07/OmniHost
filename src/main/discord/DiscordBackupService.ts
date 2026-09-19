import fs from 'fs'
import fsPromises from 'fs/promises'
import { join } from 'path'
import AdmZip from 'adm-zip'
import { getServerDirectory } from '../storage/db'
import { isSafeDiscordArchiveEntry, isSafeDiscordBackupFilename } from './DiscordBackupValidation'

export { isSafeDiscordArchiveEntry, isSafeDiscordBackupFilename } from './DiscordBackupValidation'

export interface DiscordBackupEntry {
  name: string
  size: number
  date: number
}

export class DiscordBackupService {
  async create(serverId: number, requestedName = 'discord-backup'): Promise<string> {
    const serverDirectory = getServerDirectory(serverId)
    const backupsDirectory = join(serverDirectory, 'backups')
    await fsPromises.mkdir(backupsDirectory, { recursive: true })

    const safeName = requestedName.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'discord-backup'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `${safeName}_${timestamp}.zip`
    const backupPath = join(backupsDirectory, backupName)
    const zip = new AdmZip()
    let addedSomething = false

    for (const folder of ['world', 'world_nether', 'world_the_end']) {
      const folderPath = join(serverDirectory, folder)
      if (fs.existsSync(folderPath)) {
        zip.addLocalFolder(folderPath, folder)
        addedSomething = true
      }
    }
    if (!addedSomething) throw new Error('No supported world data was found to back up.')
    zip.writeZip(backupPath)
    return backupName
  }

  async list(serverId: number): Promise<DiscordBackupEntry[]> {
    const backupsDirectory = join(getServerDirectory(serverId), 'backups')
    if (!fs.existsSync(backupsDirectory)) return []
    const entries = await fsPromises.readdir(backupsDirectory, { withFileTypes: true })
    const backups: DiscordBackupEntry[] = []
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.zip')) continue
      const stat = await fsPromises.stat(join(backupsDirectory, entry.name))
      backups.push({ name: entry.name, size: stat.size, date: stat.mtimeMs })
    }
    return backups.sort((a, b) => b.date - a.date).slice(0, 25)
  }

  async restore(serverId: number, filename: string): Promise<void> {
    if (!isSafeDiscordBackupFilename(filename)) {
      throw new Error('Invalid backup filename.')
    }
    const serverDirectory = getServerDirectory(serverId)
    const backupPath = join(serverDirectory, 'backups', filename)
    if (!fs.existsSync(backupPath)) throw new Error('Backup file not found.')

    const zip = new AdmZip(backupPath)
    const allowedFolders = new Set(['world', 'world_nether', 'world_the_end'])
    for (const entry of zip.getEntries()) {
      if (!isSafeDiscordArchiveEntry(entry.entryName)) {
        throw new Error(`Unsafe path in backup: ${entry.entryName}`)
      }
    }
    for (const folder of allowedFolders) {
      const folderPath = join(serverDirectory, folder)
      if (fs.existsSync(folderPath))
        await fsPromises.rm(folderPath, { recursive: true, force: true })
    }
    zip.extractAllTo(serverDirectory, true)
  }

  async prune(serverId: number, keep: number): Promise<number> {
    const backups = await this.list(serverId)
    const keepCount = Math.min(Math.max(Math.floor(keep), 1), 100)
    const removable = backups.slice(keepCount)
    const directory = join(getServerDirectory(serverId), 'backups')
    await Promise.all(removable.map((backup) => fsPromises.unlink(join(directory, backup.name))))
    return removable.length
  }
}

export const discordBackupService = new DiscordBackupService()
