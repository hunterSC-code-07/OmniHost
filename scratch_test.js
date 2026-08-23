const axios = require('axios');
async function test() {
  const modId = '3089074633';
  const url = 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + modId;
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Cookie': 'birthtime=283993201; lastagecheckage=1-January-1979'
    }
  });
  const html = response.data;
  
  const parts = html.split('class="requiredItemsContainer"');
  if (parts.length > 1) {
    let block = parts[1];
    const endPart = block.indexOf('</div>'); 
    if (endPart !== -1) {
        block = block.substring(0, 5000); 
    }
    
    const idRegex = /filedetails\/\?id=(\d+)/g;
    const ids = [...new Set([...block.matchAll(idRegex)].map(m => m[1]))];
    console.log("Found:", ids);
  } else {
    console.log("No requiredItemsContainer found.");
  }
}
test();