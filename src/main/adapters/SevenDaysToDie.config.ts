import { SevenDaysToDieAdapter } from '../7dtd/SevenDaysToDieAdapter';
import type { IServerAdapter } from './AdapterRegistry';

export const config = {
  gameName: '7 Days to Die',
  steamAppId: 294420,
  executable: '7DaysToDieServer.exe',
  factory: (id: number): IServerAdapter => new SevenDaysToDieAdapter(id) as unknown as IServerAdapter
};
