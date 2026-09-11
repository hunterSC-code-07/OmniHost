import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const state = vi.hoisted(() => ({ dataRoot: '' }))
vi.mock('electron', () => ({ app: { getPath: () => state.dataRoot } }))

import { resolveServerPath } from '../../../src/main/security/serverPath'

describe('resolveServerPath', () => {
  beforeEach(() => {
    state.dataRoot = mkdtempSync(join(tmpdir(), 'omnihost-path-'))
    mkdirSync(join(state.dataRoot, 'servers', '1'), { recursive: true })
    mkdirSync(join(state.dataRoot, 'servers', '10'), { recursive: true })
  })

  afterEach(() => rmSync(state.dataRoot, { recursive: true, force: true }))

  it('accepts normal paths within a server', async () => {
    await expect(resolveServerPath(1, 'world/level.dat')).resolves.toBe(
      join(state.dataRoot, 'servers', '1', 'world', 'level.dat')
    )
  })

  it('rejects traversal and prefix-collision paths', async () => {
    await expect(resolveServerPath(1, '../10/secret.txt')).rejects.toThrow(
      'Path escapes the server directory'
    )
  })

  it('rejects absolute paths and deleting the server root', async () => {
    await expect(resolveServerPath(1, state.dataRoot)).rejects.toThrow('Absolute paths')
    await expect(resolveServerPath(1, '')).rejects.toThrow('server root')
  })

  it('rejects junction traversal', async () => {
    const outside = join(state.dataRoot, 'outside')
    mkdirSync(outside)
    symlinkSync(outside, join(state.dataRoot, 'servers', '1', 'linked'), 'junction')
    await expect(resolveServerPath(1, 'linked/secret.txt')).rejects.toThrow(
      'symbolic links or junctions'
    )
  })
})
