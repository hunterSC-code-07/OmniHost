import { app, ipcMain } from 'electron';
import { join } from 'path';
import fsPromises from 'fs/promises';
import fs from 'fs';
import { getServers, createServer, deleteServer } from '../db';
import { DayzAdapter } from '../adapters/DayzAdapter';
import { MinecraftProcessManager } from '../minecraft/MinecraftProcessManager';
import { SatisfactoryAdapter } from '../adapters/SatisfactoryAdapter';
import { WakeProxy } from '../adapters/WakeProxy';

async function exists(path: string) {
  try {
    await fsPromises.access(path);
    return true;
  } catch {
    return false;
  }
}

export class ServerLifecycleController {
  static register(activeServers: Record<number, any>, activeProxies: Record<number, WakeProxy>) {
    ipcMain.handle('get-servers', () => {
      const list = getServers() as any[];
      const serversDir = join(app.getPath('userData'), 'servers');
      return list.map((srv) => {
        let meta: any = {};
        let port = 25565;
        const srvDir = join(serversDir, srv.id.toString());
        const metaPath = join(srvDir, 'omnihost.json');
        if (fs.existsSync(metaPath)) {
          try {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          } catch (e) {}
        }
        const propsPath = join(srvDir, 'server.properties');
        if (fs.existsSync(propsPath)) {
          try {
            const props = fs.readFileSync(propsPath, 'utf-8');
            const match = props.match(/^server-port=(\d+)/m);
            if (match) port = parseInt(match[1], 10);
          } catch (e) {}
        }
        let type = meta.type;
        if (!type && srv.game) {
          const typeMatch = srv.game.match(/\((.*?)\)/);
          if (typeMatch) type = typeMatch[1];
          else type = 'Vanilla';
        }
        return {
          ...srv,
          status: activeServers[srv.id] ? 'Online' : srv.status,
          type: type || 'Vanilla',
          version: meta.version || '1.20.4',
          loaderVersion: meta.loaderVersion || '',
          port: srv.port || port || 25565,
          onlinePlayers: activeServers[srv.id] ? activeServers[srv.id].onlinePlayers : [],
          logs: activeServers[srv.id] ? activeServers[srv.id].logHistory : []
        };
      });
    });

    ipcMain.handle('delete-server', async (_, id) => {
      deleteServer(id);
      if (activeServers[id]) {
        await activeServers[id].stop();
        delete activeServers[id];
      }
      const serversDir = join(app.getPath('userData'), 'servers');
      const srvDir = join(serversDir, id.toString());
      if (await exists(srvDir)) {
        for (let i = 0; i < 5; i++) {
          try {
            await fsPromises.rm(srvDir, { recursive: true, force: true });
            break;
          } catch (e: any) {
            if (e.code === 'EBUSY' && i < 4) {
              await new Promise((r) => setTimeout(r, 1000));
            } else {
              throw e;
            }
          }
        }
      }
      return true;
    });

    ipcMain.handle('create-server', async (_, name, game, type, version, loaderVersion) => {
      const gameStr = game === 'Minecraft' ? `Minecraft (${type})` : game;
      const id = createServer(name, gameStr);
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      if (!(await exists(serverDir))) await fsPromises.mkdir(serverDir, { recursive: true });
      await fsPromises.writeFile(
        join(serverDir, 'omnihost.json'),
        JSON.stringify({ game, type, version, loaderVersion })
      );
      return id;
    });

    ipcMain.handle('toggle-auto-start', async (_, id, enabled) => {
      try {
        if (enabled) {
          if (!activeServers[id]) activeServers[id] = new MinecraftProcessManager(id);
          const serverDir = join(app.getPath('userData'), 'servers', id.toString());
          const propsPath = join(serverDir, 'server.properties');
          let port = 25565;
          if (await exists(propsPath)) {
            const props = await fsPromises.readFile(propsPath, 'utf-8');
            const portMatch = props.match(/server-port=(\d+)/);
            if (portMatch) port = parseInt(portMatch[1], 10);
          }

          if (!activeProxies[id]) {
            activeProxies[id] = new WakeProxy(activeServers[id], port);
          }
          activeProxies[id].startListening();
        } else {
          if (activeProxies[id]) {
            activeProxies[id].stopListening();
            delete activeProxies[id];
          }
        }
        return true;
      } catch (e: any) {
        console.error('WakeProxy error:', e);
        return false;
      }
    });

    ipcMain.handle('start-server', async (_, id) => {
      if (!activeServers[id]) {
        const serverDir = join(app.getPath('userData'), 'servers', id.toString());
        let game = 'Minecraft';
        try {
          const metaPath = join(serverDir, 'omnihost.json');
          if (fs.existsSync(metaPath)) {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            if (meta.game) game = meta.game;
          }
        } catch (e) {}

        if (game === 'DayZ') {
          activeServers[id] = new DayzAdapter(id);
        } else if (game === 'Satisfactory') {
          activeServers[id] = new SatisfactoryAdapter(id);
        } else {
          activeServers[id] = new MinecraftProcessManager(id);
        }
      }

      if (activeProxies[id]) {
        activeProxies[id].stopListening();
      }

      await activeServers[id].start();
      return true;
    });

    ipcMain.handle('stop-server', async (_, id) => {
      if (activeServers[id]) {
        activeServers[id].stop();
        delete activeServers[id];
      }
      return true;
    });
  }
}
