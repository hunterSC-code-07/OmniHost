import type { IServerAdapter } from './AdapterRegistry';
import { PalworldAdapter } from './PalworldAdapter';

export const config = {
  gameName: 'Palworld',
  steamAppId: 2394010,
  executable: 'PalServer.exe',
  factory: (id: number): IServerAdapter => new PalworldAdapter(id) as unknown as IServerAdapter
};
