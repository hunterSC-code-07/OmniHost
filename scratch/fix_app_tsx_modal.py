import re

path = 'src/renderer/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the broken prop from DashboardHub
dashboard_broken = """                setShowCreateModal={setShowCreateModal}
                  onRedirectToCreateModpack={() => {
                    setInitialCreateServerType('CurseForge Modpack');
                    setShowCreateModal(true);
                  }}"""
dashboard_fixed = """                setShowCreateModal={setShowCreateModal}"""
content = content.replace(dashboard_broken, dashboard_fixed)

# 2. Remove the broken prop from CreateServerModal
modal_broken = """            <CreateServerModal 
              initialServerType={initialCreateServerType}
              setShowCreateModal={setShowCreateModal}
                  onRedirectToCreateModpack={() => {
                    setInitialCreateServerType('CurseForge Modpack');
                    setShowCreateModal(true);
                  }} 
              servers={servers}"""
modal_fixed = """            <CreateServerModal 
              initialServerType={initialCreateServerType}
              setShowCreateModal={setShowCreateModal} 
              servers={servers}"""
content = content.replace(modal_broken, modal_fixed)

# 3. Add onRedirectToCreateModpack to MinecraftHub
hub_search = """                  statsHistory={statsHistory}
                  />"""
hub_replace = """                  statsHistory={statsHistory}
                  onRedirectToCreateModpack={() => {
                    setInitialCreateServerType('CurseForge Modpack');
                    setActiveServerId(null);
                    setShowCreateModal(true);
                  }}
                  />"""
content = content.replace(hub_search, hub_replace)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
