export class DiscordRateLimiter {
  private readonly timestamps = new Map<string, number[]>()

  constructor(
    private readonly maxUses = 10,
    private readonly windowMs = 60_000,
    private readonly now: () => number = () => Date.now()
  ) {}

  allow(key: string): boolean {
    const current = this.now()
    const recent = (this.timestamps.get(key) ?? []).filter(
      (timestamp) => current - timestamp < this.windowMs
    )
    if (recent.length >= this.maxUses) {
      this.timestamps.set(key, recent)
      return false
    }
    recent.push(current)
    this.timestamps.set(key, recent)
    return true
  }

  clear(): void {
    this.timestamps.clear()
  }
}
