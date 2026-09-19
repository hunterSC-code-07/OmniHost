import { describe, expect, it } from 'vitest'
import { DiscordRateLimiter } from '@main/discord/DiscordRateLimiter'

describe('DiscordRateLimiter', () => {
  it('allows only the configured number of calls per window', () => {
    let now = 1_000
    const limiter = new DiscordRateLimiter(2, 60_000, () => now)

    expect(limiter.allow('user:command')).toBe(true)
    expect(limiter.allow('user:command')).toBe(true)
    expect(limiter.allow('user:command')).toBe(false)

    now += 60_000
    expect(limiter.allow('user:command')).toBe(true)
  })

  it('isolates keys and supports clearing state', () => {
    const limiter = new DiscordRateLimiter(1, 60_000, () => 1_000)

    expect(limiter.allow('one')).toBe(true)
    expect(limiter.allow('one')).toBe(false)
    expect(limiter.allow('two')).toBe(true)
    limiter.clear()
    expect(limiter.allow('one')).toBe(true)
  })
})
