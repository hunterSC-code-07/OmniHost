import React, { useState } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'

import { useServerStore } from '../../../../store/useServerStore'
import { useLogStore } from '../../../../store/useLogStore'
import { usePlayerStore } from '../../../../store/usePlayerStore'

export const DayzConsoleTab: React.FC = React.memo(() => {
  const { activeServerId } = useServerStore()
  const { logs: allLogs, clearLogs } = useLogStore()
  const { onlinePlayers: allPlayers } = usePlayerStore()

  const logs = activeServerId
    ? allLogs
        .filter((l) => l.id === activeServerId.toString() || l.id === 'global')
        .map((l) => l.msg)
    : []
  const onlinePlayers = activeServerId ? allPlayers[activeServerId] || [] : []

  const endOfLogsRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleSendCommand = (cmd: string) => {
    if (activeServerId) {
      window.api.server.sendCommand(activeServerId, cmd)
    }
  }

  const handleClearLogs = () => {
    if (activeServerId) {
      clearLogs(activeServerId.toString())
      clearLogs('global')
    }
  }

  const onPlayerClick = (_playerName: string) => {
    // Optional context menu logic
  }
  const [consoleInput, setConsoleInput] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!consoleInput.trim()) return
    handleSendCommand(consoleInput)
    setConsoleInput('')
  }

  return (
    <div className="absolute inset-0 flex gap-6 p-6 min-h-0 bg-transparent font-body">
      <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-h-0 min-w-0">
        <OverlayScrollbarsComponent
          className="flex-1 min-h-0"
          options={{
            scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 }
          }}
          defer
        >
          <div className="p-6 font-mono text-sm text-on-surface-variant shadow-inner flex flex-col min-h-full">
            {logs.length === 0 && (
              <div className="text-on-surface-variant/50 italic mt-4 mb-4">
                Waiting for DayZ server output... click Start to boot!
              </div>
            )}
            {logs.map((log, i) => {
              // Strip ANSI escape codes (e.g. \x1b[32m, \x1b[0m, \u001b[m, etc.)
              const cleanLog = log.replace(
                /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
                ''
              )

              const isInfo = cleanLog.includes('INFO')
              const isWarn = cleanLog.includes('WARN')
              const isError = cleanLog.includes('ERROR') || cleanLog.includes('Exception')
              const isJoin = cleanLog.includes('joined the game')
              const isLeave = cleanLog.includes('left the game')
              const isCommand = cleanLog.startsWith('>')

              let colorClass = 'text-on-surface-variant'
              if (isError) colorClass = 'text-red-400'
              else if (isWarn) colorClass = 'text-yellow-400'
              else if (isJoin) colorClass = 'text-green-400 font-bold'
              else if (isLeave) colorClass = 'text-gray-500'
              else if (isCommand) colorClass = 'text-brand font-bold'
              else if (isInfo) colorClass = 'text-on-surface-variant/90'

              return (
                <div
                  key={i}
                  className={`mb-1 leading-relaxed break-words whitespace-pre-wrap ${colorClass}`}
                >
                  {isInfo && !isCommand && (
                    <span className="text-blue-400 font-bold mr-1">INFO</span>
                  )}
                  {isWarn && !isCommand && (
                    <span className="text-yellow-400 font-bold mr-1">WARN</span>
                  )}
                  {isError && !isCommand && (
                    <span className="text-red-400 font-bold mr-1">ERROR</span>
                  )}
                  {isCommand && <span className="text-brand font-bold mr-1">&gt;</span>}
                  <span>
                    {cleanLog
                      .replace(/(INFO|WARN|ERROR|\[INFO\]|\[WARN\]|\[ERROR\])/g, '')
                      .replace(/^> /, '')
                      .trim()}
                  </span>
                </div>
              )
            })}
            <div ref={endOfLogsRef} />
          </div>
        </OverlayScrollbarsComponent>

        <form
          onSubmit={onSubmit}
          className="p-4 bg-transparent border-t border-surface-container-highest flex gap-3 items-center"
        >
          <span className="text-on-surface-variant font-bold text-xl leading-none flex items-center">
            &gt;
          </span>
          <input
            type="text"
            value={consoleInput}
            onChange={(e) => setConsoleInput(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-none outline-none text-brand font-mono placeholder-on-surface-variant/30"
          />

          <button
            type="button"
            onClick={handleClearLogs}
            className="p-2.5 text-on-surface-variant hover:text-red-400 bg-surface-container-highest/50 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30 flex items-center justify-center group"
            title="Clear Console"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
              delete_sweep
            </span>
          </button>

          <button
            type="submit"
            className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/50 hover:border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.1)] px-8 py-2.5 rounded-xl font-bold transition-all uppercase tracking-widest text-sm"
          >
            Send
          </button>
        </form>
      </div>

      <div className="w-72 bg-black/20 backdrop-blur-md border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col min-h-0 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-surface-container-highest flex justify-between items-center bg-surface-container-highest/20">
          <h3 className="font-headline-md text-headline-md text-on-surface">Live Players</h3>
          <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/30 text-[#4CAF50] px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(76,175,80,0.1)]">
            {onlinePlayers.length} Online
          </div>
        </div>
        <OverlayScrollbarsComponent
          className="flex-1 min-h-0"
          options={{
            scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 }
          }}
          defer
        >
          <div className="p-4 flex flex-col min-h-full">
            {onlinePlayers.length === 0 ? (
              <div className="text-center text-on-surface-variant/50 font-label-md text-label-md mt-10">
                No one is online right now.
              </div>
            ) : (
              <div className="space-y-3">
                {onlinePlayers.map((playerName, idx) => (
                  <div
                    key={idx}
                    onClick={() => onPlayerClick(playerName)}
                    className="flex items-center gap-4 bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container-highest shadow-sm cursor-pointer hover:border-brand/50 hover:bg-surface-container-lowest/80 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg shadow-sm bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[24px]">person</span>
                    </div>
                    <span className="font-label-lg text-label-lg text-on-surface group-hover:text-brand transition-colors">
                      {playerName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  )
})
