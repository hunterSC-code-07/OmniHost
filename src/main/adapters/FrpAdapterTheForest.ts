import { BaseFrpAdapter } from './BaseFrpAdapter';

export class FrpAdapterTheForest extends BaseFrpAdapter {
  getProxyConfig(localIp: string): string {
    return `
[[proxies]]
name = "theforest-8766-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 8766
remotePort = 8766

[[proxies]]
name = "theforest-8766-udp"
type = "udp"
localIP = "${localIp}"
localPort = 8766
remotePort = 8766

[[proxies]]
name = "theforest-27015-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 27015
remotePort = 27015

[[proxies]]
name = "theforest-27015-udp"
type = "udp"
localIP = "${localIp}"
localPort = 27015
remotePort = 27015

[[proxies]]
name = "theforest-27016-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 27016
remotePort = 27016

[[proxies]]
name = "theforest-27016-udp"
type = "udp"
localIP = "${localIp}"
localPort = 27016
remotePort = 27016
`;
  }
}
