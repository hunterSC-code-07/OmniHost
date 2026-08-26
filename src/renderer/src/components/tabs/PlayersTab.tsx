import React, { useState, useEffect, useMemo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

import { useServerStore } from '../../store/useServerStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useMinecraftPlayers } from '../../hooks/useMinecraftPlayers';

interface PlayersTabProps {
  // empty for now
}

const EquippedSkinCard = ({ playerName }: { playerName: string }) => (
  <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md flex flex-col items-center">
    <div className="w-full flex items-center justify-between mb-4">
      <h3 className="font-bold text-lg text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Equipped Skin
      </h3>
      <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Player Model</span>
    </div>
    <div className="relative group p-6 flex flex-col items-center justify-center bg-gradient-to-b from-black/60 to-black/30 rounded-xl border border-white/5 shadow-inner w-full overflow-hidden">
      <div className="absolute inset-0 bg-radial-gradient from-brand/10 to-transparent pointer-events-none opacity-50"></div>
      <img 
        src={`https://crafthead.net/armor/body/${playerName}`}
        alt={`${playerName}'s equipped skin`}
        className="h-64 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)] transition-all duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://minotar.net/armor/body/${playerName}/300.png`;
        }}
      />
      <span className="text-xs text-gray-300 font-mono mt-3 font-semibold tracking-wide">
        {playerName}
      </span>
    </div>
  </div>
);

const itemImageCache = new Map<string, string>();

const getItemImageUrl = (itemId: string): string => {
  if (itemImageCache.has(itemId)) {
    return itemImageCache.get(itemId)!;
  }
  if (itemId.endsWith('_spawn_egg') || itemId.includes('spawn_egg')) {
    const titleCased = itemId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
    const url = `https://minecraft.wiki/wiki/Special:FilePath/${titleCased}.png`;
    itemImageCache.set(itemId, url);
    return url;
  }
  return `https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.2/items/${itemId}.png`;
};

interface MinecraftSlotProps {
  item?: { slot: number; id: string; count: number };
}

