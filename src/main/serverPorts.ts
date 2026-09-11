import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getGameCapability, normalizeGameName } from '../shared/gameCapabilities'

function readPort(filePath: string, pattern: RegExp): number | undefined {
  if (!existsSync(filePath)) return undefined
  const match = readFileSync(filePath, 'utf8').match(pattern)
  if (!match) return undefined
  const port = Number.parseInt(match[1], 10)
  return port >= 1 && port <= 65535 ? port : undefined
}

export function resolveServerPort(
  game: string,
  serverDirectory: string,
  metadata: Record<string, unknown> = {}
): number {
  const metadataPort = Number(metadata.port)
  if (Number.isSafeInteger(metadataPort) && metadataPort >= 1 && metadataPort <= 65535) {
    return metadataPort
  }

  switch (normalizeGameName(game)) {
    case 'minecraft':
      return (
        readPort(join(serverDirectory, 'server.properties'), /^server-port=(\d+)/m) ??
        getGameCapability(game).defaultPort
      )
    case 'terraria':
      return (
        readPort(join(serverDirectory, 'serverconfig.txt'), /^port=(\d+)/m) ??
        getGameCapability(game).defaultPort
      )
    case '7 days to die':
      return (
        readPort(
          join(serverDirectory, 'serverconfig.xml'),
          /<property\s+name=["']ServerPort["']\s+value=["'](\d+)["']/i
        ) ?? getGameCapability(game).defaultPort
      )
    case 'palworld':
      return (
        readPort(
          join(serverDirectory, 'Pal', 'Saved', 'Config', 'WindowsServer', 'PalWorldSettings.ini'),
          /PublicPort=(\d+)/i
        ) ?? getGameCapability(game).defaultPort
      )
    default:
      return getGameCapability(game).defaultPort
  }
}
