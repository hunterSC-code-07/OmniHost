import React, { useState } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

interface ConsoleTabProps {
  logs: string[];
  endOfLogsRef: React.RefObject<HTMLDivElement | null>;
  handleSendCommand: (command: string) => void;
  handleClearLogs: () => void;
  onlinePlayers: string[];
  onPlayerClick: (playerName: string) => void;
}

export const ConsoleTab: React.FC<ConsoleTabProps> = React.memo(({
  logs,
  endOfLogsRef,
  handleSendCommand,
  handleClearLogs,
  onlinePlayers,
  onPlayerClick
}) => {
  const [consoleInput, setConsoleInput] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;
    handleSendCommand(consoleInput);
    setConsoleInput('');
  };

  return (
    <div className="absolute inset-0 flex gap-6 p-6 min-h-0 bg-transparent font-body">
      <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-h-0 min-w-0">
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="p-6 font-mono text-sm text-on-surface-variant shadow-inner flex flex-col min-h-full">
            {logs.length === 0 && <div className="text-on-surface-variant/50 italic mt-4 mb-4">Waiting for server output... click Start to boot!</div>}
            {logs.map((log, i) => (
              <div key={i} className="mb-1 leading-relaxed break-words">
                {log.includes('INFO') ? <span className="text-yellow-400 font-bold">INFO </span> : ''}
                {log.includes('WARN') ? <span className="text-yellow-400 font-bold">WARN </span> : ''}
                {log.includes('ERROR') ? <span className="text-red-400 font-bold">ERROR </span> : ''}
                {log.startsWith('>') ? <span className="text-brand font-bold"> </span> : ''}
                <span className={log.includes('joined the game') ? 'text-green-400 font-bold' : log.includes('left the game') ? 'text-gray-500' : log.startsWith('>') ? 'text-brand font-bold' : ''}>
                  {log.replace(/(INFO|WARN|ERROR)/, '')}
                </span>
              </div>
            ))}
            <div ref={endOfLogsRef} />
          </div>
        </OverlayScrollbarsComponent>

        <form onSubmit={onSubmit} className="p-4 bg-transparent border-t border-surface-container-highest flex gap-3 items-center">
          <span className="text-on-surface-variant font-bold text-xl leading-none flex items-center">&gt;</span>
          <input type="text" value={consoleInput} onChange={(e) => setConsoleInput(e.target.value)} placeholder="Type a command..." className="flex-1 bg-transparent border-none outline-none text-brand font-mono placeholder-on-surface-variant/30" />
          
          <button type="button" onClick={handleClearLogs} className="p-2.5 text-on-surface-variant hover:text-red-400 bg-surface-container-highest/50 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30 flex items-center justify-center group" title="Clear Console">
            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">delete_sweep</span>
          </button>
          
          <button type="submit" className="bg-brand/10 hover:bg-brand/20 text-brand border border-brand/50 hover:border-brand shadow-[0_0_15px_rgba(255,215,0,0.1)] px-8 py-2.5 rounded-xl font-bold transition-all uppercase tracking-widest text-sm">Send</button>
        </form>
      </div>

      <div className="w-72 bg-black/20 backdrop-blur-md border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col min-h-0 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-surface-container-highest flex justify-between items-center bg-surface-container-highest/20">
          <h3 className="font-headline-md text-headline-md text-on-surface">Live Players</h3>
          <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/30 text-[#4CAF50] px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(76,175,80,0.1)]">{onlinePlayers.length} Online</div>
        </div>
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="p-4 flex flex-col min-h-full">
            {onlinePlayers.length === 0 ? (
              <div className="text-center text-on-surface-variant/50 font-label-md text-label-md mt-10">No one is online right now.</div>
            ) : (
              <div className="space-y-3">
                {onlinePlayers.map((playerName, idx) => (
                  <div key={idx} onClick={() => onPlayerClick(playerName)} className="flex items-center gap-4 bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container-highest shadow-sm cursor-pointer hover:border-brand/50 hover:bg-surface-container-lowest/80 transition-colors group">
                    <img src={`https://mc-heads.net/avatar/${playerName}/32`} alt={playerName} className="w-10 h-10 rounded-lg shadow-sm bg-background group-hover:scale-105 transition-transform" />
                    <span className="font-label-lg text-label-lg text-on-surface group-hover:text-brand transition-colors">{playerName}</span>
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
