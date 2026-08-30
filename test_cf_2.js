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
    const json = JSON.parse(data);
    const palworld = json.data.find(g => g.name.toLowerCase().includes('palworld'));
    console.log("Found:", palworld);
  });
}).on('error', console.error);
