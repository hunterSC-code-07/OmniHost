import { BaseFrpAdapter } from './BaseFrpAdapter';

export class FrpAdapterTerraria extends BaseFrpAdapter {
  getProxyConfig(localIp: string): string {
    return `
[[proxies]]
name = "terraria-game-${Date.now()}"
type = "tcp"
localIP = "127.0.0.1"
localPort = 7777
remotePort = 7777
`;
  }
}
