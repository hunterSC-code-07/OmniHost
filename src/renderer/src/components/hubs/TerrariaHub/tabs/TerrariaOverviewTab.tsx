import React, { useEffect, useState } from 'react';
import { useServerStore } from '../../../../store/useServerStore';
import { useStatsStore } from '../../../../store/useStatsStore';
import { usePlayerStore } from '../../../../store/usePlayerStore';

export const TerrariaOverviewTab: React.FC = () => {
  const { activeServerId, servers } = useServerStore();
  const { statsHistory } = useStatsStore();
  const { onlinePlayers: allOnlinePlayers } = usePlayerStore();
  const currentServer = servers.find(s => s.id === activeServerId);

  const serverStatus = currentServer?.status || 'Offline';
  
  const serverStats = activeServerId ? (statsHistory[activeServerId] || []) : [];
  const currentStat = serverStats.length > 0 ? serverStats[serverStats.length - 1] : { cpu: 0, ram: 0 };
  
  const onlinePlayers = activeServerId ? (allOnlinePlayers[activeServerId.toString()] || []) : [];

  const [maxCpu, setMaxCpu] = useState(4);
  const [maxRam, setMaxRam] = useState(8);

  useEffect(() => {
    if (activeServerId) {
      // @ts-ignore
      window.api.server.getServerMeta(activeServerId).then((meta: any) => {
        if (meta) {
          if (meta.ram) setMaxRam(meta.ram);
          if (meta.cpu) setMaxCpu(meta.cpu);
        }
      }).catch(console.error);
    }
  }, [activeServerId]);

  const generateSmoothPath = (data: number[], max: number, decimals: number) => {
    if (data.length === 0) return 'M0,50 L100,50';
    if (data.length === 1) return `M0,${50 - (data[0] / max) * 40} L100,${50 - (data[0] / max) * 40}`;
    
    const points = data.map((val, i) => {
      const x = (i / (Math.max(49, data.length - 1))) * 100;
      const snappedVal = Number(val.toFixed(decimals)) === 0 ? 0 : val;
      const pct = Math.min(snappedVal, max) / max;
      const y = 50 - pct * 40;
      return [x, y];
    });

    let path = `M${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;
      path += ` Q${points[i][0]},${points[i][1]} ${xc},${yc}`;
    }
    path += ` T${points[points.length - 1][0]},${points[points.length - 1][1]}`;
    return path;
  };

  const cpuData = serverStats.map(s => s.cpu / maxCpu);
  const ramData = serverStats.map(s => s.ram / 1024 / 1024 / 1024); // GB

  const cpuPath = generateSmoothPath(cpuData, 100, 0); // Max 100%, 0 decimals
  const ramPath = generateSmoothPath(ramData, maxRam, 1); // Max `maxRam` GB, 1 decimal



  if (!currentServer) return null;

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="terraria-title mb-1">Server Overview</h1>
          <p className="text-gray-400 font-medium">Real-time vitals and statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="terraria-panel p-6 flex flex-col h-[220px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center h-8 z-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400">memory</span>
              CPU Load
            </h3>
            <span className="text-2xl text-green-400 font-black drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">{currentStat.cpu.toFixed(1)}%</span>
          </div>
          <div className="h-32 w-full relative overflow-hidden rounded-lg bg-black/60 border border-white/5 mt-auto z-10">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-white w-full h-[1px]"></div>
              <div className="border-t border-white w-full h-[1px]"></div>
              <div className="border-t border-white w-full h-[1px]"></div>
              <div className="border-t border-white w-full h-[1px]"></div>
            </div>
            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
              <path d={`${cpuPath} L100,50 L0,50 Z`} className="text-green-500/20" fill="currentColor" />
              <path d={cpuPath} fill="none" className="text-green-400" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute bottom-1 right-2 text-xs text-gray-500 font-bold uppercase tracking-widest">60s History</div>
          </div>
        </div>
        
        <div className="terraria-panel p-6 flex flex-col h-[220px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center h-8 z-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">storage</span>
              Memory Usage
            </h3>
            <span className="text-2xl text-blue-400 font-black drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">{(currentStat.ram / 1024 / 1024).toFixed(1)} MB <span className="text-sm text-gray-500 font-bold">/ {maxRam.toFixed(0)}GB</span></span>
          </div>
          <div className="h-32 w-full relative overflow-hidden rounded-lg bg-black/60 border border-white/5 mt-auto z-10">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-white w-full h-[1px]"></div>
              <div className="border-t border-white w-full h-[1px]"></div>
              <div className="border-t border-white w-full h-[1px]"></div>
              <div className="border-t border-white w-full h-[1px]"></div>
            </div>
            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
              <path d={`${ramPath} L100,50 L0,50 Z`} className="text-blue-500/20" fill="currentColor" />
              <path d={ramPath} fill="none" className="text-blue-400" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute bottom-1 right-2 text-xs text-gray-500 font-bold uppercase tracking-widest">60s History</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="terraria-panel p-6 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${serverStatus === 'Online' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            <span className="material-symbols-outlined text-3xl">power_settings_new</span>
          </div>
          <div>
            <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${serverStatus === 'Online' ? 'bg-green-400 shadow-[0_0_10px_#4ade80] animate-pulse' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
              <span className="text-xl font-bold text-white">{serverStatus}</span>
            </div>
          </div>
        </div>

        <div className="terraria-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">update</span>
          </div>
          <div>
            <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Server Version</div>
            <div className="text-xl font-bold text-white truncate">V1.4.4.9 (Latest)</div>
          </div>
        </div>

        <div className="terraria-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">group</span>
          </div>
          <div>
            <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Live Players</div>
            <div className="text-xl font-bold text-white">
              {onlinePlayers.length} <span className="text-gray-500 text-sm">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
