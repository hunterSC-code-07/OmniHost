import React from 'react';

interface OverviewTabProps {
  statsHistory: { cpu: number; ram: number }[];
  serverStatus: 'Online' | 'Offline';
  serverVersion: string;
  onlinePlayers: string[];
  maxPlayers?: number;
  logs: string[];
  maxRam?: number;
  maxCpu?: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = React.memo(({
  statsHistory,
  serverStatus,
  serverVersion,
  onlinePlayers,
  maxPlayers = 20,
  logs,
  maxRam = 2,
  maxCpu = 2
}) => {
  
  // Helpers to generate smooth SVG paths
  const generatePath = (data: number[], max: number) => {
    if (data.length === 0) return 'M0,50 L100,50';
    if (data.length === 1) return `M0,${50 - (data[0] / max) * 40} L100,${50 - (data[0] / max) * 40}`;
    
    // Scale X from 0 to 100, Y from 50 (bottom) to 10 (top, giving 10px padding)
    const points = data.map((val, i) => {
      const x = (i / (Math.max(29, data.length - 1))) * 100;
      const y = 50 - (Math.min(val, max) / max) * 40;
      return [x, y];
    });

    // Create a smooth cubic bezier curve through points
    let path = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0[0] + p1[0]) / 2;
      path += ` C${cx},${p0[1]} ${cx},${p1[1]} ${p1[0]},${p1[1]}`;
    }
    return path;
  };

  // Scale CPU by number of allocated cores so 200% on 2 cores = 100% full capacity
  const cpuData = statsHistory.map(s => s.cpu / maxCpu);
  // RAM is in bytes. We scale max to allocated maxRam
  const ramData = statsHistory.map(s => s.ram / 1024 / 1024 / 1024); // GB
  const currentCpu = cpuData.length > 0 ? cpuData[cpuData.length - 1] : 0;
  const currentRam = ramData.length > 0 ? ramData[ramData.length - 1] : 0;
  
  const cpuPath = generatePath(cpuData, 100); // Max 100%
  const ramPath = generatePath(ramData, maxRam); // Max allocated RAM

  const recentLogs = logs.slice(-10);

  return (
    <div className="absolute inset-0 flex min-h-0 bg-[#0f1411]">
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 min-h-0 min-w-0">
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Server Overview</h1>
          <p className="text-on-surface-variant font-body-lg">Real-time performance and status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Chart Card */}
          <div className="bg-[#151c17] border border-[#1f2922] rounded-2xl p-6 flex flex-col gap-4 shadow-lg relative overflow-hidden group">
            <div className="flex justify-between items-center z-10">
              <h3 className="font-headline-md text-white">CPU Usage</h3>
              <span className="font-headline-lg text-[#84cc16] font-bold">{currentCpu.toFixed(0)}%</span>
            </div>
            <div className="h-[120px] w-full relative z-10 flex flex-col justify-end">
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <path d={`${cpuPath} L100,50 L0,50 Z`} fill="url(#cpu-gradient)" opacity="0.4" />
                <path d={cpuPath} fill="none" stroke="#a3e635" strokeWidth="1.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="cpu-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a3e635" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-2 right-2 text-[10px] text-white/40 uppercase tracking-widest">60s History</div>
            </div>
          </div>

          {/* RAM Chart Card */}
          <div className="bg-[#151c17] border border-[#1f2922] rounded-2xl p-6 flex flex-col gap-4 shadow-lg relative overflow-hidden group">
            <div className="flex justify-between items-center z-10">
              <h3 className="font-headline-md text-white">RAM Usage</h3>
              <span className="font-headline-lg text-[#84cc16] font-bold">{currentRam.toFixed(1)} GB / {maxRam.toFixed(1)} GB</span>
            </div>
            <div className="h-[120px] w-full relative z-10 flex flex-col justify-end">
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <path d={`${ramPath} L100,50 L0,50 Z`} fill="url(#ram-gradient)" opacity="0.4" />
                <path d={ramPath} fill="none" stroke="#a3e635" strokeWidth="1.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="ram-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a3e635" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-2 right-2 text-[10px] text-white/40 uppercase tracking-widest">60s History</div>
            </div>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#151c17] border border-[#1f2922] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 shadow-lg">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${serverStatus === 'Online' ? 'bg-[#a3e635] shadow-[0_0_12px_#a3e635]' : 'bg-red-500 shadow-[0_0_12px_#ef4444]'}`}></span>
              <span className="font-headline-md text-white font-bold">{serverStatus}</span>
            </div>
          </div>

          <div className="bg-[#151c17] border border-[#1f2922] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 shadow-lg">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Server Version</p>
            <span className="font-headline-md text-white font-bold">{serverVersion}</span>
          </div>

          <div className="bg-[#151c17] border border-[#1f2922] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 shadow-lg">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Active Players</p>
            <div className="flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-[20px] text-[#a3e635]">group</span>
              <span className="font-headline-md font-bold">{onlinePlayers.length} / {maxPlayers}</span>
            </div>
          </div>
        </div>

        {/* Recent Logs Terminal */}
        <div className="bg-[#101512] border border-[#1f2922] rounded-2xl p-6 flex flex-col gap-4 shadow-lg flex-1 min-h-[250px]">
          <h3 className="font-headline-md text-white">Recent Logs</h3>
          <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-4 overflow-y-auto font-mono text-xs text-gray-300 flex flex-col">
             {recentLogs.length === 0 ? (
               <div className="text-white/30 italic">No logs available.</div>
             ) : (
               recentLogs.map((log, idx) => (
                 <div key={idx} className="mb-1 opacity-80 hover:opacity-100 transition-opacity whitespace-pre-wrap break-words">{log}</div>
               ))
             )}
          </div>
        </div>

      </div>
    </div>
  );
});
