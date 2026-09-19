import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { URL } from 'url'
import { getServerDirectory } from '../storage/db'

export interface ModManifestEntry {
  relativePath: string
  hash: string
  size: number
}

export class ModSyncServer {
  private server: http.Server | null = null
  private port: number = 26905 // Default port for Mod Sync

  private getModsDir(_gameId: string, serverId: number): string {
    // Basic implementation: assumes all games store mods in `userData/servers/<id>/Mods`
    // This can be expanded based on gameId if some games use different folders.
    return path.join(getServerDirectory(serverId), 'Mods')
  }

  private async calculateHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)
      stream.on('error', (err) => reject(err))
      stream.on('data', (chunk) => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
    })
  }

  private async scanDirectory(dir: string, baseDir: string): Promise<ModManifestEntry[]> {
    let results: ModManifestEntry[] = []
    if (!fs.existsSync(dir)) return results

    const list = await fs.promises.readdir(dir, { withFileTypes: true })
    for (const file of list) {
      const fullPath = path.join(dir, file.name)
      if (file.isDirectory()) {
        const subResults = await this.scanDirectory(fullPath, baseDir)
        results = results.concat(subResults)
      } else {
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
        const stat = await fs.promises.stat(fullPath)
        const hash = await this.calculateHash(fullPath)
        results.push({ relativePath, hash, size: stat.size })
      }
    }
    return results
  }

  public start(port: number = 26905): void {
    if (this.server) {
      console.log(`[ModSyncServer] Already running on port ${this.port}`)
      return
    }

    this.port = port
    this.server = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          res.writeHead(400)
          res.end('Bad Request')
          return
        }

        // Need to pass a dummy base URL to parse properly
        const url = new URL(req.url, `http://localhost:${this.port}`)
        const gameId = url.searchParams.get('gameId')
        const serverIdStr = url.searchParams.get('serverId')

        if (!gameId || !serverIdStr) {
          res.writeHead(400)
          res.end('Missing gameId or serverId')
          return
        }

        const serverId = parseInt(serverIdStr, 10)
        const modsDir = this.getModsDir(gameId, serverId)

        if (url.pathname === '/api/manifest') {
          if (!fs.existsSync(modsDir)) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ files: [] }))
            return
          }

          const manifest = await this.scanDirectory(modsDir, modsDir)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ files: manifest }))
          return
        }

        if (url.pathname === '/api/download') {
          const fileParam = url.searchParams.get('file')
          if (!fileParam) {
            res.writeHead(400)
            res.end('Missing file parameter')
            return
          }

          // Prevent directory traversal
          const safeRelativePath = path.normalize(fileParam).replace(/^(\.\.[\/\\])+/, '')
          const filePath = path.join(modsDir, safeRelativePath)

          if (!filePath.startsWith(modsDir) || !fs.existsSync(filePath)) {
            res.writeHead(404)
            res.end('File not found')
            return
          }

          const stat = fs.statSync(filePath)
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': stat.size
          })

          const readStream = fs.createReadStream(filePath)
          readStream.pipe(res)
          return
        }

        res.writeHead(404)
        res.end('Not Found')
      } catch (err) {
        console.error('[ModSyncServer] Error handling request:', err)
        res.writeHead(500)
        res.end('Internal Server Error')
      }
    })

    this.server.listen(this.port, () => {
      console.log(`[ModSyncServer] Listening on port ${this.port}`)
    })
  }

  public stop(): void {
    if (this.server) {
      this.server.close()
      this.server = null
      console.log('[ModSyncServer] Stopped')
    }
  }
}

// Export a singleton instance
export const modSyncServer = new ModSyncServer()
