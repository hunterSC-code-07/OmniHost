const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Since we cannot easily import MinecraftAdapter due to electron dependency,
// let's just copy the logic and run it.

const serverDir = path.join(process.env.APPDATA || '', 'omnihost', 'servers', '14');
const username = 'Panthera';
const isJoin = true;

const playerJoinTimes = {};

function updatePlayerStats(username, isJoin) {
    const statsPath = path.join(serverDir, 'player-stats.json');
    console.log("Writing to", statsPath);
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
      playerJoinTimes[username] = Date.now();
      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
      console.log("Wrote join");
    } else {
      const joinTime = playerJoinTimes[username];
      if (joinTime) {
        const duration = Date.now() - joinTime;
        stats[username].totalPlaytime += duration;
        delete playerJoinTimes[username];
      }
      stats[username].lastLeft = Date.now();
      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
      console.log("Wrote leave");
    }
}

updatePlayerStats('Panthera', true);
