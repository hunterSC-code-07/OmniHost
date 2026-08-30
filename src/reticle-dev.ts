// Dev-only. Imported automatically by @reticlehq/vite-plugin, so you do not need to import it.
// Self-guards on import.meta.env.DEV, so it is a no-op in a production build.
import { registerCapabilities, registerStore } from '@reticlehq/react';
import { useDayzFileStore } from './renderer/src/store/useDayzFileStore';
import { useDayzHubStore } from './renderer/src/store/useDayzHubStore';
import { useDayzModStore } from './renderer/src/store/useDayzModStore';
import { useLogStore } from './renderer/src/store/useLogStore';
import { useMinecraftHubStore } from './renderer/src/store/useMinecraftHubStore';
import { useModalStore } from './renderer/src/store/useModalStore';
import { usePlayerStore } from './renderer/src/store/usePlayerStore';
import { useServerStore } from './renderer/src/store/useServerStore';
import { useStatsStore } from './renderer/src/store/useStatsStore';
import { useSteamCredentialsStore } from './renderer/src/store/useSteamCredentialsStore';
import { useToastStore } from './renderer/src/store/useToastStore';
import { useUiStore } from './renderer/src/store/useUiStore';

if (import.meta.env.DEV) {
  // ── Start with ONE flow. ─────────────────────────────────────────────────────────────────────
  // You do not need to describe the whole app to get value, and trying to is the slow path. Register
  // the store your most important flow reads, and list the testids that flow touches. Add more later,
  // when a flow you actually replay needs them.
  //
  // Registering a store is the highest-value line in this file: it lets the agent check what the app
  // BELIEVES, not just what it rendered — the class of bug a screenshot cannot see. Pass the STORE,
  // not `() => store.getState()`: the store form wires `subscribe` too, so every mutation emits a
  // state diff; the getter form is read-only and silently produces empty diffs.
  registerStore('usedayzfile', useDayzFileStore);
  registerStore('usedayzhub', useDayzHubStore);
  registerStore('usedayzmod', useDayzModStore);
  registerStore('uselog', useLogStore);
  registerStore('useminecrafthub', useMinecraftHubStore);
  registerStore('usemodal', useModalStore);
  registerStore('useplayer', usePlayerStore);
  registerStore('useserver', useServerStore);
  registerStore('usestats', useStatsStore);
  registerStore('usesteamcredentials', useSteamCredentialsStore);
  registerStore('usetoast', useToastStore);
  registerStore('useui', useUiStore);

  registerCapabilities({
    testids: [], // none found; add data-testid to your key elements
    signals: [], // names you pass to reticle.signal()
    stores: ['usedayzfile', 'usedayzhub', 'usedayzmod', 'uselog', 'useminecrafthub', 'usemodal', 'useplayer', 'useserver', 'usestats', 'usesteamcredentials', 'usetoast', 'useui'], // the keys you registered above
  });
}
