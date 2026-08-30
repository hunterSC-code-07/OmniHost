const https = require('https');
const url = 'https://edge.forgecdn.net/files/5139/726/vuxRevealMap.zip'; // Just a guess URL or we can fetch a valid one

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk.length);
  res.on('end', () => console.log('Downloaded bytes:', data.length > 0 ? data : 0));
});
