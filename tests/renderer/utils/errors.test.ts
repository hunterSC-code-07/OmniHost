import { describe, expect, it } from 'vitest'

import { getDisplayErrorMessage } from '@renderer/utils/errors'

describe('getDisplayErrorMessage', () => {
  it('removes Electron IPC plumbing from actionable backend errors', () => {
    const error = new Error(
      "Error invoking remote method 'update-steam-cache': SteamCmdExitError: Insufficient disk space for Steam App 2278520."
    )

    expect(getDisplayErrorMessage(error)).toBe('Insufficient disk space for Steam App 2278520.')
  })

  it('preserves ordinary error messages', () => {
    expect(getDisplayErrorMessage(new Error('Network unavailable'))).toBe('Network unavailable')
  })
})
