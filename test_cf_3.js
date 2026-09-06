require('dotenv').config();
const https = require('https');

const options = {
  hostname: 'api.curseforge.com',
  path: '/v1/mods/search?gameId=85196&searchFilter=&index=0&pageSize=20&sortField=2&sortOrder=desc',
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
    console.log(res.statusCode);
    const json = JSON.parse(data);
    console.log(json.data.map(m => m.name));
  });
}).on('error', console.error);