const MinecraftSlot: React.FC<MinecraftSlotProps> = React.memo(({ item }) => {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (!item) return '';
    return getItemImageUrl(item.id);
  });

  useEffect(() => {
    if (item) {
      setImgSrc(getItemImageUrl(item.id));
    }
  }, [item?.id]);

  const handleImageError = () => {
    if (!item) return;
    const titleCasedId = item.id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
    const wikiUrl = `https://minecraft.wiki/wiki/Special:FilePath/${titleCasedId}.png`;
    if (imgSrc !== wikiUrl) {
      itemImageCache.set(item.id, wikiUrl);
      setImgSrc(wikiUrl);
    } else {
      setImgSrc('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjYzg3ZTI1Ii8+PC9zdmc+');
    }
  };

  return (
    <div className="w-10 h-10 bg-[#8b8b8b] border-t-2 border-l-2 border-[#373737] border-b-2 border-r-2 border-[#ffffff] relative flex items-center justify-center group shadow-inner cursor-help hover:bg-[#a0a0a0] transition-colors select-none">
      {item ? (
        <>
          <img 
            src={imgSrc} 
            alt={item.id} 
            className="w-8 h-8 object-contain drop-shadow-md z-10 pointer-events-none" 
            onError={handleImageError} 
          />
          {item.count > 1 && (
            <span className="absolute -bottom-1 -right-1 text-white font-black text-[11px] z-20 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] bg-black/60 px-1 rounded leading-none pointer-events-none font-mono">
              {item.count}
            </span>
          )}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2.5 py-1 bg-[#120412] text-white text-xs rounded border border-[#3b123b] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none capitalize flex items-center gap-2">
            <img src={imgSrc} alt={item.id} className="w-4 h-4 object-contain" />
            <span className="font-semibold text-gray-200">
              {item.count > 1 ? `${item.count}x ` : ''}{item.id.replace(/_/g, ' ')}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
});

export const PlayersTab: React.FC<PlayersTabProps> = React.memo(() => {
  const { activeServerId } = useServerStore();
  const { onlinePlayers, playerListType, setPlayerListType } = usePlayerStore();
  const activePlayers = activeServerId ? (onlinePlayers[activeServerId.toString()] || []) : [];

  const {
    playerData,
    newPlayerName, setNewPlayerName,
    isProcessing,
    selectedPlayer, setSelectedPlayer,
    playerInventory,
    handleAddPlayer, handleRemovePlayer, sendPlayerCommand
  } = useMinecraftPlayers(activeServerId, 'players');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const inventoryMap = useMemo(() => {
    const map = new Map<number, { slot: number; id: string; count: number }>();
    if (playerInventory && Array.isArray(playerInventory)) {
      for (const item of playerInventory) {
        if (item && typeof item.slot === 'number') {
          map.set(item.slot, item);
        }
      }
    }
    return map;
  }, [playerInventory]);

  return (
    <div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden outline-none">
      {!selectedPlayer ? (
        <>
          <div className="flex gap-2 mb-8 bg-surface/60 backdrop-blur-md p-2 rounded-xl border border-outline-variant/30 shrink-0 mx-8 mt-8 shadow-sm">
            {['live', 'history', 'whitelist', 'ops', 'banned-players', 'banned-ips'].map(type => (
              <button key={type} onClick={() => setPlayerListType(type as any)} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all capitalize ${playerListType === type ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'text-gray-400 hover:bg-gray-800'}`}>
                {type.replace('-', ' ')}
              </button>
            ))}
          </div>

          {(playerListType !== 'live' && playerListType !== 'history') && (
            <form onSubmit={handleAddPlayer} className="mb-6 flex gap-3 shrink-0 mx-8">
              <input type="text" placeholder="Enter Username/IP..." value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} className="flex-1 bg-darkCard border border-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:border-brand" disabled={isProcessing} />
              <button type="submit" disabled={isProcessing} className="px-8 bg-brand hover:bg-yellow-600 rounded-lg font-bold transition-all disabled:opacity-50">{isProcessing ? 'Adding...' : 'Add'}</button>
            </form>
          )}

          <OverlayScrollbarsComponent 
            className="flex-1 min-h-0 w-full block"
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
            defer
          >
            <div className="w-full block px-8 pb-8">
            {(playerListType === 'live' ? activePlayers : playerData).length === 0 ? (
              <div className="text-center text-gray-500 mt-12">No records found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(playerListType === 'live' ? activePlayers : playerData).map((player: any, idx) => {
                  const pName = typeof player === 'string' ? player : (player.username || player.name || player.ip);
                  const isIp = playerListType === 'banned-ips';
                  return (
                    <div key={idx} onClick={() => !isIp && setSelectedPlayer(pName)} className={`bg-darkCard border border-gray-800/50 p-4 rounded-xl flex items-center justify-between group transition-all shadow-md ${!isIp ? 'cursor-pointer hover:border-brand' : ''}`}>
                      <div className="flex items-center gap-4">
                        {isIp ? (
                          <div className="w-10 h-10 bg-red-900/30 rounded flex items-center justify-center text-red-500 font-bold border border-red-500/30">IP</div>
                        ) : (
                          <img 
                            src={`https://crafthead.net/avatar/${pName}`} 
                            alt={pName} 
                            className="w-10 h-10 rounded-md shadow-sm bg-gray-900 border border-white/5" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://minotar.net/helm/${pName}/32.png`;
                            }}
                          />
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
          </OverlayScrollbarsComponent>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1 flex flex-col min-h-0">
          <OverlayScrollbarsComponent 
            className="flex-1 min-h-0 w-full block"
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
            defer
          >
            <div className="w-full block p-8">
              <div className="flex items-center justify-between bg-darkCard p-6 rounded-xl border border-gray-800 mb-6 shadow-md shrink-0">
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <img 
                      src={`https://crafthead.net/avatar/${selectedPlayer}`} 
                      alt={`${selectedPlayer}'s face`} 
                      className="w-16 h-16 rounded-xl shadow-lg bg-gray-900 border border-white/10 object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://minotar.net/helm/${selectedPlayer}/64.png`;
                      }}
                    />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-darkCard ${activePlayers.includes(selectedPlayer) ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                      {selectedPlayer}
                      <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${activePlayers.includes(selectedPlayer) ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                        {activePlayers.includes(selectedPlayer) ? 'Online' : 'Offline'}
                      </span>
                    </h2>
                    <p className="text-sm text-gray-400 font-mono mt-1">Player Profile details</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPlayer(null)} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-all text-white">&larr; Back</button>
              </div>
          {playerListType === 'history' ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md">
                  <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    Log off Inventory {playerInventory === null && <span className="text-xs text-red-400 ml-2">(No Data)</span>}
                  </h3>
                  <div className="bg-[#c6c6c6] p-6 rounded-lg border-[4px] border-[#555555] inline-block shadow-2xl mx-auto w-full max-w-[480px]">
                    <div className="grid grid-cols-9 gap-1 mb-4 bg-[#c6c6c6]">
                      {Array.from({ length: 27 }).map((_, i) => <MinecraftSlot key={`main-${i + 9}`} item={inventoryMap.get(i + 9)} />)}
                    </div>
                    <div className="grid grid-cols-9 gap-1 mt-6">
                      {Array.from({ length: 9 }).map((_, i) => <MinecraftSlot key={`hotbar-${i}`} item={inventoryMap.get(i)} />)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <EquippedSkinCard playerName={selectedPlayer} />
                <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md flex flex-col items-center justify-center py-6">
                  <h3 className="font-bold text-gray-400 mb-2 uppercase tracking-widest text-sm">Total Playtime</h3>
                  <p className="text-3xl font-black text-brand">
                    {(() => {
                      const stats = playerData.find(p => p.username === selectedPlayer);
                      if (!stats) return '0h 0m 0s';
                      
                      let livePlaytime = stats.totalPlaytime || 0;
                      if (activePlayers.includes(selectedPlayer) && stats.currentSessionStart) {
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
                        if (activePlayers.includes(selectedPlayer)) return 'Currently Online';
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
                        if (activePlayers.includes(selectedPlayer)) return 'Currently Online';
                        if (stats?.logoffPosition) {
                          return `X: ${stats.logoffPosition.x}, Y: ${stats.logoffPosition.y}, Z: ${stats.logoffPosition.z}`;
                        }
                        return 'Unknown';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md">
                <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  Live Inventory {playerInventory === null && <span className="text-xs text-red-400 ml-2">(Offline / No Data)</span>}
                </h3>
                <div className="bg-[#c6c6c6] p-6 rounded-lg border-[4px] border-[#555555] inline-block shadow-2xl mx-auto w-full max-w-[480px]">
                  <div className="grid grid-cols-9 gap-1 mb-4 bg-[#c6c6c6]">
                    {Array.from({ length: 27 }).map((_, i) => <MinecraftSlot key={`main-${i + 9}`} item={inventoryMap.get(i + 9)} />)}
                  </div>
                  <div className="grid grid-cols-9 gap-1 mt-6">
                    {Array.from({ length: 9 }).map((_, i) => <MinecraftSlot key={`hotbar-${i}`} item={inventoryMap.get(i)} />)}
                  </div>
                </div>
              </div>
              <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md">
                <h3 className="font-bold text-lg mb-4 text-white">Health and Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <button onClick={() => sendPlayerCommand('kill {player}', 'Killed {player}!')} className="bg-orange-900/10 border border-orange-900/30 hover:border-orange-500/50 hover:bg-orange-900/20 text-orange-400 font-bold py-3 rounded-lg shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2">☠️ Kill</button>
                  <button onClick={() => sendPlayerCommand('effect give {player} instant_health 1 10', 'Healed {player}!')} className="bg-green-900/10 border border-green-900/30 hover:border-green-500/50 hover:bg-green-900/20 text-green-400 font-bold py-3 rounded-lg shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2">❤️ Heal</button>
                  <button onClick={() => sendPlayerCommand('effect give {player} hunger 10 10', 'Starved {player}!')} className="bg-orange-900/10 border border-orange-900/30 hover:border-orange-500/50 hover:bg-orange-900/20 text-orange-400 font-bold py-3 rounded-lg shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2">🍖 Starve</button>
                  <button onClick={() => sendPlayerCommand('effect give {player} saturation 1 10', 'Fed {player}!')} className="bg-green-900/10 border border-green-900/30 hover:border-green-500/50 hover:bg-green-900/20 text-green-400 font-bold py-3 rounded-lg shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2">🍗 Feed</button>
                  <button onClick={() => sendPlayerCommand('clear {player}', 'Cleared {player}\'s inventory!')} className="col-span-2 lg:col-span-4 bg-red-900/10 border border-red-900/30 hover:border-red-500/50 hover:bg-red-900/20 text-red-400 font-bold py-3 rounded-lg shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2">🗑️ Clear Inventory</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <EquippedSkinCard playerName={selectedPlayer} />
              <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md">
                <h3 className="font-bold text-lg mb-4 text-white">Control Panel</h3>
                <div className="space-y-3">
                  <button onClick={() => sendPlayerCommand('whitelist add {player}', 'Added {player} to Whitelist!')} className="w-full bg-[#111111] hover:bg-[#1a1a1a] py-3 px-4 rounded-lg font-bold flex justify-between items-center transition-all border border-[#222222] hover:border-brand text-gray-200">
                    <span>Add to Whitelist</span> <span className="text-gray-500">→</span>
                  </button>
                  <button onClick={() => sendPlayerCommand('op {player}', 'Made {player} an OP!')} className="w-full bg-[#111111] hover:bg-[#1a1a1a] py-3 px-4 rounded-lg font-bold flex justify-between items-center transition-all border border-[#222222] hover:border-brand text-gray-200">
                    <span>Make Operator (OP)</span> <span className="text-gray-500">→</span>
                  </button>
                  <button onClick={() => sendPlayerCommand('deop {player}', 'Removed {player} as OP!')} className="w-full bg-[#111111] hover:bg-[#1a1a1a] py-3 px-4 rounded-lg font-bold flex justify-between items-center transition-all border border-[#222222] hover:border-brand text-yellow-500">
                    <span>Remove OP</span> <span className="text-gray-500">→</span>
                  </button>
                  <button onClick={() => sendPlayerCommand('ban {player}', 'Banned {player} from server!')} className="w-full bg-[#1a0505] hover:bg-[#2a0a0a] border border-[#330000] hover:border-red-500 py-3 px-4 rounded-lg font-bold flex justify-between items-center transition-all text-red-400">
                    <span>Ban Player</span> <span className="text-red-500">→</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
          )}
          </div>
          </OverlayScrollbarsComponent>
        </div>
      )}
    </div>
  );
});
