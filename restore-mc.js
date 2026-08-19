const fs = require('fs');

let code = fs.readFileSync('src/main/adapters/MinecraftAdapter.ts', 'utf-8');

const oldCode = `      rl.on('line', (line: string) => {
        const rawText = line.trim();
  stop() {`;

const restoredCode = `      rl.on('line', (line: string) => {
        const rawText = line.trim();
        const cleanText = rawText.replace(/\\x1B(?:\\[@-Z\\\\-_]|\\[\\[0-?]*[ -/]*[@-~])/g, '');
        if (!cleanText) return;

        this.sendLog(\`[Minecraft]: \${cleanText}\`);

        const joinMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) joined the game/);
        if (joinMatch) {
          if (!this.onlinePlayers.includes(joinMatch[1])) {
            this.onlinePlayers.push(joinMatch[1]);
            this.updatePlayerStats(joinMatch[1], true);
            this.sendPlayerUpdate();
          }
        }
        const leaveMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) left the game/);
        if (leaveMatch) {
          this.onlinePlayers = this.onlinePlayers.filter(p => p !== leaveMatch[1]);
          this.updatePlayerStats(leaveMatch[1], false);
          this.sendPlayerUpdate();
        }
      });
    }
    this.process.stderr?.on('data', (data) => this.sendLog(\`[Minecraft Error]: \${data.toString().trim()}\`));
  }

  stop() {`;

code = code.replace(oldCode, restoredCode);
fs.writeFileSync('src/main/adapters/MinecraftAdapter.ts', code, 'utf-8');
console.log('Restored MinecraftAdapter.ts');
