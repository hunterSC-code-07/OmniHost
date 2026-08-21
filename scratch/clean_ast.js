const fs = require('fs');
let code = fs.readFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', 'utf8');

// The file currently has a corrupted block between line 140-160
// We need to carefully remove the bad block.

// 1. Remove the broken fetchLoaderVersions duplicate blocks
code = code.replace(/useEffect\(\(\) => \{\s*if \(activeTab === 'software'.*?fetchLoaderVersions[\s\S]*?\}, \[activeTab, editingSoftwareType, editingSoftwareVersion, serverMeta\]\);/g, '');

// 2. Remove the orphaned hook ending `}, [activeServerId, activeTab, playerListType])`
// and any orphaned `useEffect(() => { let interval: ReturnType<typeof setInterval>;`
code = code.replace(/\},\s*\[activeServerId, activeTab, playerListType\]\)\s*useEffect\(\(\) => \{\s*let interval: ReturnType<typeof setInterval>;/g, '');

// Actually, this is too fragile. Let's just restore from git? No, it's untracked.
// Let's print out the exact lines around 130-160 to see what we have to replace.
const lines = code.split('\\n');
for (let i = 120; i < 160; i++) {
  console.log(i + ': ' + lines[i]);
}
