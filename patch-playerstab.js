const fs = require('fs');

let code = fs.readFileSync('src/renderer/src/components/tabs/PlayersTab.tsx', 'utf-8');

// 1. Update the tabs array to include history
code = code.replace(
  `            {['live', 'whitelist', 'ops', 'banned-players', 'banned-ips'].map(type => (`,
  `            {['live', 'history', 'whitelist', 'ops', 'banned-players', 'banned-ips'].map(type => (`
);

// 2. Update pName calculation
code = code.replace(
  `                  const pName = typeof player === 'string' ? player : (player.name || player.ip);`,
  `                  const pName = typeof player === 'string' ? player : (player.username || player.name || player.ip);`
);

// 3. Update the detailed view for History
const detailBlockOld = `          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-20">`;
const detailBlockNew = `          {playerListType === 'history' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
              <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md flex flex-col items-center justify-center py-12">
                <h3 className="font-bold text-gray-400 mb-2 uppercase tracking-widest text-sm">Total Playtime</h3>
                <p className="text-4xl font-black text-brand">
                  {(() => {
                    const stats = playerData.find(p => p.username === selectedPlayer);
                    if (!stats || !stats.totalPlaytime) return '0h 0m';
                    const hrs = Math.floor(stats.totalPlaytime / (1000 * 60 * 60));
                    const mins = Math.floor((stats.totalPlaytime / (1000 * 60)) % 60);
                    return \`\${hrs}h \${mins}m\`;
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
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-20">`;

code = code.replace(detailBlockOld, detailBlockNew);

// Need to close the ternary at the bottom of the component
// Find `    </div>` right before `  );`
const bottomOld = `            </div>
          </div>
        </div>
      )}
    </div>
  );
});`;

const bottomNew = `            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
});`;
code = code.replace(bottomOld, bottomNew);

fs.writeFileSync('src/renderer/src/components/tabs/PlayersTab.tsx', code, 'utf-8');
console.log('Patched PlayersTab.tsx');
