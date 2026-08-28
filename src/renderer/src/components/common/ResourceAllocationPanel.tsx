import React from 'react';

interface ResourceAllocationPanelProps {
  ramLimit: number;
  setRamLimit: (val: number) => void;
  cpuLimit: number;
  setCpuLimit: (val: number) => void;
  sysInfo: { totalMem: number, cpus: number };
}

export const ResourceAllocationPanel: React.FC<ResourceAllocationPanelProps> = ({
  ramLimit,
  setRamLimit,
  cpuLimit,
  setCpuLimit,
  sysInfo
}) => {
  return (
    <div className="glass-panel bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col items-center w-full">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-1">{ramLimit} GB RAM</h3>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{cpuLimit} CPU Cores</p>
      </div>
      
      {/* RAM Slider */}
      <div className="w-full max-w-2xl relative mb-10 group">
        <input 
          type="range" 
          min="1" 
          max={sysInfo.totalMem} 
          step="1"
          value={ramLimit} 
          onChange={(e) => setRamLimit(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#ff4f4f] hover:bg-white/20 transition-colors"
        />
        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mt-3 px-1">
          <span>1 GB</span>
          <span>{sysInfo.totalMem} GB (Max)</span>
        </div>
      </div>

      {/* CPU Slider */}
      <div className="w-full max-w-2xl relative group">
        <div className="text-center mb-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">CPU Allocation</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max={sysInfo.cpus} 
          step="1"
          value={cpuLimit} 
          onChange={(e) => setCpuLimit(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#ff4f4f] hover:bg-white/20 transition-colors"
        />
        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mt-3 px-1">
          <span>1 Core</span>
          <span>{sysInfo.cpus} Cores (Max)</span>
        </div>
      </div>
    </div>
  );
};
