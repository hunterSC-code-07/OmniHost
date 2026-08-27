import { DayzController } from './DayzController';
import { MinecraftController } from './MinecraftController';
import { ServerLifecycleController } from './ServerLifecycleController';
import { FileSystemController } from './FileSystemController';
import { WakeProxy } from '../adapters/WakeProxy';

export function registerServerIpc(
  activeServers: Record<number, any>,
  activeProxies: Record<number, WakeProxy>
) {
  DayzController.register(activeServers);
  MinecraftController.register();
  ServerLifecycleController.register(activeServers, activeProxies);
  FileSystemController.register();
}
