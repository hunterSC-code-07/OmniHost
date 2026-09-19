export function isSafeDiscordBackupFilename(filename: string): boolean {
  return /^[a-zA-Z0-9_-]+_[0-9TZ-]+\.zip$/.test(filename)
}

export function isSafeDiscordArchiveEntry(entryName: string): boolean {
  const normalized = entryName.replace(/\\/g, '/')
  return (
    !normalized.startsWith('/') &&
    !normalized.split('/').includes('..') &&
    new Set(['world', 'world_nether', 'world_the_end']).has(normalized.split('/')[0])
  )
}
