import { app } from 'electron';
import { setupAppPreload, setupAppPostload } from './setup/app';
import { setupWindowLifecycle } from './setup/window';
import { registerAllIpcs } from './setup/ipc';
import { registerSevenDaysToDieModDownloader } from './7dtd/SevenDaysToDieModDownloader';

// 1. Initial application setup (paths, logger, env, switches)
setupAppPreload();

// 2. Setup that requires app to be ready
app.whenReady().then(() => {
  setupAppPostload();
  
  // Register all IPCs and systems
  registerAllIpcs();
  registerSevenDaysToDieModDownloader();
  
  // Setup window creation and lifecycle events
  setupWindowLifecycle();
});

// 3. Handle app termination
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
