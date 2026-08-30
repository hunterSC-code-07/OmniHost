const { Rcon } = require('rcon-client');
async function test() {
  try {
    const rcon = await Rcon.connect({
      host: '127.0.0.1',
      port: 25575,
      password: 'g56s3knn'
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
