import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { migrateLegacyPortableData } from '../../../src/main/setup/dataMigration'

const temporaryDirectories: string[] = []

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'omnihost-migration-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('migrateLegacyPortableData', () => {
  it('copies legacy data without deleting the source', () => {
    const root = createTemporaryDirectory()
    const legacy = join(root, 'legacy')
    const target = join(root, 'target')
    mkdirSync(join(legacy, 'servers', '7'), { recursive: true })
    writeFileSync(join(legacy, 'omnihost.db'), 'database')
    writeFileSync(join(legacy, 'servers', '7', 'omnihost.json'), '{}')

    const result = migrateLegacyPortableData(legacy, target)

    expect(result.migrated).toBe(true)
    expect(readFileSync(join(target, 'omnihost.db'), 'utf8')).toBe('database')
    expect(existsSync(join(legacy, 'omnihost.db'))).toBe(true)
  })

  it('does not overwrite an initialized target', () => {
    const root = createTemporaryDirectory()
    const legacy = join(root, 'legacy')
    const target = join(root, 'target')
    mkdirSync(legacy, { recursive: true })
    mkdirSync(target, { recursive: true })
    writeFileSync(join(legacy, 'omnihost.db'), 'legacy')
    writeFileSync(join(target, 'omnihost.db'), 'current')

    expect(migrateLegacyPortableData(legacy, target).migrated).toBe(false)
    expect(readFileSync(join(target, 'omnihost.db'), 'utf8')).toBe('current')
  })
})
