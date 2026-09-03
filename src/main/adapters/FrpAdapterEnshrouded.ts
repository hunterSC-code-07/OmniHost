import { BaseFrpAdapter } from './BaseFrpAdapter';

export class FrpAdapterEnshrouded extends BaseFrpAdapter {
  getProxyConfig(localIp: string): string {
    return `
[[proxies]]
name = "enshrouded-15636-udp"
type = "udp"
localIP = "${localIp}"
localPort = 15636
remotePort = 15636

[[proxies]]
name = "enshrouded-15636-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 15636
remotePort = 15636

[[proxies]]
name = "enshrouded-15637-udp"
type = "udp"
localIP = "${localIp}"
localPort = 15637
remotePort = 15637

[[proxies]]
name = "enshrouded-15637-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 15637
remotePort = 15637
`;
  }
}
