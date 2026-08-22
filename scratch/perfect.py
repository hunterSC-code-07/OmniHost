import sys

def main():
    path = 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add imports
    content = content.replace("import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';", "import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';\nimport { motion, AnimatePresence } from 'motion/react';")

    # 2. Extract ternary parts
    # The ternary starts with:
    #     <OverlayScrollbarsComponent 
    #       className="flex-1 w-full block min-h-0"
    #       options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
    #       defer
    #     >
    #       {activeGameHub === null ? (

    # Let's split on '{activeGameHub === null ? ('
    parts1 = content.split('{activeGameHub === null ? (\n')
    if len(parts1) != 2:
        print("Failed to find start of ternary")
        return
        
    before_ternary = parts1[0]
    # Remove the OverlayScrollbarsComponent from before_ternary because we will put it inside each branch
    before_ternary = before_ternary.replace(
'''    <OverlayScrollbarsComponent 
      className="flex-1 w-full block min-h-0"
      options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
      defer
    >
''', '''    <div className="relative w-full h-full flex-1 min-h-0">
      <AnimatePresence>
        {activeGameHub === null ? (
'''
    )

    rest = parts1[1]

    # Split between dashboard and gamehub.
    # The swap point is:
    #         </div>
    #       ) : (
    #       <div className="w-full flex flex-col relative min-h-full pb-8">
    
    # We will search for '      ) : (\n      <div className="w-full flex flex-col relative min-h-full pb-8">'
    swap_str = '      ) : (\n      <div className="w-full flex flex-col relative min-h-full pb-8">'
    parts2 = rest.split(swap_str)
    if len(parts2) != 2:
        # Try alternate spacing
        swap_str = '      ) : (\n        <div className="w-full flex flex-col relative min-h-full pb-8">'
        parts2 = rest.split(swap_str)
        if len(parts2) != 2:
            print("Failed to find swap point")
            return
            
    dashboard_chunk = parts2[0]
    gamehub_chunk = '<div className="w-full flex flex-col relative min-h-full pb-8">' + parts2[1]
    
    # Extract after ternary
    # Gamehub ends with:
    #       </div>
    #       )}
    #     </OverlayScrollbarsComponent>
    #   );
    end_str = '      </div>\n      )}\n    </OverlayScrollbarsComponent>'
    parts3 = gamehub_chunk.split(end_str)
    if len(parts3) != 2:
        print("Failed to find end point")
        return
        
    gamehub_content = parts3[0] + '      </div>\n'
    after_ternary = '      )}\n      </AnimatePresence>\n    </div>' + parts3[1]
    
    # Now format the new branches!
    dashboard_new = '''          <motion.div 
            key="dashboard" 
            initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full flex flex-col min-h-0"
          >
            <OverlayScrollbarsComponent 
              className="flex-1 w-full block min-h-0"
              options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
              defer
            >
''' + dashboard_chunk + '''            </OverlayScrollbarsComponent>
          </motion.div>
        ) : (
'''

    gamehub_new = '''          <motion.div 
            key="game-hub"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full flex flex-col min-h-0"
          >
            <OverlayScrollbarsComponent 
              className="flex-1 w-full block min-h-0"
              options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
              defer
            >
''' + gamehub_content + '''            </OverlayScrollbarsComponent>
          </motion.div>
'''
    
    # 3. Add game cards layoutId in dashboard_new
    dashboard_new = dashboard_new.replace('<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></div>', '<motion.div layoutId={game-bg-Minecraft} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></motion.div>')
    dashboard_new = dashboard_new.replace('<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></div>', '<motion.div layoutId={game-bg-Palworld} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></motion.div>')
    dashboard_new = dashboard_new.replace('<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></div>', '<motion.div layoutId={game-bg-DayZ} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></motion.div>')
    dashboard_new = dashboard_new.replace('<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></div>', '<motion.div layoutId={game-bg-Satisfactory} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></motion.div>')
    
    # 4. Add gamehub background layoutId in gamehub_new
    gamehub_new = gamehub_new.replace('<div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{backgroundImage: url(\'\')}}></div>', '<motion.div layoutId={game-bg-} initial={{ opacity: 1 }} animate={{ opacity: 0.15 }} exit={{ opacity: 1 }} className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{backgroundImage: url(\'\')}}></motion.div>')
    
    final_content = before_ternary + dashboard_new + gamehub_new + after_ternary
    with open('scratch/DashboardHub_perfect.tsx', 'w', encoding='utf-8') as f:
        f.write(final_content)
        
    print("Done")

main()
