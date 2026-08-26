import fs from 'fs'
import { join } from 'path'

export class MinecraftConfigManager {
  static async init(serverDir: string) {
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    
    // Auto-accept EULA
    fs.writeFileSync(join(serverDir, 'eula.txt'), 'eula=true\n');

    const propsPath = join(serverDir, 'server.properties');
    if (fs.existsSync(propsPath)) {
      let props = fs.readFileSync(propsPath, 'utf-8');
      let modified = false;

      if (props.includes('broadcast-console-to-ops=true')) {
        props = props.replace('broadcast-console-to-ops=true', 'broadcast-console-to-ops=false');
        modified = true;
      } else if (!props.includes('broadcast-console-to-ops=')) {
        props += '\nbroadcast-console-to-ops=false\n';
        modified = true;
      }

      if (!props.includes('online-mode=')) {
        props += '\nonline-mode=false\n';
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(propsPath, props);
      }
    } else {
      fs.writeFileSync(propsPath, 'broadcast-console-to-ops=false\nonline-mode=false\n');
    }
  }
}
