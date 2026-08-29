import { TheForestAdapter } from '../theforest/TheForestAdapter';
import type { IServerAdapter } from './AdapterRegistry';

export const config = {
  gameName: 'The Forest',
  steamAppId: 556450,
  executable: 'TheForestDedicatedServer.exe',
  factory: (id: number): IServerAdapter => new TheForestAdapter(id) as unknown as IServerAdapter
};
