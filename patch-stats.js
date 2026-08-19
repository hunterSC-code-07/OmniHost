const fs = require('fs');
const path = require('path');

let code = fs.readFileSync('src/main/adapters/MinecraftAdapter.ts', 'utf-8');

// 1. Add playerJoinTimes property
code = code.replace(
  `  onlinePlayers: string[] = [];`,
  `  onlinePlayers: string[] = [];\n  playerJoinTimes: Record<string, number> = {};`
);

// 2. Add updatePlayerStats method
const updateStatsMethod = `
  updatePlayerStats(username: string, isJoin: boolean) {
    const statsPath = join(this.serverDir, 'player-stats.json');
    let stats = {};
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

  sendPlayerUpdate() {`;

code = code.replace(`  sendPlayerUpdate() {`, updateStatsMethod);

// 3. Update joinMatch
const oldJoin = `        const joinMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) joined the game/);
        if (joinMatch) {
          if (!this.onlinePlayers.includes(joinMatch[1])) {
            this.onlinePlayers.push(joinMatch[1]);
            this.sendPlayerUpdate();
          }
        }`;
const newJoin = `        const joinMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) joined the game/);
        if (joinMatch) {
          if (!this.onlinePlayers.includes(joinMatch[1])) {
            this.onlinePlayers.push(joinMatch[1]);
            this.updatePlayerStats(joinMatch[1], true);
            this.sendPlayerUpdate();
          }
        }`;
code = code.replace(oldJoin, newJoin);

// 4. Update leaveMatch
const oldLeave = `        const leaveMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) left the game/);
        if (leaveMatch) {
          this.onlinePlayers = this.onlinePlayers.filter(p => p !== leaveMatch[1]);
          this.sendPlayerUpdate();
        }`;
const newLeave = `        const leaveMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) left the game/);
        if (leaveMatch) {
          this.onlinePlayers = this.onlinePlayers.filter(p => p !== leaveMatch[1]);
          this.updatePlayerStats(leaveMatch[1], false);
          this.sendPlayerUpdate();
        }`;
code = code.replace(oldLeave, newLeave);

fs.writeFileSync('src/main/adapters/MinecraftAdapter.ts', code, 'utf-8');
console.log('Patched MinecraftAdapter.ts');
