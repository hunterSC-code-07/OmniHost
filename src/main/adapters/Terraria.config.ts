import { AdapterConfig } from './AdapterRegistry'
import { TerrariaAdapter } from '../terraria/TerrariaAdapter'

export const config: AdapterConfig = {
  gameName: 'terraria',
  steamAppId: 105600,
  executable: 'TerrariaServer.exe',
  factory: (serverId: number) => new TerrariaAdapter(serverId)
}
