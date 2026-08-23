const fs = require('fs');
const mods = fs.readdirSync('C:/OmniHost(WIPdayZ)/OmniHost/.omnihost-data/servers/40').filter(f => f.startsWith('@'));
for (const folder of mods) {
  const modIdPath = 'C:/OmniHost(WIPdayZ)/OmniHost/.omnihost-data/servers/40/' + folder + '/modid.txt';
  if (fs.existsSync(modIdPath)) {
    const modId = fs.readFileSync(modIdPath, 'utf8').trim().split(':')[0];
    console.log(folder + ' -> ' + modId);
  } else {
    console.log(folder + ' -> NO MODID');
  }
}