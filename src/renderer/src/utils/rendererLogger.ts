export function setupRendererLogger() {
  window.onerror = function (message, source, lineno, colno, error) {
    if (window.api?.log?.error) {
      window.api.log.error('Uncaught Exception:', message, 'at', source, `${lineno}:${colno}`, error?.stack);
    }
    return false;
  };

  window.addEventListener('unhandledrejection', function (event) {
    if (window.api?.log?.error) {
      window.api.log.error('Unhandled Promise Rejection:', event.reason);
    }
  });
  
  // Override console methods to also forward to IPC log (optional, but good for tracking)
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  console.error = (...args) => {
    originalConsoleError(...args);
    if (window.api?.log?.error) window.api.log.error(...args);
  };

  console.warn = (...args) => {
    originalConsoleWarn(...args);
    if (window.api?.log?.warn) window.api.log.warn(...args);
  };
  
  console.info = (...args) => {
    originalConsoleInfo(...args);
    if (window.api?.log?.info) window.api.log.info(...args);
  };
}
