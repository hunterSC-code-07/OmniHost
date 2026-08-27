import log from 'electron-log/main';
import { app } from 'electron';

export function initializeLogger() {
  // Initialize electron-log for the main process
  log.initialize();

  // Set minimum logging levels
  log.transports.file.level = 'info';
  log.transports.console.level = 'debug';

  // Automatically catch unhandled exceptions and unhandled promise rejections
  log.errorHandler.startCatching();

  // Override standard console object so all existing console.logs are captured
  Object.assign(console, log.functions);

  log.info(`[Logger] Initialized centralized logging for OmniHost (v${app.getVersion()})`);
  
  return log;
}

export default log;
