import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

const MIGRATION_MARKER = '.legacy-portable-data-migrated'

export interface DataMigrationResult {
  migrated: boolean
  copiedEntries: string[]
}

export function migrateLegacyPortableData(
  legacyDirectory: string,
  targetDirectory: string
): DataMigrationResult {
  const legacyPath = resolve(legacyDirectory)
  const targetPath = resolve(targetDirectory)

  if (legacyPath === targetPath || !existsSync(legacyPath)) {
    return { migrated: false, copiedEntries: [] }
  }

  const markerPath = join(targetPath, MIGRATION_MARKER)
  const targetAlreadyInitialized =
    existsSync(join(targetPath, 'omnihost.db')) ||
    existsSync(join(targetPath, 'servers')) ||
    existsSync(markerPath)

  if (targetAlreadyInitialized) {
    return { migrated: false, copiedEntries: [] }
  }

  const legacyHasData =
    existsSync(join(legacyPath, 'omnihost.db')) || existsSync(join(legacyPath, 'servers'))

  if (!legacyHasData) {
    return { migrated: false, copiedEntries: [] }
  }

  mkdirSync(targetPath, { recursive: true })
  const copiedEntries: string[] = []

  for (const entry of readdirSync(legacyPath)) {
    const destination = join(targetPath, entry)
    if (existsSync(destination)) continue
    cpSync(join(legacyPath, entry), destination, { recursive: true, errorOnExist: true })
    copiedEntries.push(entry)
  }

  writeFileSync(
    markerPath,
    JSON.stringify({ migratedAt: new Date().toISOString(), legacyPath, copiedEntries }, null, 2),
    'utf8'
  )

  return { migrated: true, copiedEntries }
}
