const fs = require('fs');
let s1 = fs.readFileSync('src/renderer/src/components/hubs/DayzHub/tabs/DayzInstalledModsTab.tsx', 'utf8');

// Replace top logic conflict
s1 = s1.replace(/<<<<<<< HEAD[\s\S]*?=======\n(export const DayzInstalledModsTab: React\.FC = \(\) => \{\n  const \{[\s\S]*?\n  \} = useDayzWorkshop\(\);\n)>>>>>>> [^\n]+\n/, '$1');

// Replace middle logic conflict (my version removed these functions, so I want to delete the whole conflict block)
s1 = s1.replace(/<<<<<<< HEAD[\s\S]*?=======\n>>>>>>> [^\n]+\n/, '');

// Replace bottom conflict in JSX
s1 = s1.replace(/<<<<<<< HEAD\n\s*if \(removePendingDownload\)[^\n]+\n=======\n(\s*if \(removePendingDownload && activeServerId\)[^\n]+\n)>>>>>>> [^\n]+\n/, '$1');

fs.writeFileSync('src/renderer/src/components/hubs/DayzHub/tabs/DayzInstalledModsTab.tsx', s1);

let s2 = fs.readFileSync('src/renderer/src/components/hubs/DayzHub/tabs/DayzModsTab.tsx', 'utf8');

// Resolve top logic conflict
s2 = s2.replace(/<<<<<<< HEAD[\s\S]*?=======\n(  const \{\n    searchQuery, setSearchQuery,[\s\S]*?  \} = useDayzMods\(onNavigateToInstalled\);\n)>>>>>>> [^\n]+\n/, '$1');

// Resolve modTypes conflict
s2 = s2.replace(/<<<<<<< HEAD[\s\S]*?=======\n(  const modTypes = \[[^\]]*\];\n)>>>>>>> [^\n]+\n/, '$1');

// The bottom conflict for handleInstall, handleUninstall, handleBrowseWorkshop, handleImportWorkshop is huge
// My commit removed all these functions because they're in the hook.
s2 = s2.replace(/<<<<<<< HEAD[\s\S]*?=======\n>>>>>>> [^\n]+\n/, ''); // If there is a blank block from my commit, delete the conflict

fs.writeFileSync('src/renderer/src/components/hubs/DayzHub/tabs/DayzModsTab.tsx', s2);

console.log('Resolved conflicts');
