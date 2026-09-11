import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

let database: Database.Database | undefined

function getDatabase(): Database.Database {
  if (database) return database

  const dbPath = join(app.getPath('userData'), 'omnihost.db')
  database = new Database(dbPath)
  database.pragma('journal_mode = WAL')
  database.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      game TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Offline',
      players INTEGER NOT NULL DEFAULT 0
    )
  `)

  const rows = database
    .prepare('SELECT id, name, game FROM servers ORDER BY id')
    .all() as Array<{ id: number; name: string; game: string }>
  const isUntouchedLegacyDemoDatabase =
    rows.length === 2 &&
    rows[0]?.id === 1 &&
    rows[0]?.name === 'Vanilla Server' &&
    rows[0]?.game === 'Minecraft (Paper)' &&
    rows[1]?.id === 2 &&
    rows[1]?.name === 'My Palworld Base' &&
    rows[1]?.game === 'Palworld' &&
    rows.every((row) =>
      !existsSync(join(app.getPath('userData'), 'servers', String(row.id), 'omnihost.json'))
    )

  if (isUntouchedLegacyDemoDatabase) {
    database.prepare('DELETE FROM servers WHERE id IN (1, 2)').run()
  }

  return database
}

export function closeDatabase(): void {
  if (!database) return
  database.close()
  database = undefined
}

export function getServers(): unknown[] {
  return getDatabase().prepare('SELECT * FROM servers').all()
}

export function createServer(name: string, game: string): number | bigint {
  const insert = getDatabase().prepare(
    'INSERT INTO servers (name, game, status, players) VALUES (?, ?, ?, ?)'
  )
  return insert.run(name, game, 'Offline', 0).lastInsertRowid
}

export function deleteServer(id: number): void {
  getDatabase().prepare('DELETE FROM servers WHERE id = ?').run(id)
}

export function updateServerSoftware(id: number, game: string): void {
  getDatabase().prepare('UPDATE servers SET game = ? WHERE id = ?').run(game, id)
}
