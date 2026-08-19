import React, { useState, useEffect } from 'react';

interface PlayersTabProps {
  selectedPlayer: string | null;
  setSelectedPlayer: React.Dispatch<React.SetStateAction<string | null>>;
  playerListType: 'live' | 'history' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips';
  setPlayerListType: React.Dispatch<React.SetStateAction<'live' | 'history' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips'>>;
  newPlayerName: string;
  setNewPlayerName: React.Dispatch<React.SetStateAction<string>>;
  isProcessing: boolean;
  onlinePlayers: string[];
  playerData: any[];
  handleAddPlayer: (e: React.FormEvent) => Promise<void>;
  handleRemovePlayer: (targetName: string) => Promise<void>;
  playerInventory: any[] | null;
  sendPlayerCommand: (cmd: string, successMsg: string) => Promise<void>;
}

export const PlayersTab: React.FC<PlayersTabProps> = React.memo(({
  selectedPlayer,
  setSelectedPlayer,
  playerListType,
  setPlayerListType,
  newPlayerName,
  setNewPlayerName,
  isProcessing,
  onlinePlayers,
  playerData,
  handleAddPlayer,
  handleRemovePlayer,
  playerInventory,
  sendPlayerCommand
}) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleImageError = (e: any, itemId: string) => {
    const target = e.target as HTMLImageElement;
    if (target.src.includes('/items/')) {
      target.src = target.src.replace('/items/', '/blocks/');
    } else if (target.src.includes('/blocks/')) {
      const titleCasedId = itemId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
      target.src = `https://minecraft.wiki/wiki/Special:FilePath/${titleCasedId}.png`;
    } else if (target.src.includes('minecraft.wiki')) {
      target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjYzg3ZTI1Ii8+PC9zdmc+';
    }
  };

  const MinecraftSlot = ({ slotId }: { slotId: number }) => {
    const item = playerInventory?.find(i => i.slot === slotId);
    return (
      <div className="w-10 h-10 bg-[#8b8b8b] border-t-2 border-l-2 border-[#373737] border-b-2 border-r-2 border-[#ffffff] relative flex items-center justify-center group shadow-inner cursor-help hover:bg-[#a0a0a0] transition-colors">
        {item ? (
          <>
            <img src={`https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.2/items/${item.id}.png`} alt={item.id} className="w-8 h-8 object-contain drop-shadow-md z-10" onError={(e) => handleImageError(e, item.id)} />
            {item.count > 1 && <span className="absolute -bottom-1 -right-1 text-white font-black text-[11px] z-20 drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">{item.count}</span>}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-[#120412] text-white text-xs rounded border border-[#3b123b] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none capitalize flex items-center gap-2">
              <img src={`https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.2/items/${item.id}.png`} alt={item.id} className="w-4 h-4 object-contain" onError={(e) => handleImageError(e, item.id)} />
              <span>{item.id.replace(/_/g, ' ')}</span>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto">
      {!selectedPlayer ? (
        <>
          <div className="flex gap-2 mb-8 bg-gray-900/50 p-2 rounded-xl border border-gray-800">
            {['live', 'history', 'whitelist', 'ops', 'banned-players', 'banned-ips'].map(type => (
              <button key={type} onClick={() => setPlayerListType(type as any)} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all capitalize ${playerListType === type ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'text-gray-400 hover:bg-gray-800'}`}>
                {type.replace('-', ' ')}
              </button>
            ))}
          </div>

          {(playerListType !== 'live' && playerListType !== 'history') && (
            <form onSubmit={handleAddPlayer} className="mb-6 flex gap-3">
              <input type="text" placeholder="Enter Username/IP..." value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} className="flex-1 bg-darkCard border border-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:border-brand" disabled={isProcessing} />
              <button type="submit" disabled={isProcessing} className="px-8 bg-brand hover:bg-yellow-600 rounded-lg font-bold transition-all disabled:opacity-50">{isProcessing ? 'Adding...' : 'Add'}</button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto">
            {(playerListType === 'live' ? onlinePlayers : playerData).length === 0 ? (
              <div className="text-center text-gray-500 mt-12">No records found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(playerListType === 'live' ? onlinePlayers : playerData).map((player: any, idx) => {
                  const pName = typeof player === 'string' ? player : (player.username || player.name || player.ip);
                  const isIp = playerListType === 'banned-ips';
                  return (
                    <div key={idx} onClick={() => !isIp && setSelectedPlayer(pName)} className={`bg-darkCard border border-gray-800/50 p-4 rounded-xl flex items-center justify-between group transition-all shadow-md ${!isIp ? 'cursor-pointer hover:border-brand' : ''}`}>
                      <div className="flex items-center gap-4">
                        {isIp ? (
                          <div className="w-10 h-10 bg-red-900/30 rounded flex items-center justify-center text-red-500 font-bold border border-red-500/30">IP</div>
                        ) : (
                          <img src={`https://mc-heads.net/avatar/${pName}/32`} alt="face" className="w-10 h-10 rounded-md shadow-sm bg-gray-900" />
                        )}
                        <div>
                          <h4 className="font-bold text-gray-200">{pName}</h4>
                          <p className="text-xs text-green-500 font-mono">Click for details &rarr;</p>
                        </div>
                      </div>
                      {(playerListType !== 'live' && playerListType !== 'history') && (
                        <button onClick={(e) => { e.stopPropagation(); handleRemovePlayer(pName); }} className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">✕</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between bg-darkCard p-6 rounded-xl border border-gray-800 mb-6 shadow-md">
            <div className="flex items-center gap-5">
              <img src={`https://mc-heads.net/avatar/${selectedPlayer}/64`} alt="face" className="w-16 h-16 rounded-lg shadow-lg bg-gray-900" />
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  {selectedPlayer}
                  <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${onlinePlayers.includes(selectedPlayer) ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {onlinePlayers.includes(selectedPlayer) ? 'Online' : 'Offline'}
                  </span>
                </h2>
                <p className="text-sm text-gray-400 font-mono mt-1">Player Profile details</p>
              </div>
            </div>
            <button onClick={() => setSelectedPlayer(null)} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-all">&larr; Back</button>
          </div>

          {playerListType === 'history' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
              <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md flex flex-col items-center justify-center py-12">
                <h3 className="font-bold text-gray-400 mb-2 uppercase tracking-widest text-sm">Total Playtime</h3>
                <p className="text-4xl font-black text-brand">
                  {(() => {
                    const stats = playerData.find(p => p.username === selectedPlayer);
                    if (!stats) return '0h 0m 0s';
                    
                    let livePlaytime = stats.totalPlaytime || 0;
                    if (onlinePlayers.includes(selectedPlayer) && stats.currentSessionStart) {
                      livePlaytime += (now - stats.currentSessionStart);
                    }

                    const hrs = Math.floor(livePlaytime / (1000 * 60 * 60));
                    const mins = Math.floor((livePlaytime / (1000 * 60)) % 60);
                    const secs = Math.floor((livePlaytime / 1000) % 60);
                    return `${hrs}h ${mins}m ${secs}s`;
                  })()}
                </p>
              </div>
              <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md flex flex-col justify-center gap-4">
                <div>
                  <h3 className="font-bold text-gray-400 mb-1 uppercase tracking-widest text-xs">First Joined</h3>
                  <p className="text-lg font-bold text-white">
                    {(() => {
                      const stats = playerData.find(p => p.username === selectedPlayer);
                      return stats?.firstJoin ? new Date(stats.firstJoin).toLocaleString() : 'Unknown';
                    })()}
                  </p>
                </div>
                <div className="h-[1px] w-full bg-gray-800"></div>
                <div>
                  <h3 className="font-bold text-gray-400 mb-1 uppercase tracking-widest text-xs">Last Seen</h3>
                  <p className="text-lg font-bold text-white">
                    {(() => {
                      const stats = playerData.find(p => p.username === selectedPlayer);
                      if (onlinePlayers.includes(selectedPlayer)) return 'Currently Online';
                      return stats?.lastLeft ? new Date(stats.lastLeft).toLocaleString() : 'Unknown';
                    })()}
                  </p>
                </div>
                <div className="h-[1px] w-full bg-gray-800"></div>
                <div>
                  <h3 className="font-bold text-gray-400 mb-1 uppercase tracking-widest text-xs">Log off Position</h3>
                  <p className="text-lg font-bold text-white">
                    {(() => {
                      const stats = playerData.find(p => p.username === selectedPlayer);
                      if (onlinePlayers.includes(selectedPlayer)) return 'Currently Online';
                      if (stats?.logoffPosition) {
                        return `X: ${stats.logoffPosition.x}, Y: ${stats.logoffPosition.y}, Z: ${stats.logoffPosition.z}`;
                      }
                      return 'Unknown';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-20">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md">
                <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  Live Inventory {playerInventory === null && <span className="text-xs text-red-400 ml-2">(Offline / No Data)</span>}
                </h3>
                <div className="bg-[#c6c6c6] p-6 rounded-lg border-[4px] border-[#555555] inline-block shadow-2xl mx-auto w-full max-w-[480px]">
                  <div className="grid grid-cols-9 gap-1 mb-4 bg-[#c6c6c6]">
                    {Array.from({ length: 27 }).map((_, i) => <MinecraftSlot key={`main-${i}`} slotId={i + 9} />)}
                  </div>
                  <div className="grid grid-cols-9 gap-1 mt-6">
                    {Array.from({ length: 9 }).map((_, i) => <MinecraftSlot key={`hotbar-${i}`} slotId={i} />)}
                  </div>
                </div>
              </div>
              <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md">
                <h3 className="font-bold text-lg mb-4 text-white">Health and Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <button onClick={() => sendPlayerCommand('kill {player}', 'Killed {player}!')} className="bg-[#ff8800] hover:bg-orange-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-transform flex justify-center">☠️ Kill</button>
                  <button onClick={() => sendPlayerCommand('effect give {player} instant_health 1 10', 'Healed {player}!')} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-transform flex justify-center">❤️ Heal</button>
                  <button onClick={() => sendPlayerCommand('effect give {player} hunger 10 10', 'Starved {player}!')} className="bg-[#ff8800] hover:bg-orange-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-transform flex justify-center">🍖 Starve</button>
                  <button onClick={() => sendPlayerCommand('effect give {player} saturation 1 10', 'Fed {player}!')} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-transform flex justify-center">🍗 Feed</button>
                  <button onClick={() => sendPlayerCommand('clear {player}', 'Cleared {player}\'s inventory!')} className="col-span-2 lg:col-span-4 bg-red-600/80 hover:bg-red-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-transform border border-red-500/50">🗑️ Clear Inventory</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md">
                <h3 className="font-bold text-lg mb-4 text-white">Control Panel</h3>
                <div className="space-y-3">
                  <button onClick={() => sendPlayerCommand('whitelist add {player}', 'Added {player} to Whitelist!')} className="w-full bg-gray-800 hover:bg-gray-700 py-3 px-4 rounded-lg font-bold flex justify-between items-center transition-colors">
                    <span>Add to Whitelist</span> <span className="text-gray-400">→</span>
                  </button>
                  <button onClick={() => sendPlayerCommand('op {player}', 'Made {player} an OP!')} className="w-full bg-gray-800 hover:bg-gray-700 py-3 px-4 rounded-lg font-bold flex justify-between items-center transition-colors">
                    <span>Make Operator (OP)</span> <span className="text-gray-400">→</span>
                  </button>
                  <button onClick={() => sendPlayerCommand('deop {player}', 'Removed {player} as OP!')} className="w-full bg-gray-800 hover:bg-gray-700 py-3 px-4 rounded-lg font-bold flex justify-between items-center transition-colors">
                    <span className="text-yellow-500">Remove OP</span> <span className="text-gray-400">→</span>
                  </button>
                  <button onClick={() => sendPlayerCommand('ban {player}', 'Banned {player} from server!')} className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-900 py-3 px-4 rounded-lg font-bold flex justify-between items-center transition-colors text-red-400">
                    <span>Ban Player</span> <span className="text-red-500">→</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
          )}
        </div>
      )}
    </div>
  );
});
