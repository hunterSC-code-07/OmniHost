import { describe, expect, it } from 'vitest'
import {
  isSafeDiscordArchiveEntry,
  isSafeDiscordBackupFilename
} from '@main/discord/DiscordBackupValidation'

describe('Discord backup safety validation', () => {
  it('accepts generated backup filenames and rejects traversal names', () => {
    expect(isSafeDiscordBackupFilename('scheduled-backup_2026-09-19T12-30-00-000Z.zip')).toBe(true)
    expect(isSafeDiscordBackupFilename('../world_2026-09-19T12-30-00-000Z.zip')).toBe(false)
    expect(isSafeDiscordBackupFilename('world.zip')).toBe(false)
  })

  it('allows only supported world archive roots', () => {
    expect(isSafeDiscordArchiveEntry('world/region/r.0.0.mca')).toBe(true)
    expect(isSafeDiscordArchiveEntry('world_nether/level.dat')).toBe(true)
    expect(isSafeDiscordArchiveEntry('world/../secrets.txt')).toBe(false)
    expect(isSafeDiscordArchiveEntry('/world/level.dat')).toBe(false)
    expect(isSafeDiscordArchiveEntry('backups/secret.zip')).toBe(false)
  })
})
