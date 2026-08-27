import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

// This saves the database file securely in your Windows AppData folder
const dbPath = join(app.getPath('userData'), 'omnihost.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Create the servers table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    game TEXT,
    status TEXT,
    players INTEGER
  )
`)

// Insert some default test data ONLY if the database is empty
const count = db.prepare('SELECT COUNT(*) as count FROM servers').get() as { count: number }
if (count.count === 0) {
  const insert = db.prepare('INSERT INTO servers (name, game, status, players) VALUES (?, ?, ?, ?)')
  insert.run('Vanilla Server', 'Minecraft (Paper)', 'Offline', 0)
  insert.run('My Palworld Base', 'Palworld', 'Offline', 0)
}

// Function to send data to our React frontend
export function getServers() {
  return db.prepare('SELECT * FROM servers').all()
}

export function createServer(name: string, game: string) {
  const insert = db.prepare('INSERT INTO servers (name, game, status, players) VALUES (?, ?, ?, ?)')
  const info = insert.run(name, game, 'Offline', 0)
  return info.lastInsertRowid
}

export function deleteServer(id: number) {
  const stmt = db.prepare('DELETE FROM servers WHERE id = ?')
  stmt.run(id)
}

export function updateServerSoftware(id: number, game: string) {
  const stmt = db.prepare('UPDATE servers SET game = ? WHERE id = ?')
  stmt.run(game, id)
}
