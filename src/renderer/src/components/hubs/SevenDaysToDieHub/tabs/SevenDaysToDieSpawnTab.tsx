import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlayerStore } from '../../../../store/usePlayerStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search } from 'lucide-react';

interface SevenDaysToDieSpawnTabProps {
  serverId: number;
}

interface GameItem {
  name: string;
  group: string;
  type: string; // 'item' or 'entity'
}

export const SevenDaysToDieSpawnTab: React.FC<SevenDaysToDieSpawnTabProps> = ({ serverId }) => {
  const { onlinePlayers: allOnlinePlayers } = usePlayerStore();
  const onlinePlayers = serverId ? (allOnlinePlayers[serverId] || []) : [];

  const [targetPlayer, setTargetPlayer] = useState<string>(onlinePlayers.length > 0 ? onlinePlayers[0] : '');
  const [actionType, setActionType] = useState<'item' | 'entity'>('item');
  const [quantity, setQuantity] = useState<string>('1');
  
  // Data state
  const [items, setItems] = useState<GameItem[]>([]);
  const [entities, setEntities] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItemName, setSelectedItemName] = useState<string>('');

  useEffect(() => {
    // If online players change and we don't have a valid target, set it
    if (onlinePlayers.length > 0 && !onlinePlayers.includes(targetPlayer)) {
      setTargetPlayer(onlinePlayers[0]);
    }
  }, [onlinePlayers, targetPlayer]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        // @ts-ignore
        const fetchedItems = await window.api.server.get7DTDItems(Number(serverId));
        // @ts-ignore
        const fetchedEntities = await window.api.server.get7DTDEntities(Number(serverId));
        if (mounted) {
          setItems(fetchedItems);
          setEntities(fetchedEntities);
        }
      } catch (err) {
        console.error("Failed to load 7DTD data", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [serverId]);

  const currentDataList = actionType === 'item' ? items : entities;

  const categories = useMemo(() => {
    const cats = new Set(currentDataList.map(i => i.group));
    return ['All', ...Array.from(cats)].sort();
  }, [currentDataList]);

  // Reset category if switching types
  useEffect(() => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedItemName('');
  }, [actionType]);

  const filteredData = useMemo(() => {
    let data = currentDataList;
    if (selectedCategory !== 'All') {
      data = data.filter(d => d.group === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(d => d.name.toLowerCase().includes(q) || d.group.toLowerCase().includes(q));
    }
    return data;
  }, [currentDataList, selectedCategory, searchQuery]);

  // Virtualizer setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const handleSpawn = () => {
    if (!targetPlayer || !selectedItemName) return;

    let command = '';
    if (actionType === 'item') {
      command = `give ${targetPlayer} ${selectedItemName} ${quantity}`;
    } else {
      command = `se ${targetPlayer} ${selectedItemName}`;
    }

    // @ts-ignore
    window.api.server.sendCommand(Number(serverId), command);
  };

  return (
    <div className="flex-1 min-h-0 sevendays-ui flex flex-col p-8 gap-6">
      <div className="flex justify-between items-end pb-2">
        <h3 className="sevendays-title text-3xl">ITEM & ENTITY SPAWNER</h3>
      </div>

      <div className="flex gap-4 min-h-0 flex-1">
        {/* Left Column: Data Selection (Virtualized) */}
        <div className="flex-[7] sevendays-panel flex flex-col min-h-0 overflow-hidden border border-[var(--7dtd-border)]">
          
          {/* Header Tabs */}
          <div className="flex border-b border-[var(--7dtd-border)] bg-[var(--7dtd-bg-panel-dark)]">
            <button
              onClick={() => setActionType('item')}
              className={`flex-1 py-3 text-lg sevendays-title transition-colors border-b-2 ${actionType === 'item' ? 'bg-white/10 text-white border-white' : 'text-[var(--7dtd-text-dim)] border-transparent hover:text-white hover:bg-white/5'}`}
            >
              ITEMS ({items.length})
            </button>
            <div className="w-[1px] bg-[var(--7dtd-border)]"></div>
            <button
              onClick={() => setActionType('entity')}
              className={`flex-1 py-3 text-lg sevendays-title transition-colors border-b-2 ${actionType === 'entity' ? 'bg-white/10 text-white border-white' : 'text-[var(--7dtd-text-dim)] border-transparent hover:text-white hover:bg-white/5'}`}
            >
              ENTITIES ({entities.length})
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 space-y-4 border-b border-[var(--7dtd-border)] bg-[var(--7dtd-bg-panel)]">
            <div className="sevendays-input-container relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--7dtd-text-dim)] w-5 h-5" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="sevendays-input w-full pl-10 pr-4 py-2 uppercase"
                placeholder={`SEARCH ${filteredData.length} ${actionType.toUpperCase()}S...`}
              />
            </div>
            
            <div className="sevendays-input-container flex">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)} 
                className="sevendays-input w-full px-4 py-2 uppercase"
              >
                {categories.map(c => <option key={c} value={c} className="bg-black text-white">{`CATEGORY: ${c}`}</option>)}
              </select>
            </div>
          </div>

          {/* Virtualized List */}
          <div className="flex-1 min-h-0 relative bg-[var(--7dtd-bg-panel-dark)]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 sevendays-title">LOADING DATA...</div>
            ) : filteredData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 sevendays-title">NO RESULTS FOUND.</div>
            ) : (
              <div 
                ref={parentRef} 
                className="absolute inset-0 overflow-auto os-theme-dark"
                style={{ contain: 'strict' }}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = filteredData[virtualRow.index];
                    const isSelected = selectedItemName === item.name;
                    return (
                      <div
                        key={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className={`px-4 py-2 border-b border-[var(--7dtd-border)] cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between uppercase ${isSelected ? 'bg-white/10 border-l-4 border-l-white' : ''}`}
                        onClick={() => setSelectedItemName(item.name)}
                      >
                        <span className={`text-sm ${isSelected ? 'text-white font-bold' : 'text-white/70'}`}>{item.name}</span>
                        <span className="text-xs text-[var(--7dtd-text-dim)] px-2 py-1 bg-black/40 border border-white/10 font-bold">{item.group}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Execute Panel */}
        <div className="flex-[3] sevendays-panel p-6 border border-[var(--7dtd-border)] flex flex-col h-fit">
          <h4 className="sevendays-title text-xl mb-6 pb-2 border-b border-[var(--7dtd-border)]">SPAWN SETTINGS</h4>

          <div className="space-y-6">
            {/* Target Player */}
            <div className="sevendays-input-row flex-col items-start gap-2">
              <span className="sevendays-input-label">TARGET PLAYER</span>
              {onlinePlayers.length === 0 ? (
                <div className="w-full bg-red-900/20 border border-red-500/50 p-3 text-red-400 sevendays-title text-sm">
                  NO PLAYERS ONLINE
                </div>
              ) : (
                <div className="sevendays-input-container w-full flex">
                  <select 
                    value={targetPlayer} 
                    onChange={(e) => setTargetPlayer(e.target.value)} 
                    className="sevendays-input w-full px-4 py-2 uppercase"
                  >
                    {onlinePlayers.map(p => <option key={p} value={p} className="bg-black text-white">{p}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Selected Target Item Display */}
            <div className="sevendays-input-row flex-col items-start gap-2">
              <span className="sevendays-input-label">SELECTED {actionType === 'item' ? 'ITEM' : 'ENTITY'}</span>
              <div className="w-full sevendays-input-container">
                <div className="sevendays-input w-full p-3 text-sm break-all">
                  {selectedItemName || 'NONE SELECTED'}
                </div>
              </div>
            </div>

            {/* Quantity (Only for Items) */}
            {actionType === 'item' && (
              <div className="sevendays-input-row flex-col items-start gap-2">
                <span className="sevendays-input-label">QUANTITY</span>
                <div className="sevendays-input-container w-full">
                  <input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min={1}
                    max={10000}
                    className="sevendays-input w-full px-4 py-2"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Spawn Button */}
          <div className="pt-8 mt-auto">
            <button 
              onClick={handleSpawn}
              disabled={!targetPlayer || !selectedItemName}
              className="sevendays-btn w-full py-4 text-xl flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[24px]">
                {actionType === 'item' ? 'inventory_2' : 'public'}
              </span>
              SPAWN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
