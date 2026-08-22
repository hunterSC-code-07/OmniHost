import re

def main():
    path = 'src/renderer/src/App.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add import
    if "import { motion, AnimatePresence }" not in content:
        content = content.replace("import 'overlayscrollbars/overlayscrollbars.css';", "import 'overlayscrollbars/overlayscrollbars.css';\nimport { motion, AnimatePresence } from 'motion/react';")

    # 2. Add AnimatePresence and motion.div wrappers
    # We will replace the views block.
    
    # We need to find:
    #           {/* DASHBOARD VIEW */}
    #           {activeServerId === null && (
    #             <DashboardHub 
    
    # And replace with:
    #           <AnimatePresence>
    #           {/* DASHBOARD VIEW */}
    #           {activeServerId === null && (
    #             <motion.div key="dashboard-hub" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="absolute inset-0 w-full h-full flex flex-col min-h-0">
    #               <DashboardHub 
    
    dashboard_search = """          {/* DASHBOARD VIEW */}
          {activeServerId === null && (
            <DashboardHub """
            
    dashboard_replace = """          <AnimatePresence>
          {/* DASHBOARD VIEW */}
          {activeServerId === null && (
            <motion.div key="dashboard-hub" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="absolute inset-0 w-full h-full flex flex-col min-h-0">
              <DashboardHub """
              
    content = content.replace(dashboard_search, dashboard_replace)
    
    # Then we find the end of DashboardHub:
    #               setIsDayzCached={setIsDayzCached} setSteamLoginAction={setSteamLoginAction} showToast={showToast}
    #             />
    #           )}
    
    dashboard_end_search = """setSteamLoginAction={setSteamLoginAction} showToast={showToast}
            />
          )}"""
          
    dashboard_end_replace = """setSteamLoginAction={setSteamLoginAction} showToast={showToast}
              />
            </motion.div>
          )}"""
          
    content = content.replace(dashboard_end_search, dashboard_end_replace)
    
    # Now for Active Server View
    #           {/* ACTIVE SERVER VIEW */}
    #           {activeServer !== undefined && activeServerId !== null && (
    #             activeServer.game === 'DayZ' ? (
    
    active_search = """          {/* ACTIVE SERVER VIEW */}
          {activeServer !== undefined && activeServerId !== null && (
            activeServer.game === 'DayZ' ? ("""
            
    active_replace = """          {/* ACTIVE SERVER VIEW */}
          {activeServer !== undefined && activeServerId !== null && (
            <motion.div 
              key="active-server"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full flex flex-col overflow-hidden"
            >
              {activeServer.game === 'DayZ' ? ("""
              
    content = content.replace(active_search, active_replace)
    
    # And the end of Active Server View
    #               <MinecraftHub 
    #                 ...
    #                 statsHistory={statsHistory}
    #               />
    #             )
    #           )}
    
    active_end_search = """statsHistory={statsHistory}
              />
            )
          )}"""
          
    active_end_replace = """statsHistory={statsHistory}
                />
              )}
            </motion.div>
          )}
          </AnimatePresence>"""
          
    content = content.replace(active_end_search, active_end_replace)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

main()
