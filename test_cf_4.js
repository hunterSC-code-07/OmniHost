require('dotenv').config();
const https = require('https');

const options = {
  hostname: 'api.curseforge.com',
  path: '/v1/mods/search?gameId=85196&searchFilter=&index=0&pageSize=1',
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
    const mod = json.data[0];
    console.log('Mod:', mod.id, mod.name);
    
    // Now get file details
    const fileId = mod.latestFilesIndexes[0].fileId;
    console.log('File ID:', fileId);
    
    const fileOptions = {
      ...options,
      path: `/v1/mods/${mod.id}/files/${fileId}`
    };
    
    https.get(fileOptions, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => {
        const json2 = JSON.parse(data2);
        console.log('File Res:', JSON.stringify(json2.data, null, 2));
      });
    });
  });
}).on('error', console.error);
