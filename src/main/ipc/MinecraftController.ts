import { app, ipcMain } from 'electron';
import { join } from 'path';
import fs from 'fs';
import { updateServerSoftware } from '../db';

export class MinecraftController {
  static register() {
    ipcMain.handle('change-server-software', async (_, id, type, version, loaderVersion) => {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const modsDir = join(serverDir, 'mods');

      // Rename old mods folder to prevent compatibility issues
      if (fs.existsSync(modsDir)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.renameSync(modsDir, join(serverDir, `mods_old_${timestamp}`));
      }

      // Cleanup old startup scripts and modloader jars to prevent booting the wrong software
      const cleanupFiles = ['run.bat', 'start.bat', 'run.sh', 'start.sh', 'user_jvm_args.txt'];
      for (const file of cleanupFiles) {
        const p = join(serverDir, file);
        if (fs.existsSync(p)) fs.rmSync(p);
      }

      const allFiles = fs.readdirSync(serverDir);
      for (const file of allFiles) {
        if ((file.startsWith('forge-') || file.startsWith('neoforge-')) && file.endsWith('.jar')) {
          fs.rmSync(join(serverDir, file));
        }
      }

      // Update omnihost.json
      fs.writeFileSync(
        join(serverDir, 'omnihost.json'),
        JSON.stringify({ game: 'Minecraft', type, version, loaderVersion })
      );

      // Update DB
      updateServerSoftware(id, `Minecraft (${type})`);

      return true;
    });
  }
}
