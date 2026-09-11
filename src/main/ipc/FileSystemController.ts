import { ipcMain } from 'electron'
import fsPromises from 'fs/promises'
import { join } from 'path'
import { assertTrustedIpcSender } from '../security/ipcSecurity'
import { resolveServerPath } from '../security/serverPath'

async function exists(path: string): Promise<boolean> {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export class FileSystemController {
  static register(): void {
    ipcMain.handle('fs-list-dir', async (event, serverId, dirPath) => {
      assertTrustedIpcSender(event)
      try {
        const fullPath = await resolveServerPath(serverId, dirPath || '', { allowRoot: true })
        if (!(await exists(fullPath))) return []

        const entries = await fsPromises.readdir(fullPath, { withFileTypes: true })
        const files = await Promise.all(
          entries.map(async (entry) => {
            if (entry.isSymbolicLink()) return null
            const entryPath = join(fullPath, entry.name)
            const stats = await fsPromises.lstat(entryPath)
            return {
              name: entry.name,
              isDirectory: entry.isDirectory(),
              size: stats.size,
              mtime: stats.mtime.toISOString()
            }
          })
        )

        return files
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
          .sort((a, b) => {
            if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name)
            return a.isDirectory ? -1 : 1
          })
      } catch (error) {
        console.error('Failed to list directory', error)
        return []
      }
    })

    ipcMain.handle('fs-read-file', async (event, serverId, filePath) => {
      assertTrustedIpcSender(event)
      const fullPath = await resolveServerPath(serverId, filePath)
      return fsPromises.readFile(fullPath, 'utf8')
    })

    ipcMain.handle('fs-read-file-if-exists', async (event, serverId, filePath) => {
      assertTrustedIpcSender(event)
      const fullPath = await resolveServerPath(serverId, filePath)

      try {
        return await fsPromises.readFile(fullPath, 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw error
      }
    })

    ipcMain.handle('fs-write-file', async (event, serverId, filePath, content) => {
      assertTrustedIpcSender(event)
      if (typeof content !== 'string') throw new Error('File content must be text')
      const fullPath = await resolveServerPath(serverId, filePath)
      await fsPromises.writeFile(fullPath, content, 'utf8')
      return true
    })

    ipcMain.handle('fs-delete', async (event, serverId, itemPath) => {
      assertTrustedIpcSender(event)
      const fullPath = await resolveServerPath(serverId, itemPath)
      await fsPromises.rm(fullPath, { recursive: true, force: true })
      return true
    })

    ipcMain.handle('fs-create-folder', async (event, serverId, folderPath) => {
      assertTrustedIpcSender(event)
      const fullPath = await resolveServerPath(serverId, folderPath)
      await fsPromises.mkdir(fullPath, { recursive: true })
      return true
    })
  }
}
