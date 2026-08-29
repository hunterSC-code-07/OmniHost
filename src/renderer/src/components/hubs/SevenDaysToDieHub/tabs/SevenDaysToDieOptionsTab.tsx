import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { CustomSelect, CustomNumberInput } from '../../../common/CustomInputs';

import { useSevenDaysToDieOptions } from '../../../../hooks/useSevenDaysToDieOptions';
import { ResourceAllocationPanel } from '../../../common/ResourceAllocationPanel';

export const SevenDaysToDieOptionsTab: React.FC = () => {
  const {
    isLoading,
    isSaving,
    serverName, setServerName,
    serverDescription, setServerDescription,
    serverPassword, setServerPassword,
    serverMaxPlayerCount, setServerMaxPlayerCount,
    gameWorld, setGameWorld,
    worldGenSeed, setWorldGenSeed,
    gameDifficulty, setGameDifficulty,
    serverPort, setServerPort,
    ramLimit, setRamLimit,
    cpuLimit, setCpuLimit,
    sysInfo,
    handleSave
  } = useSevenDaysToDieOptions();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading Configuration...</div>
      </div>
    );
  }

  const gameWorldOptions = [
    { label: 'Navezgane', value: 'Navezgane' },
    { label: 'Pregen06k1', value: 'Pregen06k1' },
    { label: 'Pregen06k2', value: 'Pregen06k2' },
    { label: 'Pregen06k3', value: 'Pregen06k3' },
    { label: 'Pregen08k1', value: 'Pregen08k1' },
    { label: 'Pregen08k2', value: 'Pregen08k2' },
    { label: 'Pregen08k3', value: 'Pregen08k3' },
    { label: 'Pregen10k1', value: 'Pregen10k1' },
    { label: 'Pregen10k2', value: 'Pregen10k2' },
    { label: 'Pregen10k3', value: 'Pregen10k3' },
    { label: 'RWG (Random World Generation)', value: 'RWG' },
    { label: 'Empty', value: 'Empty' }
  ];

  const difficultyOptions = [
    { label: 'Scavenger (0)', value: '0' },
    { label: 'Adventurer (1)', value: '1' },
    { label: 'Nomad (2)', value: '2' },
    { label: 'Survivalist (3)', value: '3' },
    { label: 'Insane (4)', value: '4' }
  ];

  // If the user's gameworld isn't in our list (e.g. a custom map name), add it manually
  if (!gameWorldOptions.find(o => o.value === gameWorld)) {
    gameWorldOptions.unshift({ label: `${gameWorld} (Custom)`, value: gameWorld });
  }

  return (
    <div className="flex-1 min-h-0 bg-black/20 backdrop-blur-sm flex flex-col">
      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
        
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Server Properties</h3>
            <p className="text-sm text-gray-400">Configure your 7 Days to Die server settings. These changes modify serverconfig.xml.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-red-900/80 border border-red-500/50 hover:bg-red-800 hover:border-red-400 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save Changes
              </>
            )}
          </button>
        </div>

        <ResourceAllocationPanel 
          ramLimit={ramLimit} 
          setRamLimit={setRamLimit} 
          cpuLimit={cpuLimit} 
          setCpuLimit={setCpuLimit} 
          sysInfo={sysInfo} 
        />

        <div className="glass-panel bg-black/40 border border-white/10 p-6 rounded-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Server Name */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-300 mb-2">Server Name</label>
              <input 
                type="text" 
                value={serverName}
                onChange={e => setServerName(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 transition-colors"
                placeholder="My 7DTD Server"
              />
            </div>

            {/* Server Description */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-300 mb-2">Server Description</label>
              <textarea 
                value={serverDescription}
                onChange={e => setServerDescription(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 transition-colors h-24 resize-none"
                placeholder="A 7 Days to Die server"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Server Password</label>
              <input 
                type="text" 
                value={serverPassword}
                onChange={e => setServerPassword(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 transition-colors"
                placeholder="Leave blank for public"
              />
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Max Players</label>
              <CustomNumberInput 
                value={serverMaxPlayerCount}
                onChange={setServerMaxPlayerCount}
                min={1}
                max={64}
              />
            </div>
            
            {/* Server Port */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Server Port</label>
              <CustomNumberInput 
                value={serverPort}
                onChange={setServerPort}
                min={1024}
                max={65535}
              />
            </div>

            {/* Game Difficulty */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Game Difficulty</label>
              <CustomSelect 
                value={gameDifficulty}
                onChange={setGameDifficulty}
                options={difficultyOptions}
              />
            </div>

            {/* Map Template / GameWorld */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-300 mb-2">Game World</label>
              <CustomSelect 
                value={gameWorld}
                onChange={setGameWorld}
                options={gameWorldOptions}
              />
              <p className="text-xs text-gray-500 mt-1">If RWG, WorldGenSeed determines the generated map.</p>
            </div>

            {/* WorldGenSeed */}
            {gameWorld === 'RWG' && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-300 mb-2">World Gen Seed</label>
                <input 
                  type="text" 
                  value={worldGenSeed}
                  onChange={e => setWorldGenSeed(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 transition-colors"
                  placeholder="Enter a string seed"
                />
              </div>
            )}

          </div>
        </div>

        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};
