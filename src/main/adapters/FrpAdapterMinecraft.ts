import { BaseFrpAdapter } from './BaseFrpAdapter'

export class FrpAdapterMinecraft extends BaseFrpAdapter {
  getProxyConfig(localIp: string, portOverride = 25565): string {
    return `
[[proxies]]
name = "minecraft-${Date.now()}"
type = "tcp"
localIP = "${localIp}"
localPort = ${portOverride}
remotePort = ${portOverride}

[[proxies]]
name = "minecraft-udp"
type = "udp"
localIP = "${localIp}"
localPort = ${portOverride}
remotePort = ${portOverride}
`
  }
}
