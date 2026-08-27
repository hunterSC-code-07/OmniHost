import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Electron window.api
Object.defineProperty(window, 'api', {
  value: {
    send: vi.fn(),
    receive: vi.fn(),
    invoke: vi.fn(),
  },
  writable: true,
})
