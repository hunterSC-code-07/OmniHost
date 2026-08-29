import { BaseFrpAdapter } from './BaseFrpAdapter';

export class FrpAdapterPalworld extends BaseFrpAdapter {
  getProxyConfig(localIp: string): string {
    return `
[[proxies]]
name = "palworld-game-${Date.now()}"
type = "udp"
localIP = "${localIp}"
localPort = 8211
remotePort = 8211

[[proxies]]
name = "palworld-rcon-${Date.now()}"
type = "tcp"
localIP = "${localIp}"
localPort = 25575
remotePort = 25575
`;
  }
}
