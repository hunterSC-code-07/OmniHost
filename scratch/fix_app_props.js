const fs = require('fs');
let text = fs.readFileSync('src/renderer/src/App.tsx', 'utf8');

const states = `
  const [steamLoginAction, setSteamLoginAction] = useState<'create' | 'cache'>('create')
  const [steamUsername, setSteamUsername] = useState('')
  const [steamPassword, setSteamPassword] = useState('')
  const [steamGuardCode, setSteamGuardCode] = useState('')
  const [isSteamGuardRequired, setIsSteamGuardRequired] = useState(false)
  const [isDayzCached, setIsDayzCached] = useState<boolean | null>(null)
`;

text = text.replace('const [showSteamLoginModal, setShowSteamLoginModal] = useState(false)', 'const [showSteamLoginModal, setShowSteamLoginModal] = useState(false)' + states);

text = text.replace('<CreateServerModal setShowCreateModal={setShowCreateModal} servers={servers} setServers={setServers} />', '<CreateServerModal setShowCreateModal={setShowCreateModal} servers={servers} setServers={setServers} activeGameHub={activeGameHub} showToast={showToast} setSteamLoginAction={setSteamLoginAction} setShowSteamLoginModal={setShowSteamLoginModal} />');

text = text.replace('<SteamLoginModal setShowSteamLoginModal={setShowSteamLoginModal} showToast={showToast} activeGameHub={activeGameHub} />', '<SteamLoginModal setShowSteamLoginModal={setShowSteamLoginModal} showToast={showToast} activeGameHub={activeGameHub} steamLoginAction={steamLoginAction} steamUsername={steamUsername} setSteamUsername={setSteamUsername} steamPassword={steamPassword} setSteamPassword={setSteamPassword} isSteamGuardRequired={isSteamGuardRequired} setIsSteamGuardRequired={setIsSteamGuardRequired} steamGuardCode={steamGuardCode} setSteamGuardCode={setSteamGuardCode} setIsDayzCached={setIsDayzCached} isDayzCached={isDayzCached} />');

text = text.replace('isGameSupported={isGameSupported}', 'isGameSupported={isGameSupported} isDayzCached={isDayzCached} setSteamLoginAction={setSteamLoginAction} showToast={showToast}');

fs.writeFileSync('src/renderer/src/App.tsx', text);
