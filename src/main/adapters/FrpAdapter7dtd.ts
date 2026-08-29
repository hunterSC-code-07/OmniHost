import { BaseFrpAdapter } from './BaseFrpAdapter';

export class FrpAdapter7dtd extends BaseFrpAdapter {
  getProxyConfig(localIp: string): string {
    return `
[[proxies]]
name = "7dtd-26900-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 26900
remotePort = 26900

[[proxies]]
name = "7dtd-26900-udp"
type = "udp"
localIP = "${localIp}"
localPort = 26900
remotePort = 26900

[[proxies]]
name = "7dtd-26901-udp"
type = "udp"
localIP = "${localIp}"
localPort = 26901
remotePort = 26901

[[proxies]]
name = "7dtd-26902-udp"
type = "udp"
localIP = "${localIp}"
localPort = 26902
remotePort = 26902
`;
  }
}
