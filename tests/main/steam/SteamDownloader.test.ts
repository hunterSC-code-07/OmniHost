import { describe, expect, it } from 'vitest'

import {
  ENSHROUDED_DEDICATED_SERVER_APP_ID,
  isSuccessfulSteamCmdExit,
  shouldUseAnonymousSteamLogin
} from '@main/steam/SteamDownloader'

describe('SteamDownloader result handling', () => {
  it('uses anonymous SteamCMD login for the Enshrouded dedicated server', () => {
    expect(shouldUseAnonymousSteamLogin(ENSHROUDED_DEDICATED_SERVER_APP_ID)).toBe(true)
    expect(shouldUseAnonymousSteamLogin(223350)).toBe(false)
  })

  it('accepts code 8 only when the expected server files are verified in cache', () => {
    expect(isSuccessfulSteamCmdExit(8, true)).toBe(true)
    expect(isSuccessfulSteamCmdExit(8, false)).toBe(false)
  })

  it('preserves the existing successful SteamCMD exit codes', () => {
    expect(isSuccessfulSteamCmdExit(0, false)).toBe(true)
    expect(isSuccessfulSteamCmdExit(7, false)).toBe(true)
  })
})
