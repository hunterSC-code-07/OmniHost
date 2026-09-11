import { app, ipcMain } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'
import { createServer, deleteServer, getServers } from '../db'
import { MinecraftProcessManager } from '../minecraft/MinecraftProcessManager'
import { AdapterRegistry, IServerAdapter } from '../adapters/AdapterRegistry'
import { WakeProxy } from '../adapters/WakeProxy'
import { assertTrustedIpcSender } from '../security/ipcSecurity'
import { resolveServerPort } from '../serverPorts'

type LifecycleState = 'Offline' | 'Starting' | 'Online' | 'Stopping' | 'Failed'

async function exists(path: string): Promise<boolean> {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

function requireServerId(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) throw new Error('Invalid server ID')
  return Number(value)
}

export class ServerLifecycleController {
  static register(
    activeServers: Record<number, IServerAdapter>,
    activeProxies: Record<number, WakeProxy>
  ): () => Promise<void> {
    const states = new Map<number, LifecycleState>()
    const operations = new Map<number, Promise<unknown>>()

    const runExclusive = async <T>(id: number, operation: () => Promise<T>): Promise<T> => {
      const previous = operations.get(id) ?? Promise.resolve()
      const current = previous.catch(() => undefined).then(operation)
      operations.set(id, current)
      try {
        return await current
      } finally {
        if (operations.get(id) === current) operations.delete(id)
      }
    }

    const readServerGame = (id: number): string => {
      const server = (getServers() as Array<{ id: number; game: string }>).find(
        (item) => item.id === id
      )
      if (!server) throw new Error(`Server ${id} does not exist`)
      let game = server.game || 'Minecraft'
      const metaPath = join(app.getPath('userData'), 'servers', String(id), 'omnihost.json')
      try {
        if (fs.existsSync(metaPath)) {
          const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
          if (typeof metadata.game === 'string') game = metadata.game
        }
      } catch (error) {
        console.warn(`Could not read metadata for server ${id}`, error)
      }
      return game.startsWith('Minecraft') ? 'Minecraft' : game
    }

    const getOrCreateManager = (id: number): IServerAdapter => {
      if (activeServers[id]) return activeServers[id]
      const game = readServerGame(id)
      activeServers[id] =
        game === 'Minecraft'
          ? (new MinecraftProcessManager(id) as IServerAdapter)
          : AdapterRegistry.getAdapter(game, id)
      return activeServers[id]
    }

    const startManager = async (id: number): Promise<void> => {
      const manager = getOrCreateManager(id)
      if (manager.process) return
      activeProxies[id]?.stopListening()
      states.set(id, 'Starting')
      try {
        await manager.start()
        if (!manager.process) throw new Error('Server process did not start')
        states.set(id, 'Online')
      } catch (error) {
        states.set(id, 'Failed')
        throw error
      }
    }

    const stopServer = async (id: number): Promise<void> => {
      const manager = activeServers[id]
      if (!manager) {
        states.set(id, 'Offline')
        return
      }
      states.set(id, 'Stopping')
      try {
        await Promise.resolve(manager.stop())
        states.set(id, 'Offline')
      } catch (error) {
        states.set(id, 'Failed')
        throw error
      }
    }

    const removeServerData = async (id: number): Promise<void> => {
      activeProxies[id]?.stopListening()
      delete activeProxies[id]
      await stopServer(id)
      delete activeServers[id]

      const serverDirectory = join(app.getPath('userData'), 'servers', String(id))
      if (await exists(serverDirectory)) {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            await fsPromises.rm(serverDirectory, { recursive: true, force: true })
            break
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'EBUSY' || attempt === 4) throw error
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }

      deleteServer(id)
      states.delete(id)
    }

    const configureWakeProxy = async (id: number, enabled: boolean): Promise<boolean> => {
      if (!enabled) {
        activeProxies[id]?.stopListening()
        delete activeProxies[id]
        return true
      }
      if (readServerGame(id) !== 'Minecraft') {
        throw new Error('Wake-on-connect is currently supported only for Minecraft servers')
      }
      const manager = getOrCreateManager(id)
      const propertiesPath = join(
        app.getPath('userData'),
        'servers',
        String(id),
        'server.properties'
      )
      let port = 25565
      if (await exists(propertiesPath)) {
        const match = (await fsPromises.readFile(propertiesPath, 'utf8')).match(/server-port=(\d+)/)
        if (match) port = Number.parseInt(match[1], 10)
      }
      activeProxies[id] ??= new WakeProxy(manager as MinecraftProcessManager, port, () =>
        runExclusive(id, () => startManager(id))
      )
      activeProxies[id].startListening()
      return true
    }

    const assertInstallationReady = async (
      id: number,
      metadata: Record<string, unknown>
    ): Promise<void> => {
      const serverDirectory = join(app.getPath('userData'), 'servers', String(id))
      const game = String(metadata.game ?? readServerGame(id))
      if (game === 'Minecraft') {
        const entries = await fsPromises.readdir(serverDirectory)
        const hasLaunchJar =
          entries.includes('server.jar') ||
          entries.some(
            (entry) =>
              /^(forge|neoforge)-.+\.jar$/i.test(entry) && !entry.includes('installer')
          )
        if (!hasLaunchJar) throw new Error('Minecraft server files are incomplete')
        return
      }

      const config = Object.entries(AdapterRegistry.getSteamGameConfigs()).find(
        ([gameName]) => gameName.toLowerCase() === game.toLowerCase()
      )?.[1]
      if (!config?.executable || !fs.existsSync(join(serverDirectory, config.executable))) {
        throw new Error(`${game} server executable is missing`)
      }
    }

