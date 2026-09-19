export interface DiscordScheduledAction {
  id: number
  serverId: number
  action: 'start' | 'stop' | 'backup'
  runAt: number
  createdBy: string
  keep?: number
}

export interface DiscordBotSettings {
  token: string
  autoStart: boolean
  enabled: boolean
  guildId: string
  defaultChannelId: string
  announcementChannelId: string
  dashboardMessageId: string
  allowedRoleIds: string[]
  allowedUserIds: string[]
  adminRoleIds: string[]
  announcePublicIp: boolean
  announceLanIp: boolean
  announceRadminIp: boolean
  announceServerEvents: boolean
  schedules: DiscordScheduledAction[]
}
