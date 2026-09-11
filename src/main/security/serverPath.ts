import { app } from 'electron'
import { lstat } from 'fs/promises'
import { isAbsolute, join, relative, resolve, sep } from 'path'

export interface ServerPathOptions {
  allowRoot?: boolean
}

function validateServerId(serverId: unknown): asserts serverId is number {
  if (!Number.isSafeInteger(serverId) || Number(serverId) <= 0) {
    throw new Error('Invalid server ID')
  }
}

async function assertPathContainsNoLinks(serverRoot: string, targetPath: string): Promise<void> {
  const relativeTarget = relative(serverRoot, targetPath)
  const segments = relativeTarget ? relativeTarget.split(sep) : []
  let currentPath = serverRoot

  for (const segment of ['', ...segments]) {
    if (segment) currentPath = join(currentPath, segment)
    try {
      const stats = await lstat(currentPath)
      if (stats.isSymbolicLink()) {
        throw new Error('Access through symbolic links or junctions is not allowed')
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') break
      throw error
    }
  }
}

export async function resolveServerPath(
  serverId: unknown,
  untrustedRelativePath: unknown,
  options: ServerPathOptions = {}
): Promise<string> {
  validateServerId(serverId)
  if (typeof untrustedRelativePath !== 'string' || untrustedRelativePath.includes('\0')) {
    throw new Error('Invalid server path')
  }
  if (isAbsolute(untrustedRelativePath)) {
    throw new Error('Absolute paths are not allowed')
  }

  const serverRoot = resolve(app.getPath('userData'), 'servers', String(serverId))
  const targetPath = resolve(serverRoot, untrustedRelativePath || '.')
  const relativeTarget = relative(serverRoot, targetPath)

  if (
    relativeTarget.startsWith(`..${sep}`) ||
    relativeTarget === '..' ||
    isAbsolute(relativeTarget)
  ) {
    throw new Error('Path escapes the server directory')
  }
  if (!options.allowRoot && relativeTarget === '') {
    throw new Error('The server root cannot be modified through this operation')
  }

  await assertPathContainsNoLinks(serverRoot, targetPath)
  return targetPath
}
