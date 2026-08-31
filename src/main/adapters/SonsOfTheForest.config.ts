import { SonsOfTheForestAdapter } from '../sonsoftheforest/SonsOfTheForestAdapter';
import type { IServerAdapter } from './AdapterRegistry';

export const config = {
  gameName: 'Sons of the Forest',
  steamAppId: 2465200,
  executable: 'SonsOfTheForestDS.exe',
  factory: (id: number): IServerAdapter => new SonsOfTheForestAdapter(id) as unknown as IServerAdapter
};
