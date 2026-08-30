const { Rcon } = require('rcon-client');
async function test() {
  console.log("Connecting...");
  try {
    const rcon = await Rcon.connect({
      host: '127.0.0.1',
      port: 25575,
      password: 'f93ygwa5',
      timeout: 5000
    });
    console.log('Connected! Sending ShowPlayers...');
    try {
      const res = await rcon.send('ShowPlayers');
      console.log('Players:', res);
    } catch (e) {
      console.log('Send Error:', e.message);
    }
    rcon.end();
  } catch (e) {
    console.error('Connect Error:', e.message);
  }
}
test();
