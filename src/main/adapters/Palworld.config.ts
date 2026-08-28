import type { IServerAdapter } from './AdapterRegistry';

export const config = {
  gameName: 'Palworld',
  steamAppId: 2394010,
  executable: 'PalServer.exe',
  factory: (_id: number): IServerAdapter => { throw new Error('Not implemented'); }
};
