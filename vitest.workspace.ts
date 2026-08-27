import { defineWorkspace } from 'vitest/config'
import { resolve } from 'path'

export default defineWorkspace([
  {
    test: {
      name: 'main',
      include: ['tests/main/**/*.test.ts'],
      environment: 'node',
      alias: {
        '@main': resolve('src/main')
      }
    },
  },
  {
    test: {
      name: 'renderer',
      include: ['tests/renderer/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['tests/renderer/setupTests.ts'],
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
  },
])
