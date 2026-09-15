import { DayzController } from './DayzController'
import { MinecraftController } from './MinecraftController'
import { ServerLifecycleController, ServerLifecycleMethods } from './ServerLifecycleController'
import { FileSystemController } from './FileSystemController'
import { SatisfactoryController } from './SatisfactoryController'
import { WakeProxy } from '../adapters/WakeProxy'
import { IServerAdapter } from '../adapters/AdapterRegistry'

export function registerServerIpc(
  activeServers: Record<number, IServerAdapter>,
  activeProxies: Record<number, WakeProxy>
): ServerLifecycleMethods {
  DayzController.register(activeServers)
  MinecraftController.register()
  SatisfactoryController.register(activeServers)
  const lifecycleMethods = ServerLifecycleController.register(activeServers, activeProxies)
  FileSystemController.register()
  return lifecycleMethods
}
