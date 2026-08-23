const fs = require('fs');

async function getModDependencies(modId, visited = new Set()) {
    if (visited.has(modId)) return [];
    visited.add(modId);
    try {
      const r = await fetch('https://steamcommunity.com/sharedfiles/filedetails/?id=' + modId);
      const html = await r.text();
      const parts = html.split('class="requiredItemsContainer"');
      if (parts.length > 1) {
        let block = parts[1];
        const endPart = block.indexOf('class="rightDetailsBlock"');
        if (endPart !== -1) {
            block = block.substring(0, endPart);
        }
        const idRegex = /filedetails\/\?id=(\d+)/g;
        const ids = [...new Set([...block.matchAll(idRegex)].map(m => m[1]))];
        console.log(`MOD ${modId} parsed ids:`, ids);
        let allDeps = [...ids];
        for (const id of ids) {
          const subDeps = await getModDependencies(id, visited);
          allDeps = allDeps.concat(subDeps);
        }
        return [...new Set(allDeps)];
      }
      return [];
    } catch (e) {
      console.error(e.message);
      return [];
    }
}

getModDependencies('1932611410').then(res => console.log('FINAL DEPS:', res));
