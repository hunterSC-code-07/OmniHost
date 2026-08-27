import fs from 'fs'
import { join } from 'path'

export const DEFAULT_SERVER_PROPERTIES: Record<string, string> = {
  'max-players': '20',
  gamemode: 'survival',
  difficulty: 'normal',
  'spawn-monsters': 'true',
  'spawn-animals': 'true',
  'spawn-npcs': 'true',
  pvp: 'true',
  'allow-nether': 'true',
  'view-distance': '10',
  'spawn-protection': '16',
  'online-mode': 'false',
  'white-list': 'false',
  'enable-command-block': 'false',
  'allow-flight': 'false',
  'force-gamemode': 'false',
  'require-resource-pack': 'false',
  'player-idle-timeout': '0',
  'broadcast-console-to-ops': 'false',
  'server-port': '25565',
  motd: 'A Minecraft Server'
}

export class MinecraftConfigManager {
  static async init(serverDir: string) {
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true })
    }

    // Auto-accept EULA
    fs.writeFileSync(join(serverDir, 'eula.txt'), 'eula=true\n')

    const propsPath = join(serverDir, 'server.properties')
    if (!fs.existsSync(propsPath)) {
      const content =
        '# Minecraft server properties\n' +
        Object.entries(DEFAULT_SERVER_PROPERTIES)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n') +
        '\n'
      fs.writeFileSync(propsPath, content)
      return
    }

    let props = fs.readFileSync(propsPath, 'utf-8')
    let modified = false

    if (props.includes('broadcast-console-to-ops=true')) {
      props = props.replace('broadcast-console-to-ops=true', 'broadcast-console-to-ops=false')
      modified = true
    }

    for (const [key, defaultVal] of Object.entries(DEFAULT_SERVER_PROPERTIES)) {
      const regex = new RegExp(`^${key}=.*`, 'm')
      if (!regex.test(props)) {
        props += `\n${key}=${defaultVal}`
        modified = true
      }
    }

    if (modified) {
      fs.writeFileSync(propsPath, props)
    }
  }
}
