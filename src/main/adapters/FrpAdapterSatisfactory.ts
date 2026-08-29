import { BaseFrpAdapter } from './BaseFrpAdapter';

export class FrpAdapterSatisfactory extends BaseFrpAdapter {
  getProxyConfig(localIp: string): string {
    return `
[[proxies]]
name = "satisfactory-7777-udp"
type = "udp"
localIP = "${localIp}"
localPort = 7777
remotePort = 7777

[[proxies]]
name = "satisfactory-7777-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 7777
remotePort = 7777

[[proxies]]
name = "satisfactory-8888-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 8888
remotePort = 8888
`;
  }
}
