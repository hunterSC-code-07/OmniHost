export interface DiscordServerResources {
  cpuPercent: number
  memoryMb: number
}

export function formatDiscordResources(resources: DiscordServerResources): string {
  const cpu = Math.max(0, resources.cpuPercent).toFixed(1)
  const memory = Math.max(0, resources.memoryMb).toFixed(1)
  return `CPU: ${cpu}%\nMemory: ${memory} MB`
}
