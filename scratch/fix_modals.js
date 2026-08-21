const fs = require('fs');

let createModalText = fs.readFileSync('src/renderer/src/components/modals/CreateServerModal.tsx', 'utf8');

const additionalStates = \`
    const [modpackSearch, setModpackSearch] = useState('')
    const [isSearchingPacks, setIsSearchingPacks] = useState(false)
    const [modpacks, setModpacks] = useState<any[]>([])
    const [selectedModpack, setSelectedModpack] = useState<any>(null)
    const [isModpackVersionMenuOpen, setIsModpackVersionMenuOpen] = useState(false)
    const [modpackVersionFilter, setModpackVersionFilter] = useState('')
    const [isModpackLoaderMenuOpen, setIsModpackLoaderMenuOpen] = useState(false)
    const [modpackLoaderFilter, setModpackLoaderFilter] = useState('')
\`;

// Add states
createModalText = createModalText.replace(/const \[downloadText, setDownloadText\] = useState\('Downloading server\.jar\.\.\.'\)/g, "const [downloadText, setDownloadText] = useState('Downloading server.jar...')\n" + additionalStates);

// Fix props definition
createModalText = createModalText.replace('export function CreateServerModal({ setShowCreateModal, setServers, servers }: any) {', "import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';\nexport function CreateServerModal({ setShowCreateModal, setServers, servers, activeGameHub, showToast, setSteamLoginAction, setShowSteamLoginModal }: any) {");

fs.writeFileSync('src/renderer/src/components/modals/CreateServerModal.tsx', createModalText);


let steamModalText = fs.readFileSync('src/renderer/src/components/modals/SteamLoginModal.tsx', 'utf8');
steamModalText = steamModalText.replace('export function SteamLoginModal({ setShowSteamLoginModal, showToast, activeGameHub }: any) {', "export function SteamLoginModal({ setShowSteamLoginModal, showToast, activeGameHub, steamLoginAction, steamUsername, setSteamUsername, steamPassword, setSteamPassword, isSteamGuardRequired, setIsSteamGuardRequired, steamGuardCode, setSteamGuardCode, setIsDayzCached, handleCreateServer, setIsCreatingServer }: any) {");

fs.writeFileSync('src/renderer/src/components/modals/SteamLoginModal.tsx', steamModalText);

