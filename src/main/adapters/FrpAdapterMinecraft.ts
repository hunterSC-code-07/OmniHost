import { BaseFrpAdapter } from './BaseFrpAdapter';

export class FrpAdapterMinecraft extends BaseFrpAdapter {
  getProxyConfig(localIp: string): string {
    return `
[[proxies]]
name = "minecraft-${Date.now()}"
type = "tcp"
localIP = "${localIp}"
localPort = 25565
remotePort = 25565

[[proxies]]
name = "minecraft-udp"
type = "udp"
localIP = "${localIp}"
localPort = 25565
remotePort = 25565
`;
  }
}
