import { ipcMain, app } from 'electron';
import fs from 'fs';
import { join } from 'path';

export function registerSevenDaysToDieIpc(): void {
  ipcMain.handle('get-7dtd-items', async (_event, serverId: number) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const itemsPath = join(serverDir, 'Data', 'Config', 'items.xml');
      const blocksPath = join(serverDir, 'Data', 'Config', 'blocks.xml');
      
      const items: any[] = [];
      const itemRegex = /<(item|block)\s+name="([^"]+)"(?:>|[\s\S]*?<\/\1>)/g;
      
      // Parse Items
      if (fs.existsSync(itemsPath)) {
        const content = await fs.promises.readFile(itemsPath, 'utf8');
        let match;
        while ((match = itemRegex.exec(content)) !== null) {
          const type = match[1]; // item
          const name = match[2];
          const block = match[0];
          
          let group = 'Misc';
          const groupMatch = block.match(/<property\s+name="Group"\s+value="([^"]+)"/);
          if (groupMatch) {
            group = groupMatch[1];
          }
          items.push({ name, group, type });
        }
      }

      // Parse Blocks
      if (fs.existsSync(blocksPath)) {
        const content = await fs.promises.readFile(blocksPath, 'utf8');
        let match;
        while ((match = itemRegex.exec(content)) !== null) {
          const type = match[1]; // block
          const name = match[2];
          const block = match[0];
          
          let group = 'Building';
          const groupMatch = block.match(/<property\s+name="Group"\s+value="([^"]+)"/);
          if (groupMatch) {
            group = groupMatch[1];
          }
          items.push({ name, group, type: 'item' }); // Spawning a block still uses 'give'
        }
      }
      
      return items;
    } catch (err) {
      console.error('Error fetching 7dtd items:', err);
      return [];
    }
  });

  ipcMain.handle('get-7dtd-entities', async (_event, serverId: number) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const entitiesPath = join(serverDir, 'Data', 'Config', 'entityclasses.xml');
      const entities: any[] = [];
      
      if (fs.existsSync(entitiesPath)) {
        const content = await fs.promises.readFile(entitiesPath, 'utf8');
        const entityRegex = /<entity_class\s+name="([^"]+)"(?:>|[\s\S]*?<\/entity_class>)/g;
        let match;
        while ((match = entityRegex.exec(content)) !== null) {
          const name = match[1];
          const _block = match[0];
          
          if (name.includes('player')) continue;
          
          let group = 'Entity';
          if (name.toLowerCase().includes('zombie')) group = 'Zombie';
          else if (name.toLowerCase().includes('vehicle')) group = 'Vehicle';
          else if (name.toLowerCase().includes('animal')) group = 'Animal';
          
          entities.push({ name, group, type: 'entity' });
        }
      }
      
      return entities;
    } catch (err) {
      console.error('Error fetching 7dtd entities:', err);
      return [];
    }
  });

  ipcMain.handle('get-nexus-api-key', async () => {
    try {
      const envPath = join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = await fs.promises.readFile(envPath, 'utf8');
        const match = content.match(/^NEXUS_API_KEY=(.*)$/m);
        if (match) return match[1].trim();
      }
      return null;
    } catch (err) {
      console.error('Error reading NEXUS_API_KEY:', err);
      return null;
    }
  });

  ipcMain.handle('set-nexus-api-key', async (_event, key: string) => {
    try {
      const envPath = join(process.cwd(), '.env');
      let content = '';
      if (fs.existsSync(envPath)) {
        content = await fs.promises.readFile(envPath, 'utf8');
      }
      if (content.match(/^NEXUS_API_KEY=/m)) {
        content = content.replace(/^NEXUS_API_KEY=.*$/m, `NEXUS_API_KEY=${key}`);
      } else {
        content += `\nNEXUS_API_KEY=${key}\n`;
      }
      await fs.promises.writeFile(envPath, content.trim() + '\n', 'utf8');
      return true;
    } catch (err) {
      console.error('Error saving NEXUS_API_KEY:', err);
      return false;
    }
  });

  ipcMain.handle('get-7dtd-mods', async (_event, serverId: number) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const modsDir = join(serverDir, 'Mods');
      const disabledModsDir = join(serverDir, 'Mods_Disabled');
      
      const mods: any[] = [];
      
      const scanDir = async (dir: string, enabled: boolean) => {
        if (!fs.existsSync(dir)) return;
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const modInfoPath = join(dir, entry.name, 'ModInfo.xml');
            if (fs.existsSync(modInfoPath)) {
              const content = await fs.promises.readFile(modInfoPath, 'utf8');
              const nameMatch = content.match(/<Name[^>]*value="([^"]+)"/i) || content.match(/<Mod[^>]*>\s*<Name[^>]*>([^<]+)<\/Name>/i);
              const versionMatch = content.match(/<Version[^>]*value="([^"]+)"/i) || content.match(/<Version[^>]*>([^<]+)<\/Version>/i);
              const authorMatch = content.match(/<Author[^>]*value="([^"]+)"/i) || content.match(/<Author[^>]*>([^<]+)<\/Author>/i);
              const descMatch = content.match(/<Description[^>]*value="([^"]+)"/i) || content.match(/<Description[^>]*>([^<]+)<\/Description>/i);
              
              const dependencies: string[] = [];
              const dependsOnRegex = /<DependsOn[^>]*value="([^"]+)"/ig;
              let depMatch;
              while ((depMatch = dependsOnRegex.exec(content)) !== null) {
                dependencies.push(depMatch[1]);
              }
              // Also check alternative format <DependsOn>ModName</DependsOn>
              const altDependsOnRegex = /<DependsOn[^>]*>([^<]+)<\/DependsOn>/ig;
              while ((depMatch = altDependsOnRegex.exec(content)) !== null) {
                if (!dependencies.includes(depMatch[1])) dependencies.push(depMatch[1]);
              }

              mods.push({
                folderName: entry.name,
                name: nameMatch ? nameMatch[1] : entry.name,
                version: versionMatch ? versionMatch[1] : 'Unknown',
                author: authorMatch ? authorMatch[1] : 'Unknown',
                description: descMatch ? descMatch[1] : '',
                enabled,
                path: join(dir, entry.name),
                dependencies
              });
            }
          }
        }
      };
      
      await scanDir(modsDir, true);
      await scanDir(disabledModsDir, false);
      
      // Calculate missing dependencies
      for (const mod of mods) {
        mod.missingDependencies = mod.dependencies.filter(
          (dep: string) => !mods.some(m => m.name.toLowerCase() === dep.toLowerCase() || m.folderName.toLowerCase() === dep.toLowerCase())
        );
      }

      return mods;
    } catch (err) {
      console.error('Error fetching 7dtd mods:', err);
      return [];
    }
  });

  ipcMain.handle('toggle-7dtd-mod', async (_event, serverId: number, folderName: string, enabled: boolean) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const modsDir = join(serverDir, 'Mods');
      const disabledModsDir = join(serverDir, 'Mods_Disabled');
      
      if (!fs.existsSync(modsDir)) await fs.promises.mkdir(modsDir, { recursive: true });
      if (!fs.existsSync(disabledModsDir)) await fs.promises.mkdir(disabledModsDir, { recursive: true });
      
      const source = enabled ? join(disabledModsDir, folderName) : join(modsDir, folderName);
      const dest = enabled ? join(modsDir, folderName) : join(disabledModsDir, folderName);
      
      if (fs.existsSync(source)) {
        await fs.promises.rename(source, dest);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error toggling mod:', err);
      return false;
    }
  });

  ipcMain.handle('delete-7dtd-mod', async (_event, serverId: number, folderName: string) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
      const modsDir = join(serverDir, 'Mods');
      const disabledModsDir = join(serverDir, 'Mods_Disabled');
      
      const enabledPath = join(modsDir, folderName);
      const disabledPath = join(disabledModsDir, folderName);
      
      if (fs.existsSync(enabledPath)) {
        await fs.promises.rm(enabledPath, { recursive: true, force: true });
      }
      if (fs.existsSync(disabledPath)) {
        await fs.promises.rm(disabledPath, { recursive: true, force: true });
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting mod:', err);
      return false;
    }
  });
}

