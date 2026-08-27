import React from 'react';
import { useModalStore } from '../../../../../store/useModalStore';
import { useSteamCredentialsStore } from '../../../../../store/useSteamCredentialsStore';
import { useDayzModDependencies } from '../../../../../hooks/useDayzModDependencies';
import { useDayzInstalledMods } from '../../../../../hooks/useDayzInstalledMods';

export const DayzSteamCredentialsPanel: React.FC = () => {
  const { steamCreds, setSteamCreds, rememberMe, setRememberMe, setShowCreds, saveCredentials } = useSteamCredentialsStore();
  const { mods, loadInstalledMods, activeServerId } = useDayzInstalledMods();
  const { handleInstallDependencies } = useDayzModDependencies(activeServerId, loadInstalledMods, mods);

  return (
    <div className="p-4 bg-surface-container-high border border-primary/30 mx-4 my-2 rounded-xl flex flex-col gap-3 shadow-lg">
      <div className="flex justify-between items-center">
        <span className="text-on-surface font-bold text-primary">Steam Login Required</span>
        <button onClick={() => setShowCreds(false)} className="text-xs text-on-surface-variant hover:text-white">Close</button>
      </div>
      <span className="text-on-surface-variant text-sm">
        Installing Workshop dependencies requires a Steam account that owns the game.
      </span>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          placeholder="Username"
          value={steamCreds.username}
          onChange={e => setSteamCreds({ ...steamCreds, username: e.target.value })}
          className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[150px] text-on-surface outline-none focus:border-primary/50"
        />
        <input
          type="password"
          placeholder="Password"
          value={steamCreds.password}
          onChange={e => setSteamCreds({ ...steamCreds, password: e.target.value })}
          className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[150px] text-on-surface outline-none focus:border-primary/50"
        />
        <input
          type="text"
          placeholder="Steam Guard Code (if prompted)"
          value={steamCreds.steamGuard}
          onChange={e => setSteamCreds({ ...steamCreds, steamGuard: e.target.value })}
          className="bg-surface-container-highest border border-white/10 rounded px-3 py-2 text-sm w-48 text-on-surface outline-none focus:border-primary/50"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="rounded border-white/10 bg-surface-container-highest text-primary focus:ring-primary focus:ring-offset-surface-container-high"
            />
            Remember Me
          </label>
          <button
            onClick={() => saveCredentials(
              () => handleInstallDependencies(), 
              (msg) => useModalStore.getState().openDayzInfoModal(msg)
            )}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 text-sm font-bold shadow transition-colors"
          >
            Continue Installation
          </button>
        </div>
      </div>
    </div>
  );
};
