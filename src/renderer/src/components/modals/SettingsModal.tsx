import { useState, useEffect } from 'react';
import { useToastStore } from '../../store/useToastStore';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'diagnostics'>('diagnostics');
  const [logs, setLogs] = useState<string>('Loading logs...');
  const [logPath, setLogPath] = useState<string>('');
  const { showToast } = useToastStore();

  const loadLogs = async () => {
    try {
      // @ts-ignore
      const fetchedLogs = await window.api.log.getLogs();
      setLogs(fetchedLogs || 'No logs found.');
      // @ts-ignore
      const path = await window.api.log.getLogPath();
      setLogPath(path);
    } catch (e) {
      setLogs('Failed to load logs.');
    }
  };

  useEffect(() => {
    if (activeTab === 'diagnostics') {
      loadLogs();
    }
  }, [activeTab]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logs);
    showToast('Logs copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface/95 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-xl border border-primary/30">
              <span className="material-symbols-outlined text-primary text-2xl">settings</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Global Settings</h2>
              <p className="text-sm text-on-surface-variant">Manage application preferences and diagnostics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-surface-bright/50 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <div className="w-64 border-r border-outline-variant/30 p-4 shrink-0 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('diagnostics')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors ${activeTab === 'diagnostics' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-surface-bright/50 hover:text-white border border-transparent'}`}
            >
              <span className="material-symbols-outlined text-[20px]">bug_report</span>
              Diagnostics
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-w-0 p-6 flex flex-col">
            {activeTab === 'diagnostics' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-white">Application Logs</h3>
                    <p className="text-xs text-on-surface-variant font-mono mt-1 select-all">{logPath}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={loadLogs} className="px-4 py-2 rounded-lg font-bold text-sm bg-surface-bright/50 hover:bg-surface-bright text-white transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">refresh</span> Refresh
                    </button>
                    <button onClick={copyToClipboard} className="px-4 py-2 rounded-lg font-bold text-sm bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">content_copy</span> Copy
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 min-h-0 bg-[#050505] rounded-xl border border-outline-variant/30 relative">
                  <OverlayScrollbarsComponent 
                    options={{ scrollbars: { theme: 'os-theme-light', autoHide: 'leave' } }}
                    className="h-full w-full custom-scrollbar"
                  >
                    <pre className="p-4 text-xs font-mono text-on-surface-variant whitespace-pre-wrap break-words">
                      {logs}
                    </pre>
                  </OverlayScrollbarsComponent>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
