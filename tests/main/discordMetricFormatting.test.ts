import { describe, expect, it } from 'vitest'
import { formatDiscordResources } from '@main/discord/DiscordMetricFormatting'

describe('Discord resource formatting', () => {
  it('formats CPU and memory consistently', () => {
    expect(formatDiscordResources({ cpuPercent: 12.345, memoryMb: 512.4 })).toBe(
      'CPU: 12.3%\nMemory: 512.4 MB'
    )
  })

  it('does not display negative metrics', () => {
    expect(formatDiscordResources({ cpuPercent: -1, memoryMb: -2 })).toBe(
      'CPU: 0.0%\nMemory: 0.0 MB'
    )
  })
})
