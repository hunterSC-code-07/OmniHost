const fs = require('fs');

let code = fs.readFileSync('src/main/adapters/MinecraftAdapter.ts', 'utf-8');

// 1. Add playerJoinTimes
if (!code.includes('playerJoinTimes: Record<string, number>')) {
  code = code.replace(
    'onlinePlayers: string[] = [];',
    'onlinePlayers: string[] = [];\n  playerJoinTimes: Record<string, number> = {};'
  );
}

// 2. Add updatePlayerStats method
if (!code.includes('updatePlayerStats(username: string, isJoin: boolean)')) {
  const methodCode = `
  updatePlayerStats(username: string, isJoin: boolean) {
    const statsPath = join(this.serverDir, 'player-stats.json');
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
      this.playerJoinTimes[username] = Date.now();
      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
    } else {
      const joinTime = this.playerJoinTimes[username];
      if (joinTime) {
        const duration = Date.now() - joinTime;
        stats[username].totalPlaytime += duration;
        delete this.playerJoinTimes[username];
      }
      stats[username].lastLeft = Date.now();
      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
    }
  }

  start(`;
  code = code.replace('  start(', methodCode);
}

// 3. Add to joinMatch
code = code.replace(
  /this\.onlinePlayers\.push\(joinMatch\[1\]\);\s+this\.sendPlayerUpdate\(\);/g,
  'this.onlinePlayers.push(joinMatch[1]);\n            this.updatePlayerStats(joinMatch[1], true);\n            this.sendPlayerUpdate();'
);

// 4. Add to leaveMatch
code = code.replace(
  /this\.onlinePlayers = this\.onlinePlayers\.filter\(p => p !== leaveMatch\[1\]\);\s+this\.sendPlayerUpdate\(\);/g,
  'this.onlinePlayers = this.onlinePlayers.filter(p => p !== leaveMatch[1]);\n          this.updatePlayerStats(leaveMatch[1], false);\n          this.sendPlayerUpdate();'
);

fs.writeFileSync('src/main/adapters/MinecraftAdapter.ts', code, 'utf-8');
console.log('Successfully injected stats logic.');
