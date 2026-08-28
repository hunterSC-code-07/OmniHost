import { SatisfactoryAdapter } from './SatisfactoryAdapter';
import type { IServerAdapter } from './AdapterRegistry';

export const config = {
  gameName: 'Satisfactory',
  steamAppId: 1690800,
  executable: 'FactoryServer.exe',
  factory: (id: number): IServerAdapter => new SatisfactoryAdapter(id) as unknown as IServerAdapter
};
