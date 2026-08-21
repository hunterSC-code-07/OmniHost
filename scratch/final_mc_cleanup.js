const fs = require('fs');

let content = fs.readFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', 'utf8');

// Add showToast to props
content = content.replace('servers }: any) {', 'servers, showToast }: any) {');

// Add back local states for download text/progress
const statesToAdd = `
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadText, setDownloadText] = useState('');
  const [showModpackPrompt, setShowModpackPrompt] = useState(false);
`;
content = content.replace(/const \[activeTab, setActiveTab\] = useState[^\n]+\n/, `const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'options' | 'players' | 'software' | 'mods' | 'files' | 'backups'>('overview');\n${statesToAdd}`);

// Remove initial data fetching hook
content = content.replace(/useEffect\(\(\) => \{\n\s*const fetchInitialData = async \(\) => \{[\s\S]*?^  \}, \[\]\)\n/m, '');

// Fix duplicate activeServerId in props/state
content = content.replace(/const \[activeServerId, setActiveServerId\] = useState[^\n]+\n/, '');

// Remove cache size polling
content = content.replace(/const fetchCacheSize = async \(\) => \{[\s\S]*?^  \}\n  fetchCacheSize\(\)\n  \n  \/\/ Poll cache size[\s\S]*?^  const cacheInterval = setInterval\(fetchCacheSize, 3000\)[\s\S]*?^  \/\/ --- LISTENER 1/m, '// --- LISTENER 1');

// Remove unused imports
content = content.replace(/import \{ DayzHub \} from '.*?';\n/, '');

fs.writeFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', content);
console.log('Final cleanup applied.');
