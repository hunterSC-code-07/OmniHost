import { useState } from 'react';

export const useSteamCredentials = () => {
  const [steamCreds, setSteamCreds] = useState(() => {
    try {
      const saved = localStorage.getItem('omnihost_steam_creds');
      return saved ? JSON.parse(atob(saved)) : { username: '', password: '', steamGuard: '' };
    } catch {
      return { username: '', password: '', steamGuard: '' };
    }
  });
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('omnihost_steam_creds'));
  const [showCreds, setShowCreds] = useState(false);

  const saveCredentials = (onSuccess: () => void, onError: (msg: string) => void) => {
    if (steamCreds.username && steamCreds.password) {
      if (rememberMe) {
        localStorage.setItem(
          'omnihost_steam_creds', 
          btoa(JSON.stringify({ username: steamCreds.username, password: steamCreds.password, steamGuard: '' }))
        );
      } else {
        localStorage.removeItem('omnihost_steam_creds');
      }
      onSuccess();
    } else {
      onError('Username and password are required.');
    }
  };

  return {
    steamCreds,
    setSteamCreds,
    rememberMe,
    setRememberMe,
    showCreds,
    setShowCreds,
    saveCredentials
  };
};
