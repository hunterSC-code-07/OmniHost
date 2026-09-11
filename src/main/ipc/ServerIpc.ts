import { DayzController } from './DayzController'
import { MinecraftController } from './MinecraftController'
import { ServerLifecycleController } from './ServerLifecycleController'
import { FileSystemController } from './FileSystemController'
import { SatisfactoryController } from './SatisfactoryController'
import { WakeProxy } from '../adapters/WakeProxy'
import { IServerAdapter } from '../adapters/AdapterRegistry'

export function registerServerIpc(
  activeServers: Record<number, IServerAdapter>,
  activeProxies: Record<number, WakeProxy>
): () => Promise<void> {
  DayzController.register(activeServers)
  MinecraftController.register()
  SatisfactoryController.register(activeServers)
  const shutdownServers = ServerLifecycleController.register(activeServers, activeProxies)
  FileSystemController.register()
  return shutdownServers
}
