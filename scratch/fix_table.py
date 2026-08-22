import re

def main():
    path = 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The block to replace starts with:
    #                   ) : (
    #                     <div className="overflow-x-auto">
    #                       <table className="w-full text-left border-collapse">
    
    # We need to find the game hub's table.
    # The game hub's table is the SECOND table in the file.
    
    parts = content.split(') : (\n                    <div className="overflow-x-auto">\n                      <table className="w-full text-left border-collapse">')
    
    if len(parts) == 2: # Found exactly one match (which happens to be the second table, if indentation is exact)
        print("Found exact gamehub table match")
        
        # Now find the end of this table
        # It ends at:
        #                       </table>
        #                     </div>
        #                   )}
        #                 </div>
        table_end = parts[1].find('                      </table>\n                    </div>')
        if table_end == -1:
            print("Could not find table end")
            return
            
        before = parts[0]
        after = parts[1][table_end + len('                      </table>\n                    </div>'):]
        
        new_cards = ''') : (
                    <div className="flex flex-col gap-4">
                      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Available Servers</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {servers.filter((s: any) => s.game.includes(activeGameHub)).map((server: any) => (
                          <div key={server.id} onClick={() => setActiveServerId(server.id)} className="group relative rounded-xl overflow-hidden glass-panel p-6 flex flex-col gap-4 border border-surface-container-high hover:border-primary transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                            <div className="flex justify-between items-start">
                              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">{server.name}</h3>
                              <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-surface-container-highest">
                                {server.status === 'Online' ? (
                                  <><span className="w-2 h-2 rounded-full bg-[#4CAF50] shadow-[0_0_8px_rgba(76,175,80,0.8)]"></span><span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Online</span></>
                                ) : (
                                  <><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span><span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Offline</span></>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 mt-4">
                              <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
                                <span className="material-symbols-outlined text-lg text-primary">cell_tower</span>
                                <span className="font-mono text-on-surface tracking-wider">{tunnelIp}:{server.port || 25565}</span>
                              </div>
                              
                              <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-container-high/60">
                                <div className="flex items-center justify-between text-xs text-on-surface-variant font-label-sm">
                                  <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base opacity-70">memory</span>
                                    Software:
                                  </span>
                                  <span className="text-on-surface font-bold bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
                                    {server.type || 'Vanilla'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-on-surface-variant font-label-sm">
                                  <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base opacity-70">tag</span>
                                    Version:
                                  </span>
                                  <span className="text-on-surface font-bold bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
                                    {server.version || '1.20.4'}{server.loaderVersion ? ` (${server.loaderVersion})` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-surface-container-high flex justify-end">
                              <button className="text-primary font-label-md text-label-md uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                                Manage <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>'''
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(before + new_cards + after)
        
    else:
        print(f"Match parts: {len(parts)}. Will use regex.")
        # Regex approach for the Game Hub table (the second table in the file)
        
        # Find all tables
        tables = list(re.finditer(r'\) : \(\s*<div className="overflow-x-auto">\s*<table[\s\S]*?</table>\s*</div>', content))
        if len(tables) >= 2:
            gamehub_table = tables[1]
            
            new_cards = ''') : (
                    <div className="flex flex-col gap-4">
                      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Available Servers</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {servers.filter((s: any) => s.game.includes(activeGameHub)).map((server: any) => (
                          <div key={server.id} onClick={() => setActiveServerId(server.id)} className="group relative rounded-xl overflow-hidden glass-panel p-6 flex flex-col gap-4 border border-surface-container-high hover:border-primary transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                            <div className="flex justify-between items-start">
                              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">{server.name}</h3>
                              <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-surface-container-highest">
                                {server.status === 'Online' ? (
                                  <><span className="w-2 h-2 rounded-full bg-[#4CAF50] shadow-[0_0_8px_rgba(76,175,80,0.8)]"></span><span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Online</span></>
                                ) : (
                                  <><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span><span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Offline</span></>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 mt-4">
                              <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
                                <span className="material-symbols-outlined text-lg text-primary">cell_tower</span>
                                <span className="font-mono text-on-surface tracking-wider">{tunnelIp}:{server.port || 25565}</span>
                              </div>
                              
                              <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-container-high/60">
                                <div className="flex items-center justify-between text-xs text-on-surface-variant font-label-sm">
                                  <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base opacity-70">memory</span>
                                    Software:
                                  </span>
                                  <span className="text-on-surface font-bold bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
                                    {server.type || 'Vanilla'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-on-surface-variant font-label-sm">
                                  <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base opacity-70">tag</span>
                                    Version:
                                  </span>
                                  <span className="text-on-surface font-bold bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
                                    {server.version || '1.20.4'}{server.loaderVersion ? ` (${server.loaderVersion})` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-surface-container-high flex justify-end">
                              <button className="text-primary font-label-md text-label-md uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                                Manage <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>'''
            
            new_content = content[:gamehub_table.start()] + new_cards + content[gamehub_table.end():]
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("Replaced with regex.")
        else:
            print("Failed to find second table")

main()
