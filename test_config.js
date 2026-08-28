const { PalworldConfigManager } = require('./src/main/palworld/PalworldConfigManager');

async function test() {
  const serverId = 48;
  const config = await PalworldConfigManager.getConfig(serverId);
  console.log('Old RCONEnabled:', config['RCONEnabled']);
  console.log('Old AdminPassword:', config['AdminPassword']);
  
  await PalworldConfigManager.setConfig(serverId, { RCONEnabled: 'True', AdminPassword: '"testpass"' });
  
  const newConfig = await PalworldConfigManager.getConfig(serverId);
  console.log('New RCONEnabled:', newConfig['RCONEnabled']);
  console.log('New AdminPassword:', newConfig['AdminPassword']);
}
test();
