path = 'src/main/ipc/SystemIpc.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if "import { getServers }" not in content:
    content = content.replace("import { RadminVpnAdapter } from '../adapters/RadminVpnAdapter'", "import { RadminVpnAdapter } from '../adapters/RadminVpnAdapter'\nimport { getServers } from '../db'")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
