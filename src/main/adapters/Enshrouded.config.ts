import { EnshroudedAdapter } from '../enshrouded/EnshroudedAdapter';
import type { IServerAdapter } from './AdapterRegistry';

export const config = {
  gameName: 'Enshrouded',
  steamAppId: 2278520,
  executable: 'enshrouded_server.exe',
  factory: (id: number): IServerAdapter => new EnshroudedAdapter(id) as unknown as IServerAdapter
};
