import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CustomSelect, CustomNumberInput } from '../../../common/CustomInputs';
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
    <div className="flex-1 min-h-0 bg-black/20 backdrop-blur-sm flex flex-col p-6">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col min-h-0 space-y-6">
        
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Item & Entity Spawner</h3>
          <p className="text-sm text-gray-400">Spawn any item directly into a player's inventory, or spawn physical entities in the world near them.</p>
        </div>

        <div className="flex gap-6 min-h-0 flex-1">
          {/* Left Column: Data Selection (Virtualized) */}
          <div className="flex-1 glass-panel bg-black/40 border border-white/10 rounded-xl flex flex-col min-h-0 overflow-hidden">
            
            {/* Header Tabs */}
            <div className="flex bg-[#121212] border-b border-white/10 p-2 gap-2">
              <button
                onClick={() => setActionType('item')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${actionType === 'item' ? 'bg-[#b32b2b]/20 text-[#ff4f4f] shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                Items ({items.length})
              </button>
              <button
                onClick={() => setActionType('entity')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${actionType === 'entity' ? 'bg-[#b32b2b]/20 text-[#ff4f4f] shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                Entities ({entities.length})
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 space-y-4 border-b border-white/10 bg-black/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-red-500 transition-colors text-sm"
                  placeholder={`Search ${filteredData.length} ${actionType}s...`}
                />
              </div>
              <div>
                <CustomSelect 
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categories.map(c => ({ label: `Category: ${c}`, value: c }))}
                />
              </div>
            </div>

            {/* Virtualized List */}
            <div className="flex-1 min-h-0 relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">Loading data...</div>
              ) : filteredData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">No results found.</div>
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
                          className={`px-4 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between ${isSelected ? 'bg-red-500/20 border-l-2 border-l-red-500' : ''}`}
                          onClick={() => setSelectedItemName(item.name)}
                        >
                          <span className={`text-sm ${isSelected ? 'text-white font-bold' : 'text-gray-300'}`}>{item.name}</span>
                          <span className="text-xs text-gray-500 px-2 py-1 bg-black/40 rounded-full">{item.group}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Execute Panel */}
          <div className="w-80 glass-panel bg-black/40 border border-white/10 p-6 rounded-xl space-y-6 flex flex-col h-fit">
            <div>
              <h4 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Spawn Settings</h4>
            </div>

            {/* Target Player */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Target Player</label>
              {onlinePlayers.length === 0 ? (
                <div className="w-full bg-[#121212] border border-red-500/30 rounded-lg p-3 text-red-400/80 italic text-sm">
                  No players online.
                </div>
              ) : (
                <CustomSelect 
                  value={targetPlayer}
                  onChange={setTargetPlayer}
                  options={onlinePlayers.map(p => ({ label: p, value: p }))}
                />
              )}
            </div>

            {/* Selected Target Item Display */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Selected {actionType === 'item' ? 'Item' : 'Entity'}</label>
              <div className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white text-sm break-all font-mono">
                {selectedItemName || 'None selected'}
              </div>
            </div>

            {/* Quantity (Only for Items) */}
            {actionType === 'item' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-gray-300 mb-2">Quantity</label>
                <CustomNumberInput 
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={10000}
                />
              </div>
            )}
            
            {/* Spawn Button */}
            <div className="pt-4 mt-auto">
              <button 
                onClick={handleSpawn}
                disabled={!targetPlayer || !selectedItemName}
                className="w-full bg-red-900/80 border border-red-500/50 hover:bg-red-800 hover:border-red-400 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50 text-white px-4 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {actionType === 'item' ? 'inventory_2' : 'public'}
                </span>
                Spawn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
