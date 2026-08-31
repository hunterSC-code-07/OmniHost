import React, { useState } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

import { useServerStore } from '../../../../store/useServerStore';
import { useLogStore } from '../../../../store/useLogStore';
import { usePlayerStore } from '../../../../store/usePlayerStore';

export const SevenDaysToDieConsoleTab: React.FC = React.memo(() => {
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
    <div className="absolute inset-0 flex gap-4 p-8 min-h-0 sevendays-ui">
      <div className="flex-[3] flex flex-col min-h-0 min-w-0 sevendays-panel">
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0 bg-[var(--7dtd-bg-panel-dark)] border-b border-[var(--7dtd-border)]" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="p-6 font-mono text-sm text-white/80 flex flex-col min-h-full">
            {logs.length === 0 && <div className="text-white/30 italic mt-4 mb-4 uppercase">WAITING FOR SERVER OUTPUT...</div>}
            {logs.map((log, i) => {
              const cleanLog = log.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
              
              const isInfo = cleanLog.includes('INF');
              const isWarn = cleanLog.includes('WRN');
              const isError = cleanLog.includes('ERR') || cleanLog.includes('Exception');
              const isCommand = cleanLog.startsWith('>');
              
              let colorClass = 'text-white/80';
              if (isError) colorClass = 'text-red-400';
              else if (isWarn) colorClass = 'text-yellow-400';
              else if (isCommand) colorClass = 'text-white font-bold';
              else if (isInfo) colorClass = 'text-white/60';

              return (
                <div key={i} className={`mb-1 leading-relaxed break-words whitespace-pre-wrap ${colorClass}`}>
                  {isInfo && !isCommand && <span className="text-blue-400 font-bold mr-1">INF</span>}
                  {isWarn && !isCommand && <span className="text-yellow-400 font-bold mr-1">WRN</span>}
                  {isError && !isCommand && <span className="text-red-400 font-bold mr-1">ERR</span>}
                  {isCommand && <span className="text-white font-bold mr-1">&gt;</span>}
                  <span>
                    {cleanLog.replace(/(INF|WRN|ERR|\[INF\]|\[WRN\]|\[ERR\])/g, '').replace(/^> /, '').trim()}
                  </span>
                </div>
              );
            })}
            <div ref={endOfLogsRef} />
          </div>
        </OverlayScrollbarsComponent>

        <form onSubmit={onSubmit} className="p-4 flex gap-4 items-center bg-[var(--7dtd-bg-panel)]">
          <span className="text-white font-bold text-xl leading-none flex items-center">&gt;</span>
          <div className="sevendays-input-container flex-1">
            <input type="text" value={consoleInput} onChange={(e) => setConsoleInput(e.target.value)} placeholder="ENTER COMMAND..." className="sevendays-input w-full px-2 uppercase" />
          </div>
          
          <button type="button" onClick={handleClearLogs} className="sevendays-btn !px-4" title="Clear Console">
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
          </button>
          
          <button type="submit" className="sevendays-btn !px-8">SEND</button>
        </form>
      </div>

      <div className="flex-[1] sevendays-panel flex flex-col min-h-0">
        <div className="p-4 border-b border-[var(--7dtd-border)] flex justify-between items-center">
          <h3 className="sevendays-title text-xl">LIVE PLAYERS</h3>
          <div className="px-3 py-1 border border-white/20 bg-white/10 text-white text-xs font-bold">{onlinePlayers.length} ONLINE</div>
        </div>
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0 bg-[var(--7dtd-bg-panel-dark)]" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="p-4 flex flex-col min-h-full">
            {onlinePlayers.length === 0 ? (
              <div className="text-center text-white/50 sevendays-title text-sm mt-10">NO ONE IS ONLINE</div>
            ) : (
              <div className="space-y-2">
                {onlinePlayers.map((playerName, idx) => (
                  <div key={idx} onClick={() => onPlayerClick(playerName)} className="flex items-center gap-3 bg-[var(--7dtd-bg-panel)] p-3 border border-[var(--7dtd-border)] cursor-pointer hover:border-white/50 transition-colors">
                    <div className="w-8 h-8 bg-white/10 border border-white/20 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <span className="sevendays-title text-md text-white truncate">{playerName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
});
