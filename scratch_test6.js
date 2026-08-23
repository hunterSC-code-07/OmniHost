const fs = require('fs');
const modDeps = JSON.parse(fs.readFileSync('C:/OmniHost(WIPdayZ)/OmniHost/.omnihost-data/servers/40/mod_dependencies.json', 'utf8'));
const mods = fs.readdirSync('C:/OmniHost(WIPdayZ)/OmniHost/.omnihost-data/servers/40').filter(f => f.startsWith('@'));

const installedIds = new Set();
for (const folder of mods) {
  const modIdPath = 'C:/OmniHost(WIPdayZ)/OmniHost/.omnihost-data/servers/40/' + folder + '/modid.txt';
  if (fs.existsSync(modIdPath)) {
    const modId = fs.readFileSync(modIdPath, 'utf8').trim().split(':')[0];
    if (modId) installedIds.add(modId);
  }
}

const pripyatDeps = modDeps['3089074633'] || [];
const missing = pripyatDeps.filter(id => !installedIds.has(id));
console.log("Missing Dependencies for Pripyat:", missing);