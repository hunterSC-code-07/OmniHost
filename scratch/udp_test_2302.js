const dgram = require('dgram');
const server = dgram.createSocket('udp4');
server.on('message', (msg, rinfo) => {
    console.log(Received packet from : - );
});
server.bind(2302, () => {
    console.log('Listening on UDP 2302 (DayZ Game Port) for incoming packets...');
});
