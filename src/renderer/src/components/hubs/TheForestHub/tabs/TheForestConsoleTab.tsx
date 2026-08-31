import React, { useState } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

import { useServerStore } from '../../../../store/useServerStore';
import { useLogStore } from '../../../../store/useLogStore';
import { usePlayerStore } from '../../../../store/usePlayerStore';

export const TheForestConsoleTab: React.FC = React.memo(() => {
  const { activeServerId } = useServerStore();
  const { logs: allLogs, clearLogs } = useLogStore();
  const { onlinePlayers: allPlayers } = usePlayerStore();

  const logs = activeServerId ? allLogs.filter(l => l.id === activeServerId.toString() || l.id === 'global').map(l => l.msg) : [];
  const onlinePlayers = activeServerId ? (allPlayers[activeServerId] || []) : [];
  
  const endOfLogsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSendCommand = (cmd: string) => {
    if (activeServerId) {
      window.api.server.sendCommand(activeServerId, cmd);
    }
  };

  const handleClearLogs = () => {
    if (activeServerId) {
      clearLogs(activeServerId.toString());
      clearLogs('global');
    }
  };

  const onPlayerClick = (_playerName: string) => {
    // Optional context menu logic
  };
  const [consoleInput, setConsoleInput] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;
    handleSendCommand(consoleInput);
    setConsoleInput('');
  };

  return (
    <div className="absolute inset-0 flex gap-12 px-12 py-8 min-h-0 bg-transparent font-body">
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <h3 className="forest-title !text-3xl text-[var(--forest-yellow)] mb-4">CONSOLE LOGS</h3>
        <div className="flex-1 flex flex-col bg-[var(--forest-gray-dark)] border border-white/10 min-h-0 min-w-0">
          <OverlayScrollbarsComponent 
            className="flex-1 min-h-0" 
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
            defer
          >
            <div className="p-6 font-mono text-white/80 font-bold flex flex-col min-h-full text-sm">
              {logs.length === 0 && <div className="text-white/50 italic mt-4 mb-4">Waiting for The Forest server output... click Start to boot!</div>}
              {logs.map((log, i) => {
                const cleanLog = log.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                
                const isInfo = cleanLog.includes('INF') || cleanLog.includes('[TheForest]');
                const isWarn = cleanLog.includes('WRN') || cleanLog.includes('WARN');
                const isError = cleanLog.includes('ERR') || cleanLog.includes('Exception');
                const isCommand = cleanLog.startsWith('>');
                
                let colorClass = 'text-white/80';
                if (isError) colorClass = 'text-[var(--forest-red)]';
                else if (isWarn) colorClass = 'text-[var(--forest-yellow)]';
                else if (isCommand) colorClass = 'text-[var(--forest-green)] font-bold';
                else if (isInfo) colorClass = 'text-white/60';

                return (
                  <div key={i} className={`mb-1 leading-relaxed break-words whitespace-pre-wrap ${colorClass}`}>
                    {isCommand && <span className="text-[var(--forest-green)] font-bold mr-1">&gt;</span>}
                    <span>
                      {cleanLog.replace(/^> /, '').trim()}
                    </span>
                  </div>
                );
              })}
              <div ref={endOfLogsRef} />
            </div>
          </OverlayScrollbarsComponent>

          <form onSubmit={onSubmit} className="p-4 bg-[var(--forest-gray)] flex gap-3 items-center">
            <span className="text-[var(--forest-yellow)] font-bold text-xl leading-none flex items-center">&gt;</span>
            <input type="text" value={consoleInput} onChange={(e) => setConsoleInput(e.target.value)} placeholder="Type a command..." className="forest-input flex-1 !font-mono !border-none !text-left pl-2" />
            
            <button type="button" onClick={handleClearLogs} className="p-2.5 text-white/50 hover:text-[var(--forest-red)] transition-all flex items-center justify-center group" title="Clear Console">
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">delete_sweep</span>
            </button>
            
            <button type="submit" className="forest-btn text-[var(--forest-yellow)] hover:text-white">SEND</button>
          </form>
        </div>
      </div>

      <div className="w-80 flex flex-col min-h-0">
        <h3 className="forest-title !text-3xl text-[var(--forest-yellow)] mb-4">LIVE PLAYERS</h3>
        <div className="flex-1 flex flex-col bg-[var(--forest-gray-dark)] border border-white/10 min-h-0 min-w-0">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[var(--forest-gray)]">
            <h3 className="forest-title !text-xl text-white">PLAYERS</h3>
            <div className="font-bold text-sm text-[var(--forest-yellow)]">{onlinePlayers.length} ONLINE</div>
          </div>
          <OverlayScrollbarsComponent 
            className="flex-1 min-h-0" 
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
            defer
          >
            <div className="p-4 flex flex-col min-h-full">
              {onlinePlayers.length === 0 ? (
                <div className="text-center text-white/30 font-bold mt-10 uppercase">No one is online.</div>
              ) : (
                <div className="space-y-2">
                  {onlinePlayers.map((playerName, idx) => (
                    <div key={idx} onClick={() => onPlayerClick(playerName)} className="flex items-center gap-4 bg-[var(--forest-gray)] p-3 cursor-pointer hover:bg-white/10 transition-all group">
                      <div className="w-8 h-8 flex items-center justify-center text-white/50 group-hover:text-[var(--forest-yellow)] transition-colors">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </div>
                      <span className="forest-title !text-sm text-white">{playerName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </OverlayScrollbarsComponent>
        </div>
      </div>
    </div>
  );
});
