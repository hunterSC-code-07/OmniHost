import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

interface DayzInstalledModsTabProps {
  activeServerId: number;
}

export const DayzInstalledModsTab: React.FC<DayzInstalledModsTabProps> = ({ activeServerId }) => {
  const [mods, setMods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstalledMods();
  }, [activeServerId]);

  const loadInstalledMods = async () => {
    setLoading(true);
    try {
      const basicMods = await window.api.getDayzInstalledMods(activeServerId);
      
      // Fetch rich details from Steam API for mods that have a Workshop ID
      const workshopIds = basicMods
        .filter((m: any) => m.id && /^\d+$/.test(m.id))
        .map((m: any) => m.id);

      let detailedMods: any[] = [];
      if (workshopIds.length > 0) {
        detailedMods = await window.api.getWorkshopItemDetails(workshopIds);
      }

      // Merge basic details with rich details
      const mergedMods = basicMods.map((basicMod: any) => {
        const detail = detailedMods.find((d: any) => d.publishedfileid === basicMod.id);
        if (detail) {
          return {
            ...basicMod,
            title: detail.title || basicMod.title,
            preview_url: detail.preview_url,
            file_size: detail.file_size,
            tags: detail.tags,
            description: detail.description
          };
        }
        return basicMod;
      });

      setMods(mergedMods);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openWorkshopPage = (id: string) => {
    if (/^\d+$/.test(id)) {
      window.open(`https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-container-low">
      <div className="p-4 border-b border-white/10 bg-surface-container flex items-center justify-between">
        <h2 className="text-lg font-bold text-on-surface">Installed Mods ({mods.length})</h2>
        <button 
          onClick={loadInstalledMods}
          className="p-2 rounded-lg bg-surface-container-highest hover:bg-surface-container-high transition-colors"
          title="Refresh"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">refresh</span>
        </button>
      </div>

      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : mods.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant text-center">
            <span className="material-symbols-outlined text-[48px] opacity-50 mb-4">folder_off</span>
            <p className="font-medium text-lg">No mods installed</p>
            <p className="text-sm opacity-70 mt-1">Install mods from the Workshop tab</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mods.map((mod, i) => (
              <div key={i} className="bg-surface-container rounded-xl overflow-hidden border border-white/5 flex flex-col group hover:border-white/20 transition-all">
                {mod.preview_url ? (
                  <div 
                    className="h-32 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${mod.preview_url})` }}
                  />
                ) : (
                  <div className="h-32 bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-30">extension</span>
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-on-surface text-sm truncate mb-1" title={mod.title}>{mod.title}</h3>
                  <div className="text-xs text-on-surface-variant font-mono truncate mb-3" title={mod.folderName}>{mod.folderName}</div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {mod.tags && mod.tags.slice(0, 3).map((tag: any, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface-variant rounded text-[10px] uppercase font-bold">
                        {tag.tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    {mod.file_size && (
                      <span className="text-[10px] text-on-surface-variant opacity-70">
                        {(parseInt(mod.file_size) / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openWorkshopPage(mod.id)}
                        className="text-[10px] font-bold text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        WORKSHOP
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </OverlayScrollbarsComponent>
    </div>
  );
};
