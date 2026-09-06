const { Rcon } = require('rcon-client');
const fs = require('fs');
const path = require('path');

const configPath = 'C:\\OmniHostWIPDAYZ\\OmniHost\\.omnihost-data\\servers\\48\\Pal\\Saved\\Config\\WindowsServer\\PalWorldSettings.ini';
const content = fs.readFileSync(configPath, 'utf8');

const pwdMatch = content.match(/AdminPassword="?([^",]+)"?/);
const password = pwdMatch ? pwdMatch[1] : '';

console.log('Found password in ini:', password);

async function test() {
  try {
    const rcon = await Rcon.connect({
      host: '127.0.0.1',
      port: 25575,
      password: password
    });
    console.log('Connected!');
    const res = await rcon.send('ShowPlayers');
    console.log('Players:', res);
    rcon.end();
  } catch (e) {
    console.error('RCON Error:', e.message);
  }
}
test();
