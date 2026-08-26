import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

import { useServerStore } from '../../store/useServerStore';
import { useMinecraftSoftware } from '../../hooks/useMinecraftSoftware';

interface SoftwareTabProps {
  // Add props if needed
}

export const SoftwareTab: React.FC<SoftwareTabProps> = React.memo(() => {
  const { activeServerId, setServers } = useServerStore();
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [downloadText, setDownloadText] = React.useState('');

  const {
    editingSoftwareType, setEditingSoftwareType, editingSoftwareVersion, setEditingSoftwareVersion,
    editingLoaderVersion, setEditingLoaderVersion, editingAvailableVersions,
    editingAvailableLoaderVersions, isTypeMenuOpen, setIsTypeMenuOpen,
    isVersionMenuOpen, setIsVersionMenuOpen, isLoaderMenuOpen, setIsLoaderMenuOpen,
    isChangingSoftware, setIsChangingSoftware
  } = useMinecraftSoftware(null, 'software');

  return (
    <div className="absolute inset-0 flex flex-col p-8 min-h-0 animate-in fade-in duration-300">
      <h3 className="text-2xl font-bold text-[#4CAF50] mb-6 shrink-0">Change Software</h3>
      <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/5 shadow-xl min-h-0">
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0"
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="p-8 pb-16">
            {isChangingSoftware ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h4 className="text-xl font-bold text-white mb-2">Changing Software</h4>
          <p className="text-gray-400">{downloadText}</p>
          {downloadProgress > 0 && (
            <div className="w-full max-w-md bg-gray-800 rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-[#4CAF50] h-2 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-xl">
          <div className="relative z-50">
            <label className="block text-sm font-bold text-gray-400 mb-2">Software Type</label>
            <button 
              onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
              className="w-full flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/5 rounded p-3 text-white shadow-inner font-bold"
            >
              {editingSoftwareType}
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </button>
            {isTypeMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                {['Vanilla', 'Paper', 'Fabric', 'Forge', 'NeoForge'].map(opt => (
                  <div key={opt} onClick={() => { 
                      setEditingSoftwareType(opt); 
                      setIsTypeMenuOpen(false); 
                  }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${editingSoftwareType === opt ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                    {opt} {editingSoftwareType === opt && <span className="float-right text-brand">✓</span>}
                  </div>
                ))}
                </OverlayScrollbarsComponent>
              </div>
            )}
          </div>

          <div className="relative z-40">
            <label className="block text-sm font-bold text-gray-400 mb-2">Minecraft Version</label>
            <button 
              onClick={() => setIsVersionMenuOpen(!isVersionMenuOpen)}
              className="w-full flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/5 rounded p-3 text-white shadow-inner font-bold"
            >
              {editingSoftwareVersion || 'Loading...'}
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </button>
            {isVersionMenuOpen && editingAvailableVersions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                {editingAvailableVersions.map(opt => (
                  <div key={opt} onClick={() => { setEditingSoftwareVersion(opt); setIsVersionMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${editingSoftwareVersion === opt ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                    {opt} {editingSoftwareVersion === opt && <span className="float-right text-brand">✓</span>}
                  </div>
                ))}
                </OverlayScrollbarsComponent>
              </div>
            )}
          </div>

          {['Forge', 'Fabric', 'NeoForge'].includes(editingSoftwareType) && (
            <div className="relative z-30">
              <label className="block text-sm font-bold text-gray-400 mb-2">Loader Version</label>
              <button 
                onClick={() => { if (!isChangingSoftware && editingAvailableLoaderVersions.length > 0) setIsLoaderMenuOpen(!isLoaderMenuOpen) }}
                className={`w-full flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/5 rounded p-3 text-white shadow-inner font-bold ${isChangingSoftware || editingAvailableLoaderVersions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {editingAvailableLoaderVersions.length === 0 ? 'Loading...' : (editingLoaderVersion || 'Select version')}
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </button>
              {isLoaderMenuOpen && editingAvailableLoaderVersions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                  <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                  {editingAvailableLoaderVersions.map(opt => (
                    <div key={opt} onClick={() => { setEditingLoaderVersion(opt); setIsLoaderMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${editingLoaderVersion === opt ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                      {opt} {editingLoaderVersion === opt && <span className="float-right text-brand">✓</span>}
                    </div>
                  ))}
                  </OverlayScrollbarsComponent>
                </div>
              )}
            </div>
          )}

          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-500 font-bold mb-1">Warning: Mod Compatibility</p>
            <p className="text-xs text-yellow-600">Changing software versions or types may cause compatibility issues with installed mods. Old mods will be moved to a backup folder.</p>
          </div>

          <button 
            onClick={async () => {
              if (!activeServerId) return;
              setIsChangingSoftware(true);
              setDownloadProgress(0);
              setDownloadText('Preparing...');
              
              try {
                // @ts-ignore
                window.api.onDownloadProgress(activeServerId, (progress: number, text?: string) => {
                   setDownloadProgress(progress);
                   if (text) setDownloadText(text);
                });

                // @ts-ignore
                await window.api.changeServerSoftware(activeServerId, editingSoftwareType, editingSoftwareVersion, editingLoaderVersion);
                
                // Re-download the jar
                // @ts-ignore
                await window.api.downloadServerJar(activeServerId, editingSoftwareType, editingSoftwareVersion, editingLoaderVersion);
                
                // Show success
                setDownloadText('Software updated successfully!');
                setDownloadProgress(100);
                
                // Let the UI catch up
                setTimeout(() => {
                  setIsChangingSoftware(false);
                  // Update the servers list globally
                  // @ts-ignore
                  window.api.getServers().then(setServers);
                }, 1500);

              } catch (err: any) {
                console.error(err);
                setDownloadText('Error: ' + err.message);
                setTimeout(() => setIsChangingSoftware(false), 3000);
              }
            }}
            disabled={!editingSoftwareVersion}
            className="mt-4 bg-gradient-to-br from-[#4CAF50] to-[#388E3C] text-black font-black py-3 px-6 rounded hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            Apply Changes
          </button>
        </div>
      )}
      </div>
      </OverlayScrollbarsComponent>
      </div>
    </div>
  );
});
