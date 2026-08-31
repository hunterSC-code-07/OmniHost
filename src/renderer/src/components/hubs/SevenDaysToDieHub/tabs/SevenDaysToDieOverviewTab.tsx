import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

import { useServerStore } from '../../../../store/useServerStore';
import { usePlayerStore } from '../../../../store/usePlayerStore';
import { useStatsStore } from '../../../../store/useStatsStore';

interface SevenDaysToDieOverviewTabProps {
  serverId: number;
}

export const SevenDaysToDieOverviewTab: React.FC<SevenDaysToDieOverviewTabProps> = React.memo(({ serverId }) => {
  const { servers } = useServerStore();
  const { onlinePlayers: allOnlinePlayers } = usePlayerStore();
  const { statsHistory: allStatsHistory } = useStatsStore();

  const [maxCpu, setMaxCpu] = React.useState(4);
  const [maxRam, setMaxRam] = React.useState(8);

  React.useEffect(() => {
    // @ts-ignore
    window.api.server.getServerMeta(serverId).then((meta: any) => {
      if (meta) {
        if (meta.cpu) setMaxCpu(meta.cpu);
        if (meta.ram) setMaxRam(meta.ram);
      }
    }).catch(console.error);
  }, [serverId]);

  const currentServer = servers.find(s => s.id === serverId);
  const serverStatus = currentServer?.status || 'Offline';
  
  const statsHistory = serverId ? (allStatsHistory[serverId] || []) : [];
  const onlinePlayers = serverId ? (allOnlinePlayers[serverId] || []) : [];
  
  // Helpers to generate jagged SVG paths for a more rugged, survival feel
  const generateJaggedPath = (data: number[], max: number, decimals: number) => {
    if (data.length === 0) return 'M0,50 L100,50';
    if (data.length === 1) return `M0,${50 - (data[0] / max) * 40} L100,${50 - (data[0] / max) * 40}`;
    
    // Scale X from 0 to 100, Y from 50 (bottom) to 10 (top, giving 10px padding)
    const points = data.map((val, i) => {
      const x = (i / (Math.max(49, data.length - 1))) * 100;
      const snappedVal = Number(val.toFixed(decimals)) === 0 ? 0 : val;
      const pct = Math.min(snappedVal, max) / max;
      const y = 50 - pct * 40;
      return [x, y];
    });

    let path = `M${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i][0]},${points[i][1]}`;
    }
    return path;
  };

  const cpuData = statsHistory.map(s => s.cpu / maxCpu);
  const ramData = statsHistory.map(s => s.ram / 1024 / 1024 / 1024); // GB
  const currentCpu = cpuData.length > 0 ? cpuData[cpuData.length - 1] : 0;
  const currentRam = ramData.length > 0 ? ramData[ramData.length - 1] : 0;
  
  const cpuPath = generateJaggedPath(cpuData, 100, 0); // Max 100%, 0 decimals
  const ramPath = generateJaggedPath(ramData, maxRam, 1); // Max `maxRam` GB, 1 decimal

  return (
    <div className="absolute inset-0 flex min-h-0 sevendays-ui">
      <OverlayScrollbarsComponent 
        className="flex-1 min-h-0 min-w-0 w-full" 
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
        defer
      >
        <div className="p-8 flex flex-col gap-6 w-full">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
            <div>
              <h1 className="sevendays-title text-3xl mb-1">SERVER OVERVIEW</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* CPU Vitals */}
            <div className="sevendays-panel flex flex-col h-[220px] relative overflow-hidden group p-6 border border-[var(--7dtd-border)] hover:border-white/50 transition-colors">
              <div className="flex justify-between items-center h-8 z-10 mb-4">
                <h3 className="sevendays-title text-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--7dtd-text-dim)]">memory</span>
                  CPU LOAD
                </h3>
                <span className="text-2xl font-bold">{currentCpu.toFixed(0)}%</span>
              </div>
              <div className="flex-1 relative overflow-hidden bg-[var(--7dtd-bg-panel-dark)] border border-[var(--7dtd-border)] mt-auto z-10">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-t border-white w-full h-[1px]"></div>
                  <div className="border-t border-white w-full h-[1px]"></div>
                  <div className="border-t border-white w-full h-[1px]"></div>
                  <div className="border-t border-white w-full h-[1px]"></div>
                </div>
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                  <path d={`${cpuPath} L100,50 L0,50 Z`} className="text-white/20" fill="currentColor" />
                  <path d={cpuPath} fill="none" className="text-white" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
                <div className="absolute bottom-1 right-2 text-xs text-white/50 font-bold uppercase tracking-widest">60S HISTORY</div>
              </div>
            </div>

            {/* RAM Vitals */}
            <div className="sevendays-panel flex flex-col h-[220px] relative overflow-hidden group p-6 border border-[var(--7dtd-border)] hover:border-white/50 transition-colors">
              <div className="flex justify-between items-center h-8 z-10 mb-4">
                <h3 className="sevendays-title text-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--7dtd-text-dim)]">dns</span>
                  MEMORY USAGE
                </h3>
                <span className="text-2xl font-bold">{currentRam.toFixed(1)} GB <span className="text-sm text-white/50 font-bold">/ {maxRam.toFixed(0)}GB</span></span>
              </div>
              <div className="flex-1 relative overflow-hidden bg-[var(--7dtd-bg-panel-dark)] border border-[var(--7dtd-border)] mt-auto z-10">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-t border-white w-full h-[1px]"></div>
                  <div className="border-t border-white w-full h-[1px]"></div>
                  <div className="border-t border-white w-full h-[1px]"></div>
                  <div className="border-t border-white w-full h-[1px]"></div>
                </div>
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                  <path d={`${ramPath} L100,50 L0,50 Z`} className="text-white/20" fill="currentColor" />
                  <path d={ramPath} fill="none" className="text-white" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
                <div className="absolute bottom-1 right-2 text-xs text-white/50 font-bold uppercase tracking-widest">60S HISTORY</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Panel */}
            <div className="sevendays-panel p-6 flex items-center gap-4 hover:bg-[var(--7dtd-bg-panel-light)] transition-colors border border-[var(--7dtd-border)]">
              <div className={`w-12 h-12 flex items-center justify-center border ${serverStatus === 'Online' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                <span className="material-symbols-outlined text-3xl">power_settings_new</span>
              </div>
              <div>
                <div className="sevendays-title text-sm text-[var(--7dtd-text-dim)] mb-1">STATUS</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-sm ${serverStatus === 'Online' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-xl font-bold uppercase">{serverStatus}</span>
                </div>
              </div>
            </div>

            {/* Version Panel */}
            <div className="sevendays-panel p-6 flex items-center gap-4 hover:bg-[var(--7dtd-bg-panel-light)] transition-colors border border-[var(--7dtd-border)]">
              <div className="w-12 h-12 bg-white/10 text-white/80 border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">update</span>
              </div>
              <div>
                <div className="sevendays-title text-sm text-[var(--7dtd-text-dim)] mb-1">SERVER VERSION</div>
                <div className="text-xl font-bold truncate">V1.0 (LATEST)</div>
              </div>
            </div>

            {/* Players Panel */}
            <div className="sevendays-panel p-6 flex items-center gap-4 hover:bg-[var(--7dtd-bg-panel-light)] transition-colors border border-[var(--7dtd-border)]">
              <div className="w-12 h-12 bg-white/10 text-white/80 border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">group</span>
              </div>
              <div>
                <div className="sevendays-title text-sm text-[var(--7dtd-text-dim)] mb-1">SURVIVORS</div>
                <div className="text-xl font-bold">
                  {onlinePlayers.length} <span className="text-[var(--7dtd-text-dim)] text-sm">/ {currentServer?.maxPlayers || 8}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
});
