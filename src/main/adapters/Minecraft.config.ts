import { MinecraftProcessManager } from '../minecraft/MinecraftProcessManager';
import type { IServerAdapter } from './AdapterRegistry';

export const config = {
  gameName: 'Minecraft',
  // No steamAppId
  factory: (id: number): IServerAdapter => new MinecraftProcessManager(id) as unknown as IServerAdapter
};
