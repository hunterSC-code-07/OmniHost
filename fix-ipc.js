const fs = require('fs');

let code = fs.readFileSync('src/main/index.ts', 'utf-8');

const badCode = `  ipcMain.handle('get-server-meta', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    
  ipcMain.handle('get-player-stats', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    const statsPath = join(serverDir, 'player-stats.json');
    if (fs.existsSync(statsPath)) {
      try {
        return JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  });
    const metaPath = join(serverDir, 'omnihost.json');`;

const goodCode = `  ipcMain.handle('get-player-stats', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    const statsPath = join(serverDir, 'player-stats.json');
    if (fs.existsSync(statsPath)) {
      try {
        return JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  ipcMain.handle('get-server-meta', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    const metaPath = join(serverDir, 'omnihost.json');`;

code = code.replace(badCode, goodCode);
fs.writeFileSync('src/main/index.ts', code, 'utf-8');
console.log('Fixed index.ts');
