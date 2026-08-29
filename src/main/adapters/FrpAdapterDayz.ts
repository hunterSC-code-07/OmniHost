import { BaseFrpAdapter } from './BaseFrpAdapter';

export class FrpAdapterDayz extends BaseFrpAdapter {
  getProxyConfig(localIp: string): string {
    return `
[[proxies]]
name = "dayz-game"
type = "udp"
localIP = "${localIp}"
localPort = 2302
remotePort = 2302

[[proxies]]
name = "dayz-steam-query"
type = "udp"
localIP = "${localIp}"
localPort = 2303
remotePort = 2303

[[proxies]]
name = "dayz-steam-master-8766"
type = "udp"
localIP = "${localIp}"
localPort = 8766
remotePort = 8766

[[proxies]]
name = "dayz-steam-master-2304"
type = "udp"
localIP = "${localIp}"
localPort = 2304
remotePort = 2304

[[proxies]]
name = "dayz-von"
type = "udp"
localIP = "${localIp}"
localPort = 2305
remotePort = 2305

[[proxies]]
name = "dayz-battleye"
type = "udp"
localIP = "${localIp}"
localPort = 2306
remotePort = 2306

[[proxies]]
name = "dayz-steam"
type = "udp"
localIP = "${localIp}"
localPort = 27016
remotePort = 27016
`;
  }
}
