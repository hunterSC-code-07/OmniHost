import { create } from 'zustand'

const LEGACY_CREDENTIALS_KEY = 'omnihost_steam_creds'
const USERNAME_KEY = 'omnihost_steam_username'

function loadRememberedUsername(): string {
  const rememberedUsername = localStorage.getItem(USERNAME_KEY)
  if (rememberedUsername) return rememberedUsername

  // Migrate legacy data once, retaining the username but deleting the password.
  const legacyCredentials = localStorage.getItem(LEGACY_CREDENTIALS_KEY)
  if (!legacyCredentials) return import.meta.env.VITE_STEAM_USERNAME || ''

  try {
    const parsed = JSON.parse(atob(legacyCredentials))
    const username = typeof parsed.username === 'string' ? parsed.username : ''
    if (username) localStorage.setItem(USERNAME_KEY, username)
    return username
  } catch {
    return ''
  } finally {
    localStorage.removeItem(LEGACY_CREDENTIALS_KEY)
  }
}

const rememberedUsername = loadRememberedUsername()

interface SteamCredentialsStore {
  steamCreds: { username: string; password?: string; steamGuard?: string }
  rememberMe: boolean
  showCreds: boolean
  setSteamCreds: (creds: { username: string; password?: string; steamGuard?: string }) => void
  setRememberMe: (remember: boolean) => void
  setShowCreds: (show: boolean) => void
  saveCredentials: (onSuccess: () => void, onError: (msg: string) => void) => void
}

export const useSteamCredentialsStore = create<SteamCredentialsStore>((set, get) => ({
  steamCreds: (() => {
    return { username: rememberedUsername, password: '' }
  })(),
  rememberMe: !!rememberedUsername,
  showCreds: false,
  setSteamCreds: (creds) => set({ steamCreds: creds }),
  setRememberMe: (remember) => set({ rememberMe: remember }),
  setShowCreds: (show) => set({ showCreds: show }),
  saveCredentials: (onSuccess, onError) => {
    const state = get()
    if (state.steamCreds.username) {
      if (state.rememberMe) {
        localStorage.setItem(USERNAME_KEY, state.steamCreds.username)
      } else {
        localStorage.removeItem(USERNAME_KEY)
      }
      localStorage.removeItem(LEGACY_CREDENTIALS_KEY)
      onSuccess()
    } else {
      onError('Username is required.')
    }
  }
}))
