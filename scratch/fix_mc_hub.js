const fs = require('fs');
let code = fs.readFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', 'utf8');

// 1. Remove ALL useEffects that check for 'software' tab loader versions.
code = code.replace(/useEffect\(\(\) => \{\s*if \(activeTab === 'software'.*?fetchLoaderVersions[\s\S]*?\}, \[activeTab, editingSoftwareType, editingSoftwareVersion, serverMeta\]\);?/g, '');

// 2. We inject ONE correct fetchLoaderVersions useEffect + the IPC listeners
const correctUseEffect = `
  useEffect(() => {
    if (activeTab === 'software' && ['Forge', 'Fabric', 'NeoForge'].includes(editingSoftwareType) && editingSoftwareVersion) {
      const fetchLoaderVersions = async () => {
        // @ts-ignore
        const loaders = await window.api.getLoaderVersions(editingSoftwareType, editingSoftwareVersion);
        setEditingAvailableLoaderVersions(loaders);
        if (serverMeta && serverMeta.loaderVersion && loaders.includes(serverMeta.loaderVersion)) {
           setEditingLoaderVersion(serverMeta.loaderVersion);
        } else {
           setEditingLoaderVersion(loaders.length > 0 ? loaders[0] : '');
        }
      }
      fetchLoaderVersions();
    } else {
      setEditingAvailableLoaderVersions([]);
      setEditingLoaderVersion('');
    }
  }, [activeTab, editingSoftwareType, editingSoftwareVersion, serverMeta]);

  // Restore IPC Event Listeners for logs, players, and stats
  useEffect(() => {
    window.api.onConsoleLog((data) => {
      if (data.id !== activeServerId && data.id !== activeServerId.toString()) return;
      const msgs = data.msg.split('\\n').filter(l => l.trim() !== '');
      setLogs(prev => {
        const newLogs = [...prev, ...msgs.map(m => ({ 
          id: crypto.randomUUID(), 
          msg: m 
        }))];
        if (newLogs.length > 200) return newLogs.slice(newLogs.length - 200);
        return newLogs;
      });
    });

    window.api.onOnlinePlayers((data) => {
      if (data.id !== activeServerId) return;
      setOnlinePlayers(data.players);
    });

    window.api.onServerStats((data) => {
      if (data.id !== activeServerId) return;
      setCpuUsage(data.cpu);
      setRamUsage(data.ram);
    });

    window.api.onServerTps((data) => {
      if (data.id !== activeServerId) return;
      setServerTps(data.tps);
    });
  }, [activeServerId]);
`;

code = code.replace(/useEffect\(\(\) => \{\s*if \(activeTab === 'console'\) \{\s*endOfLogsRef.current\?.scrollIntoView\(\{ behavior: "smooth" \}\)\s*\}\s*\}, \[logs, activeTab\]\)/, "useEffect(() => { if (activeTab === 'console') { endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' }) } }, [logs, activeTab])\n" + correctUseEffect);

fs.writeFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', code);
console.log('Fixed MinecraftHub.tsx!');
