import React from 'react';

interface DayzPendingDownloadCardProps {
  pending: any;
  activeServerId: number | null;
  removePendingDownload: (serverId: number, modId: string) => void;
}

export const DayzPendingDownloadCard: React.FC<DayzPendingDownloadCardProps> = ({
  pending,
  activeServerId,
  removePendingDownload,
}) => {
  const mod = pending.mod || pending;

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-blue-500/50 flex flex-col group transition-all relative shadow-lg shadow-blue-500/10">
      <div className="absolute top-2 right-2 z-10 flex items-center bg-black/60 rounded-full px-2 py-1 gap-2 border border-blue-500/30 animate-pulse">
        <span className="text-[10px] font-bold text-blue-400">
          DOWNLOADING...
        </span>
      </div>

      {mod.preview_url || mod.thumbnail ? (
        <div
          className="h-32 bg-cover bg-center border-b border-white/5 opacity-70"
          style={{ backgroundImage: `url(${mod.preview_url || mod.thumbnail})` }}
        />
      ) : (
        <div className="h-32 bg-black/40 border-b border-white/5 flex items-center justify-center opacity-70">
          <span className="material-symbols-outlined text-[48px] text-gray-500 opacity-30">extension</span>
        </div>
      )}
      <div className="p-4 flex flex-col flex-1 relative z-10 bg-inherit">
        <h3 className="font-bold text-white text-sm truncate mb-3" title={mod.title}>{mod.title}</h3>
        {mod.id && String(mod.id) !== '0' && (
          <div className="text-[11px] text-gray-500 font-mono truncate bg-black/40 inline-block px-2 py-0.5 rounded border border-white/5 w-fit mb-3" title={`Mod ID: ${mod.id}`}>ID: {mod.id}</div>
        )}
        
        <div className="w-full mt-auto mb-2">
          <div className="flex justify-between items-center mb-1">
            <div className="text-[10px] text-blue-400 font-bold truncate">{pending.msg}</div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (removePendingDownload && activeServerId) removePendingDownload(activeServerId, mod.id || mod.publishedfileid); 
              }}
              className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
              title="Clear stuck download"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          <div className="h-1.5 w-full bg-blue-900/30 rounded-full overflow-hidden border border-blue-500/20">
            <div
              className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${pending.progress || 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
