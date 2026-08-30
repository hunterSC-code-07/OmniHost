require('dotenv').config();
const https = require('https');

const options = {
  hostname: 'api.curseforge.com',
  path: '/v1/games?name=Palworld',
  method: 'GET',
  headers: {
    'x-api-key': process.env.CURSEFORGE_API_KEY,
    Accept: 'application/json'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(res.statusCode, data);
  });
}).on('error', console.error);
