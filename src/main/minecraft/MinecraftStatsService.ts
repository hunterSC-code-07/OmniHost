import fs from 'fs'
import { join } from 'path'

export class MinecraftStatsService {
  static async updatePlayerStats(serverDir: string, username: string, isJoin: boolean) {
    const statsPath = join(serverDir, 'player-stats.json');
    let stats: any = {};
    if (fs.existsSync(statsPath)) {
      try {
        stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      } catch (e) {}
    }
    
    if (!stats[username]) {
      stats[username] = {
        username,
        firstJoin: Date.now(),
        lastLeft: null,
        totalPlaytime: 0
      };
    }

    if (isJoin) {
      stats[username].currentSessionStart = Date.now();
      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
    } else {
      const joinTime = stats[username].currentSessionStart;
      if (joinTime) {
        const duration = Date.now() - joinTime;
        stats[username].totalPlaytime += duration;
        stats[username].currentSessionStart = null;
      }
      stats[username].lastLeft = Date.now();

      try {
        const cachePath = join(serverDir, 'usercache.json');
        if (fs.existsSync(cachePath)) {
          const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
          const playerEntry = cache.find((p: any) => p.name.toLowerCase() === username.toLowerCase());
          if (playerEntry) {
            let datPath = join(serverDir, 'world', 'playerdata', `${playerEntry.uuid}.dat`);
            if (!fs.existsSync(datPath)) {
              datPath = join(serverDir, 'world', 'players', 'data', `${playerEntry.uuid}.dat`);
            }
            if (fs.existsSync(datPath)) {
              const buffer = fs.readFileSync(datPath);
              const nbt = require('prismarine-nbt');
              const { parsed } = await nbt.parse(buffer);
              const pos = parsed.value.Pos?.value?.value || [];
              if (pos.length === 3) {
                 stats[username].logoffPosition = { x: Math.round(pos[0]), y: Math.round(pos[1]), z: Math.round(pos[2]) };
              }
            }
          }
        }
      } catch (err) {
        console.error(`[System] Error getting position for ${username}: ${err}`);
      }

      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
    }
  }
}
