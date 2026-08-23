const fs = require('fs');
const mods = fs.readdirSync('C:/OmniHost(WIPdayZ)/OmniHost/.omnihost-data/servers/40').filter(f => f.startsWith('@'));
const modDeps = JSON.parse(fs.readFileSync('C:/OmniHost(WIPdayZ)/OmniHost/.omnihost-data/servers/40/mod_dependencies.json', 'utf8'));

const folderToId = {};
const idToFolder = {};
for (const folder of mods) {
  const modIdPath = 'C:/OmniHost(WIPdayZ)/OmniHost/.omnihost-data/servers/40/' + folder + '/modid.txt';
  if (fs.existsSync(modIdPath)) {
    const modId = fs.readFileSync(modIdPath, 'utf8').trim().split(':')[0];
    if (modId) {
      folderToId[folder] = modId;
      idToFolder[modId] = folder;
    }
  }
}

const graph = {};
const inDegree = {};
mods.forEach(m => { graph[m] = []; inDegree[m] = 0; });

mods.forEach(folder => {
  const modId = folderToId[folder];
  if (modId && modDeps[modId]) {
    modDeps[modId].forEach(depId => {
      const depFolder = idToFolder[depId];
      if (depFolder && mods.includes(depFolder)) {
        graph[depFolder].push(folder);
        inDegree[folder]++;
      }
    });
  }
});

const queue = [];
const baseMods = ['@CF', '@CommunityOnlineTools', '@DabsFramework'];
const initialZero = mods.filter(m => inDegree[m] === 0);
initialZero.sort((a, b) => {
  const aIndex = baseMods.indexOf(a);
  const bIndex = baseMods.indexOf(b);
  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
});
queue.push(...initialZero);

const sortedMods = [];
while (queue.length > 0) {
  const current = queue.shift();
  sortedMods.push(current);
  
  for (const neighbor of graph[current]) {
    inDegree[neighbor]--;
    if (inDegree[neighbor] === 0) {
      queue.push(neighbor);
    }
  }
}

console.log("Sorted Length:", sortedMods.length, "Total:", mods.length);
if (sortedMods.length < mods.length) {
  console.log("CYCLE DETECTED!");
  const remaining = mods.filter(m => !sortedMods.includes(m));
  console.log("Remaining:", remaining);
}
console.log("Sorted:", sortedMods.join(', '));