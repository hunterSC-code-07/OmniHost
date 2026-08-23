const axios = require('axios');
axios.get('https://steamcommunity.com/workshop/browse/?appid=221100&searchtext=KTQuest').then(res => {
  const matches = res.data.match(/class="workshopItemTitle"[\s\S]*?<\/div>/g);
  console.log(matches ? matches.map(m => m.replace(/<[^>]+>/g, '').trim()) : 'No matches');
});