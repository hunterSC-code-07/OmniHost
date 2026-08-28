import { DayzAdapter } from './DayzAdapter';
import type { IServerAdapter } from './AdapterRegistry';

export const config = {
  gameName: 'DayZ',
  steamAppId: 223350,
  executable: 'DayZServer_x64.exe',
  factory: (id: number): IServerAdapter => new DayzAdapter(id) as unknown as IServerAdapter
};
