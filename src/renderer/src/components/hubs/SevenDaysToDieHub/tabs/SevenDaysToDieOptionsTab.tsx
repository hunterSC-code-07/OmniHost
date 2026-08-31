import React, { useState } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

import { useSevenDaysToDieOptions } from '../../../../hooks/useSevenDaysToDieOptions';

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

  const [activeSubTab, setActiveSubTab] = useState('general');

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white/50 sevendays-title text-2xl">LOADING CONFIGURATION...</div>
      </div>
    );
  }

  const gameWorldOptions = ['Navezgane', 'Pregen06k1', 'Pregen06k2', 'Pregen06k3', 'Pregen08k1', 'Pregen08k2', 'Pregen08k3', 'Pregen10k1', 'Pregen10k2', 'Pregen10k3', 'RWG', 'Empty'];
  const difficultyOptions = ['0', '1', '2', '3', '4'];
  const difficultyLabels = ['Scavenger (0)', 'Adventurer (1)', 'Nomad (2)', 'Survivalist (3)', 'Insane (4)'];

  if (!gameWorldOptions.includes(gameWorld)) {
    gameWorldOptions.unshift(gameWorld);
  }

  const handleCycle = (current: string | number, options: any[], setter: (val: any) => void, direction: 1 | -1) => {
    const idx = options.indexOf(String(current));
    let nextIdx = idx + direction;
    if (nextIdx >= options.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = options.length - 1;
    setter(options[nextIdx]);
  };

  const handleCycleNumber = (current: number, min: number, max: number, step: number, setter: (val: number) => void, direction: 1 | -1) => {
    let next = current + (step * direction);
    if (next > max) next = min;
    if (next < min) next = max;
    setter(next);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-8 sevendays-ui gap-6 relative">
      <div className="flex justify-between items-end pb-2">
        <h3 className="sevendays-title text-2xl">SERVER SETTINGS</h3>
      </div>

      <div className="flex-1 flex gap-2 min-h-0">
        
        {/* Left Panel */}
        <div className="flex-[4] sevendays-panel flex flex-col min-h-0">
          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-8">
            <div className="space-y-6">
              <div className="sevendays-input-row">
                <span className="sevendays-input-label">Server Name</span>
                <div className="sevendays-input-container">
                  <input 
                    type="text" 
                    value={serverName}
                    onChange={e => setServerName(e.target.value)}
                    className="sevendays-input w-full px-2"
                  />
                </div>
              </div>

              <div className="sevendays-input-row">
                <span className="sevendays-input-label">Description</span>
                <div className="sevendays-input-container">
                  <input 
                    type="text" 
                    value={serverDescription}
                    onChange={e => setServerDescription(e.target.value)}
                    className="sevendays-input w-full px-2"
                  />
                </div>
              </div>

              <div className="sevendays-input-row">
                <span className="sevendays-input-label">Password</span>
                <div className="sevendays-input-container">
                  <input 
                    type="password" 
                    value={serverPassword}
                    onChange={e => setServerPassword(e.target.value)}
                    className="sevendays-input w-full px-2"
                  />
                </div>
              </div>

              <div className="sevendays-input-row">
                <span className="sevendays-input-label">Game World</span>
                <div className="sevendays-input-container">
                  <span className="sevendays-input-arrow" onClick={() => handleCycle(gameWorld, gameWorldOptions, setGameWorld, -1)}>&lt;</span>
                  <div className="sevendays-input flex items-center justify-center select-none" onClick={() => handleCycle(gameWorld, gameWorldOptions, setGameWorld, 1)}>{gameWorld}</div>
                  <span className="sevendays-input-arrow" onClick={() => handleCycle(gameWorld, gameWorldOptions, setGameWorld, 1)}>&gt;</span>
                </div>
              </div>

              {gameWorld === 'RWG' && (
                <div className="sevendays-input-row">
                  <span className="sevendays-input-label">World Gen Seed</span>
                  <div className="sevendays-input-container">
                    <input 
                      type="text" 
                      value={worldGenSeed}
                      onChange={e => setWorldGenSeed(e.target.value)}
                      className="sevendays-input w-full px-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </OverlayScrollbarsComponent>
        </div>

        {/* Right Panel */}
        <div className="flex-[6] sevendays-panel flex flex-col min-h-0">
          <div className="flex gap-1 border-b border-[var(--7dtd-border)] bg-[var(--7dtd-bg-panel-dark)]">
            {['general', 'multiplayer', 'resources'].map(tab => (
              <div 
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`sevendays-tab px-6 py-3 border-b-2 ${activeSubTab === tab ? 'border-white text-white bg-white/10' : 'border-transparent text-[var(--7dtd-text-dim)] hover:text-white'}`}
              >
                {tab}
              </div>
            ))}
          </div>

          <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-8">
            <div className="space-y-6">
              
              {activeSubTab === 'general' && (
                <>
                  <div className="sevendays-input-row">
                    <span className="sevendays-input-label">Game Difficulty</span>
                    <div className="sevendays-input-container">
                      <span className="sevendays-input-arrow" onClick={() => handleCycle(gameDifficulty, difficultyOptions, setGameDifficulty, -1)}>&lt;</span>
                      <div className="sevendays-input flex items-center justify-center select-none" onClick={() => handleCycle(gameDifficulty, difficultyOptions, setGameDifficulty, 1)}>
                        {difficultyLabels[difficultyOptions.indexOf(String(gameDifficulty))] || gameDifficulty}
                      </div>
                      <span className="sevendays-input-arrow" onClick={() => handleCycle(gameDifficulty, difficultyOptions, setGameDifficulty, 1)}>&gt;</span>
                    </div>
                  </div>
                </>
              )}

              {activeSubTab === 'multiplayer' && (
                <>
                  <div className="sevendays-input-row">
                    <span className="sevendays-input-label">Max Players</span>
                    <div className="sevendays-input-container">
                      <span className="sevendays-input-arrow" onClick={() => handleCycleNumber(parseInt(serverMaxPlayerCount) || 1, 1, 64, 1, (v) => setServerMaxPlayerCount(String(v)), -1)}>&lt;</span>
                      <div className="sevendays-input flex items-center justify-center select-none">{serverMaxPlayerCount}</div>
                      <span className="sevendays-input-arrow" onClick={() => handleCycleNumber(parseInt(serverMaxPlayerCount) || 1, 1, 64, 1, (v) => setServerMaxPlayerCount(String(v)), 1)}>&gt;</span>
                    </div>
                  </div>

                  <div className="sevendays-input-row">
                    <span className="sevendays-input-label">Server Port</span>
                    <div className="sevendays-input-container">
                      <span className="sevendays-input-arrow" onClick={() => handleCycleNumber(parseInt(serverPort) || 26900, 1024, 65535, 1, (v) => setServerPort(String(v)), -1)}>&lt;</span>
                      <div className="sevendays-input flex items-center justify-center select-none">{serverPort}</div>
                      <span className="sevendays-input-arrow" onClick={() => handleCycleNumber(parseInt(serverPort) || 26900, 1024, 65535, 1, (v) => setServerPort(String(v)), 1)}>&gt;</span>
                    </div>
                  </div>
                </>
              )}

              {activeSubTab === 'resources' && (
                <>
                  <div className="sevendays-input-row">
                    <span className="sevendays-input-label">RAM Limit (GB)</span>
                    <div className="sevendays-input-container">
                      <span className="sevendays-input-arrow" onClick={() => handleCycleNumber(ramLimit, 1, sysInfo.totalMem, 0.5, setRamLimit, -1)}>&lt;</span>
                      <div className="sevendays-input flex items-center justify-center select-none">{ramLimit.toFixed(1)} GB</div>
                      <span className="sevendays-input-arrow" onClick={() => handleCycleNumber(ramLimit, 1, sysInfo.totalMem, 0.5, setRamLimit, 1)}>&gt;</span>
                    </div>
                  </div>

                  <div className="sevendays-input-row">
                    <span className="sevendays-input-label">CPU Limit (%)</span>
                    <div className="sevendays-input-container">
                      <span className="sevendays-input-arrow" onClick={() => handleCycleNumber(cpuLimit, 10, 100, 5, setCpuLimit, -1)}>&lt;</span>
                      <div className="sevendays-input flex items-center justify-center select-none">{cpuLimit}%</div>
                      <span className="sevendays-input-arrow" onClick={() => handleCycleNumber(cpuLimit, 10, 100, 5, setCpuLimit, 1)}>&gt;</span>
                    </div>
                  </div>
                </>
              )}

            </div>
          </OverlayScrollbarsComponent>
        </div>

      </div>

      <div className="flex justify-between items-center pt-2">
        <div></div> {/* Spacer */}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="sevendays-btn px-12 py-3 text-lg"
        >
          {isSaving ? 'SAVING...' : 'SAVE'}
        </button>
      </div>

    </div>
  );
};
