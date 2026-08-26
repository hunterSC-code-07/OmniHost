import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

import { useDayzEconomy } from '../../../../hooks/useDayzEconomy';

export const DayzEconomyTab: React.FC = () => {
  const {
    isLoading,
    isSaving,
    error,
    pristineLoot, setPristineLoot,
    multipliers,
    loadEconomy,
    handleMultiplierChange,
    handleSave
  } = useDayzEconomy();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading Economy Files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl max-w-lg text-center">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <h3 className="font-bold text-lg mb-2">Economy Files Not Found</h3>
          <p className="text-sm opacity-80">{error}</p>
          <button 
            onClick={loadEconomy}
            className="mt-4 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderSlider = (category: string, label: string) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-bold text-gray-300">{label} Spawn Multiplier</label>
        <span className="text-red-400 font-mono">{multipliers[category]?.toFixed(1)}x</span>
      </div>
      <input 
        type="range" 
        min="0.1" 
        max="5.0" 
        step="0.1" 
        value={multipliers[category]} 
        onChange={(e) => handleMultiplierChange(category, parseFloat(e.target.value))}
        className="w-full accent-red-500"
      />
      <div className="relative h-4 text-[11px] text-gray-500 mt-1">
        <span className="absolute left-0">0.1x</span>
        <span className="absolute left-[18.4%] -translate-x-1/2">1.0x (Vanilla)</span>
        <span className="absolute right-0">5.0x</span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 bg-black/20 backdrop-blur-sm flex flex-col">
      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
        
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Central Economy</h3>
            <p className="text-sm text-gray-400">Tweak loot spawns and item conditions. These changes overwrite your mission's <code className="text-red-400">globals.xml</code> and <code className="text-red-400">types.xml</code>.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-red-900/80 border border-red-500/50 hover:bg-red-800 hover:border-red-400 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 min-w-max"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                Applying...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save & Apply
              </>
            )}
          </button>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-8">
          
          {/* Pristine Loot Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-white/5">
            <div>
              <h4 className="font-bold text-white">Always Spawn Pristine Loot</h4>
              <p className="text-sm text-gray-400 mt-1">Forces all naturally spawned items on the map to be in pristine condition by setting LootDamageMax to 0.</p>
            </div>
            <button
              onClick={() => setPristineLoot(!pristineLoot)}
              className={`w-12 h-6 rounded-full transition-colors relative ${pristineLoot ? 'bg-red-600' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${pristineLoot ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <hr className="border-white/10" />

          {/* Sliders */}
          <div>
            <h4 className="font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400">category</span>
              Item Spawn Frequencies
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {renderSlider('food', 'Food & Drink')}
              {renderSlider('weapons', 'Weapons & Firearms')}
              {renderSlider('clothes', 'Clothing')}
              {renderSlider('tools', 'Tools & Hardware')}
              {renderSlider('vehiclesparts', 'Vehicle Parts')}
            </div>
            
            <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
              <span className="material-symbols-outlined text-blue-400">info</span>
              <div>
                <h5 className="text-blue-400 font-bold text-sm">How this works</h5>
                <p className="text-sm text-gray-400 mt-1">Adjusting these sliders will multiply the <code className="text-blue-300">nominal</code> and <code className="text-blue-300">min</code> tags for every item in that category inside <code className="text-blue-300">types.xml</code>. Backups are automatically created before any edits are made.</p>
              </div>
            </div>
            
            <hr className="border-white/10 my-8" />
            
            <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-red-500/20">
              <div>
                <h4 className="font-bold text-red-400">Wipe Spawned Loot</h4>
                <p className="text-sm text-gray-400 mt-1">Deletes the <code className="text-red-400">types.bin</code> storage file. On the next server restart, the economy will generate fresh loot across the entire map using your new settings. Player characters are NOT affected.</p>
              </div>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to wipe all spawned items on the map? This will delete the types.bin file and cannot be undone.')) {
                    try {
                      // @ts-ignore
                      const success = await window.api.wipeDayzLoot(activeServerId);
                      if (success) {
                        alert('Loot storage successfully wiped! Restart the server to generate fresh loot.');
                      } else {
                        alert('Failed to wipe loot. Storage file may not exist yet or an error occurred.');
                      }
                    } catch (e: any) {
                      if (e.message?.includes('SERVER_IS_RUNNING')) {
                        alert('Error: You must shut down the server before wiping the loot! If you wipe the loot while the server is running, the server will just overwrite the wipe with its memory state when it shuts down.');
                      } else {
                        alert('Failed to wipe loot. Storage file may not exist yet or an error occurred.');
                      }
                    }
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-colors whitespace-nowrap ml-4"
              >
                Wipe Loot
              </button>
            </div>
          </div>

        </div>

        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};
