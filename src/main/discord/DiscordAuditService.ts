import { app } from 'electron'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'

export interface DiscordAuditEntry {
  at: string
  userId: string
  username: string
  command: string
  serverId?: number
  result: 'allowed' | 'denied' | 'success' | 'failure'
  detail?: string
}

export class DiscordAuditService {
  record(entry: DiscordAuditEntry): void {
    const path = join(app.getPath('userData'), 'discord-audit.jsonl')
    mkdirSync(dirname(path), { recursive: true })
    appendFileSync(path, `${JSON.stringify(entry)}\n`, 'utf8')
  }

  recent(limit = 20): DiscordAuditEntry[] {
    const path = join(app.getPath('userData'), 'discord-audit.jsonl')
    if (!existsSync(path)) return []
    return readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-Math.min(Math.max(limit, 1), 100))
      .flatMap((line) => {
        try {
          const entry = JSON.parse(line) as DiscordAuditEntry
          return entry && typeof entry.command === 'string' ? [entry] : []
        } catch {
          return []
        }
      })
      .reverse()
  }
}

export const discordAuditService = new DiscordAuditService()
