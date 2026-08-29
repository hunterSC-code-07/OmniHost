import React, { useEffect, useState } from 'react';
import { useServerStore } from '../../../../store/useServerStore';
import { ResourceAllocationPanel } from '../../../common/ResourceAllocationPanel';
import { useUiStore } from '../../../../store/useUiStore';

export const TerrariaOverviewTab: React.FC = () => {
  const { activeServerId, servers } = useServerStore();
  const currentServer = servers.find(s => s.id === activeServerId);

  const [sysInfo, setSysInfo] = useState({ totalMem: 8, cpus: 4 });

  const [ramLimit, setRamLimit] = useState(4);
  const [cpuLimit, setCpuLimit] = useState(2);

  useEffect(() => {
    if (currentServer?.meta) {
      if (currentServer.meta.ramLimit) setRamLimit(currentServer.meta.ramLimit);
      if (currentServer.meta.cpuLimit) setCpuLimit(currentServer.meta.cpuLimit);
    }
  }, [currentServer?.meta]);

  useEffect(() => {
    const fetchSys = async () => {
      try {
        const info = await window.api.system.getSystemInfo();
        setSysInfo({
          totalMem: Math.max(2, Math.floor(info.totalMem / (1024 * 1024 * 1024))),
          cpus: info.cpus || 4
        });
      } catch (e) {
        // ignore
      }
    };
    fetchSys();
  }, []);

  const handleRamChange = (val: number) => {
    setRamLimit(val);
    if (activeServerId) window.api.server.updateServerMeta(activeServerId, { ramLimit: val });
  };

  const handleCpuChange = (val: number) => {
    setCpuLimit(val);
    if (activeServerId) window.api.server.updateServerMeta(activeServerId, { cpuLimit: val });
  };

  if (!currentServer) return null;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-20">
      <div className="grid grid-cols-2 gap-6">
        <div className="glass-panel p-6 flex flex-col gap-2 rounded-xl border border-white/5 bg-black/40">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400">memory</span>
            CPU Usage
          </span>
          <span className="text-3xl font-bold text-white">{currentServer.stats?.cpu?.toFixed(1) || '0.0'}%</span>
        </div>
        
        <div className="glass-panel p-6 flex flex-col gap-2 rounded-xl border border-white/5 bg-black/40">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400">storage</span>
            RAM Usage
          </span>
          <span className="text-3xl font-bold text-white">{currentServer.stats?.ram ? (currentServer.stats.ram / 1024 / 1024).toFixed(1) : '0.0'} MB</span>
        </div>
      </div>



      <h3 className="text-xl font-bold text-white mt-4 border-b border-white/10 pb-2">Resource Limits</h3>
      <ResourceAllocationPanel 
        ramLimit={ramLimit} setRamLimit={handleRamChange}
        cpuLimit={cpuLimit} setCpuLimit={handleCpuChange}
        sysInfo={sysInfo}
      />
    </div>
  );
};
