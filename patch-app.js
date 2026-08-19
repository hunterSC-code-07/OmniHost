const fs = require('fs');

let code = fs.readFileSync('src/renderer/src/App.tsx', 'utf-8');

// Update playerListType type
code = code.replace(
  `const [playerListType, setPlayerListType] = useState<'live' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips'>('live')`,
  `const [playerListType, setPlayerListType] = useState<'live' | 'history' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips'>('live')`
);

// Update loadPlayers
const oldLoadPlayers = `  const loadPlayers = async (id: number, type: string) => {
    // @ts-ignore
    const data = await window.api.readJson(id, type);
    setPlayerData(data);
  }`;
const newLoadPlayers = `  const loadPlayers = async (id: number, type: string) => {
    if (type === 'history') {
      // @ts-ignore
      const statsObj = await window.api.getPlayerStats(id);
      setPlayerData(Object.values(statsObj));
      return;
    }
    // @ts-ignore
    const data = await window.api.readJson(id, type);
    setPlayerData(data);
  }`;
code = code.replace(oldLoadPlayers, newLoadPlayers);

// Prevent adding a player manually to history tab
const oldHandleAddPlayer = `    if (!newPlayerName || activeServerId === null || playerListType === 'live') return;`;
const newHandleAddPlayer = `    if (!newPlayerName || activeServerId === null || playerListType === 'live' || playerListType === 'history') return;`;
code = code.replace(oldHandleAddPlayer, newHandleAddPlayer);

fs.writeFileSync('src/renderer/src/App.tsx', code, 'utf-8');
console.log('Patched App.tsx');