    ipcMain.handle('get-servers', (event) => {
      assertTrustedIpcSender(event)
      const list = getServers() as Array<
        Record<string, unknown> & { id: number; game?: string; status?: string }
      >
      const serversDirectory = join(app.getPath('userData'), 'servers')
      return list
        .map((server) => {
          let metadata: Record<string, unknown> = {}
          const serverDirectory = join(serversDirectory, String(server.id))
          const metadataPath = join(serverDirectory, 'omnihost.json')
          if (fs.existsSync(metadataPath)) {
            try {
              metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
            } catch (error) {
              console.warn(`Could not read metadata for server ${server.id}`, error)
            }
          }
          let type = typeof metadata.type === 'string' ? metadata.type : undefined
          if (!type && server.game) {
            const typeMatch = server.game.match(/\((.*?)\)/)
            type = typeMatch?.[1] ?? 'Vanilla'
          }
          const manager = activeServers[server.id]
          const runtimeState = manager?.process ? 'Online' : (states.get(server.id) ?? 'Offline')
          return {
            ...server,
            status: runtimeState,
            type: type || 'Vanilla',
            version: metadata.version || '1.20.4',
            loaderVersion: metadata.loaderVersion || '',
            port: resolveServerPort(
              String(metadata.game ?? server.game ?? ''),
              serverDirectory,
              metadata
            ),
            onlinePlayers: manager?.onlinePlayers ?? [],
            logs: manager?.logHistory ?? [],
            creationState: metadata.creationState ?? 'ready'
          }
        })
        .filter((server) => server.creationState !== 'installing')
    })

    ipcMain.handle('delete-server', async (event, rawId) => {
      assertTrustedIpcSender(event)
      const id = requireServerId(rawId)
      return runExclusive(id, async () => {
        await removeServerData(id)
        return true
      })
    })

    ipcMain.handle('create-server', async (event, name, game, type, version, loaderVersion) => {
      assertTrustedIpcSender(event)
      if (typeof name !== 'string' || !name.trim()) throw new Error('Server name is required')
      if (typeof game !== 'string' || !game.trim()) throw new Error('Game is required')
      const gameString = game === 'Minecraft' ? `Minecraft (${type})` : game
      const id = Number(createServer(name.trim(), gameString))
      const serverDirectory = join(app.getPath('userData'), 'servers', String(id))
      try {
        await fsPromises.mkdir(serverDirectory, { recursive: true })
        await fsPromises.writeFile(
          join(serverDirectory, 'omnihost.json'),
          JSON.stringify(
            { game, type, version, loaderVersion, creationState: 'installing' },
            null,
            2
          ),
          'utf8'
        )
      } catch (error) {
        await fsPromises
          .rm(serverDirectory, { recursive: true, force: true })
          .catch(() => undefined)
        deleteServer(id)
        throw error
      }
      return id
    })

    ipcMain.handle('finalize-server-creation', async (event, rawId) => {
      assertTrustedIpcSender(event)
      const id = requireServerId(rawId)
      return runExclusive(id, async () => {
        readServerGame(id)
        const metadataPath = join(app.getPath('userData'), 'servers', String(id), 'omnihost.json')
        const metadata = JSON.parse(await fsPromises.readFile(metadataPath, 'utf8'))
        await assertInstallationReady(id, metadata)
        await fsPromises.writeFile(
          metadataPath,
          JSON.stringify({ ...metadata, creationState: 'ready' }, null, 2),
          'utf8'
        )
        return true
      })
    })

    ipcMain.handle('cancel-server-creation', async (event, rawId) => {
      assertTrustedIpcSender(event)
      const id = requireServerId(rawId)
      return runExclusive(id, async () => {
        await removeServerData(id)
        return true
      })
    })

    ipcMain.handle('toggle-auto-start', async (event, rawId, enabled) => {
      assertTrustedIpcSender(event)
      const id = requireServerId(rawId)
      if (typeof enabled !== 'boolean') throw new Error('Invalid auto-start setting')
      return runExclusive(id, () => configureWakeProxy(id, enabled))
    })

    ipcMain.handle('start-server', async (event, rawId) => {
      assertTrustedIpcSender(event)
      const id = requireServerId(rawId)
      return runExclusive(id, async () => {
        await startManager(id)
        return true
      })
    })

    ipcMain.handle('stop-server', async (event, rawId) => {
      assertTrustedIpcSender(event)
      const id = requireServerId(rawId)
      return runExclusive(id, async () => {
        await stopServer(id)
        return true
      })
    })

    for (const server of getServers() as Array<{ id: number }>) {
      const metadataPath = join(
        app.getPath('userData'),
        'servers',
        String(server.id),
        'omnihost.json'
      )
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
        if (metadata.autoStart === true && metadata.creationState !== 'installing') {
          void runExclusive(server.id, () => configureWakeProxy(server.id, true)).catch((error) =>
            console.error(`Could not restore wake-on-connect for server ${server.id}`, error)
          )
        }
      } catch {
        // Missing or malformed metadata cannot enable persisted behavior.
      }
    }

    return async () => {
      for (const proxy of Object.values(activeProxies)) proxy.stopListening()
      const ids = Object.keys(activeServers).map(Number)
      await Promise.allSettled(ids.map((id) => runExclusive(id, () => stopServer(id))))
    }
  }
}
