import { describe, expect, it } from 'vitest'

import {
  ENSHROUDED_DEDICATED_SERVER_APP_ID,
  isSuccessfulSteamCmdExit,
  parseIncompleteManifestRequirement,
  parseSteamDiskSpaceFailure,
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

  it('extracts the real disk-space failure hidden behind SteamCMD code 8', () => {
    expect(
      parseSteamDiskSpaceFailure(
        'AppID 2278520 update canceled : Failed to preallocate (Not enough disk space) "8.16 GB"'
      )
    ).toEqual({
      requiredLabel: '8.16 GB',
      requiredBytes: Math.ceil(8.16 * 1024 ** 3)
    })
    expect(parseSteamDiskSpaceFailure('[----] Verifying installation...')).toBeNull()
  })

  it('preflights the remaining staging bytes from an incomplete manifest', () => {
    const manifest = `"AppState"
{
  "SizeOnDisk" "0"
  "BytesToStage" "8834038765"
  "BytesStaged" "51612560"
}`

    expect(parseIncompleteManifestRequirement(manifest)).toBe(8_782_426_205)
    expect(
      parseIncompleteManifestRequirement(
        manifest.replace('"SizeOnDisk" "0"', '"SizeOnDisk" "8834038765"')
      )
    ).toBeNull()
  })
})
