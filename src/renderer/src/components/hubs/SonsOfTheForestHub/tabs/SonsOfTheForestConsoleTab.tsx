import React, { useState } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

import { useServerStore } from '../../../../store/useServerStore';
import { useLogStore } from '../../../../store/useLogStore';

export const SonsOfTheForestConsoleTab: React.FC = React.memo(() => {
  const { activeServerId } = useServerStore();
  const { logs: allLogs, clearLogs } = useLogStore();

  const logs = activeServerId ? allLogs.filter(l => l.id === activeServerId.toString() || l.id === 'global').map(l => l.msg) : [];
  
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

  const [consoleInput, setConsoleInput] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;
    handleSendCommand(consoleInput);
    setConsoleInput('');
  };

  return (
    <div className="absolute inset-0 flex flex-col p-4 min-h-0 bg-transparent gap-4">
      <div className="sotf-section-header shrink-0">SERVER CONSOLE</div>
      <div className="flex-1 flex flex-col bg-[var(--sotf-panel)] border border-[var(--sotf-border)] overflow-hidden min-h-0">
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0 sotf-scrollbars" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="p-4 font-mono text-sm text-[var(--sotf-text-dim)] flex flex-col min-h-full">
            {logs.length === 0 && <div className="italic mt-4 mb-4 text-center">WAITING FOR SERVER OUTPUT...</div>}
            {logs.map((log, i) => {
              const cleanLog = log.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
              
              const isInfo = cleanLog.includes('INF') || cleanLog.includes('[SonsOfTheForest]');
              const isWarn = cleanLog.includes('WRN') || cleanLog.includes('WARN');
              const isError = cleanLog.includes('ERR') || cleanLog.includes('Exception');
              const isCommand = cleanLog.startsWith('>');
              
              let colorClass = 'text-[var(--sotf-text)]';
              if (isError) colorClass = 'text-red-500';
              else if (isWarn) colorClass = 'text-[var(--sotf-highlight)]';
              else if (isCommand) colorClass = 'text-white font-bold';
              else if (isInfo) colorClass = 'text-[var(--sotf-text-dim)]';

              return (
                <div key={i} className={`mb-1 leading-relaxed break-words whitespace-pre-wrap ${colorClass}`}>
                  {isCommand && <span className="text-white font-bold mr-2">&gt;</span>}
                  <span>
                    {cleanLog.replace(/^> /, '').trim()}
                  </span>
                </div>
              );
            })}
            <div ref={endOfLogsRef} />
          </div>
        </OverlayScrollbarsComponent>

        <form onSubmit={onSubmit} className="p-4 bg-transparent border-t border-[var(--sotf-border)] flex gap-3 items-center">
          <span className="text-[var(--sotf-text-dim)] font-bold text-xl leading-none flex items-center">&gt;</span>
          <input 
            type="text" 
            value={consoleInput} 
            onChange={(e) => setConsoleInput(e.target.value)} 
            placeholder="ENTER COMMAND..." 
            className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-[var(--sotf-text-dim)] uppercase" 
          />
          <button type="button" onClick={handleClearLogs} className="sotf-btn text-sm hover:text-red-500" title="Clear Console">
            CLEAR
          </button>
          <button type="submit" className="sotf-btn text-sm text-[var(--sotf-highlight)]">SEND</button>
        </form>
      </div>
    </div>
  );
});
