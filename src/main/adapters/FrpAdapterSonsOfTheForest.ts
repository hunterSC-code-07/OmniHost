import { BaseFrpAdapter } from './BaseFrpAdapter';

export class FrpAdapterSonsOfTheForest extends BaseFrpAdapter {
  getProxyConfig(localIp: string): string {
    return `
[[proxies]]
name = "sonsoftheforest-8766-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 8766
remotePort = 8766

[[proxies]]
name = "sonsoftheforest-8766-udp"
type = "udp"
localIP = "${localIp}"
localPort = 8766
remotePort = 8766

[[proxies]]
name = "sonsoftheforest-27016-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 27016
remotePort = 27016

[[proxies]]
name = "sonsoftheforest-27016-udp"
type = "udp"
localIP = "${localIp}"
localPort = 27016
remotePort = 27016

[[proxies]]
name = "sonsoftheforest-9700-tcp"
type = "tcp"
localIP = "${localIp}"
localPort = 9700
remotePort = 9700

[[proxies]]
name = "sonsoftheforest-9700-udp"
type = "udp"
localIP = "${localIp}"
localPort = 9700
remotePort = 9700
`;
  }
}
