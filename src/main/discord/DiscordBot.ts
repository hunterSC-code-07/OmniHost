import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle
} from 'discord.js'
import { discordBotSettings } from './DiscordBotSettings'
import { discordConnectionInfo } from './DiscordConnectionInfoService'
import { discordBackupService } from './DiscordBackupService'
import { discordAuditService } from './DiscordAuditService'
import { DiscordRateLimiter } from './DiscordRateLimiter'
import { formatDiscordResources } from './DiscordMetricFormatting'
import type { ServerLifecycleEvent, ServerLifecycleMethods } from '../ipc/ServerLifecycleController'

type DiscordServer = {
  id: number
  name?: string
  game?: string
  status?: string
  port?: number
  onlinePlayers?: string[]
}

export class DiscordBot {
  private client: Client | null = null
  private lifecycleMethods: ServerLifecycleMethods | null = null
  private pollTimer: NodeJS.Timeout | null = null
  private scheduleTimer: NodeJS.Timeout | null = null
  private unsubscribeLifecycle: (() => void) | null = null
  private lastStatuses = new Map<number, string>()
  private lastAddresses = new Map<number, string>()
  private readonly rateLimiter = new DiscordRateLimiter()

  init(lifecycleMethods: ServerLifecycleMethods): void {
    this.lifecycleMethods = lifecycleMethods
    this.unsubscribeLifecycle?.()
    this.unsubscribeLifecycle = lifecycleMethods.onEvent(
      (event) => void this.handleLifecycleEvent(event)
    )
    const settings = discordBotSettings.readSettings()
    if (settings.enabled && settings.autoStart && settings.token) {
      this.start(settings.token).catch((error) =>
        console.error('[DiscordBot] Auto-start failed:', error)
      )
    }
  }

  async start(token: string): Promise<void> {
    if (this.client) await this.stop()
    const safeToken = this.normalizeToken(token)
    if (!safeToken) throw new Error('Discord Bot Token is empty')

    this.client = new Client({ intents: [GatewayIntentBits.Guilds] })
    this.client.once('ready', async () => {
      console.log(`[DiscordBot] Logged in as ${this.client?.user?.tag}`)
      await this.registerCommands(safeToken)
      this.startStatusPolling()
      this.startScheduleRunner()
    })
    this.client.on('interactionCreate', (interaction) => {
      if (interaction.isChatInputCommand()) void this.handleInteraction(interaction)
      else if (interaction.isButton()) void this.handleButtonInteraction(interaction)
    })
    this.client.on('error', (error) => console.error('[DiscordBot] Client error:', error))

    try {
      await this.client.login(safeToken)
    } catch (error: unknown) {
      this.client.destroy()
      this.client = null
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to login with Discord token. Reason: ${message}`)
    }
  }

  async stop(): Promise<void> {
    if (this.pollTimer) clearInterval(this.pollTimer)
    if (this.scheduleTimer) clearInterval(this.scheduleTimer)
    this.pollTimer = null
    this.scheduleTimer = null
    this.lastStatuses.clear()
    this.lastAddresses.clear()
    if (this.client) {
      this.client.destroy()
      this.client = null
      console.log('[DiscordBot] Disconnected')
    }
  }

  isRunning(): boolean {
    return this.client?.isReady() ?? false
  }

  async refreshCommands(): Promise<void> {
    const settings = discordBotSettings.readSettings()
    if (!this.client?.user || !settings.token) return
    await this.registerCommands(this.normalizeToken(settings.token))
  }

  getGuilds(): Array<{ id: string; name: string }> {
    if (!this.client?.isReady()) return []
    return this.client.guilds.cache.map((guild) => ({ id: guild.id, name: guild.name }))
  }

  async getTextChannels(guildId: string): Promise<Array<{ id: string; name: string }>> {
    if (!this.client?.isReady()) return []
    const guild = await this.client.guilds.fetch(guildId).catch(() => null)
    if (!guild) return []
    const channels = await guild.channels.fetch()
    return channels
      .filter(
        (channel): channel is NonNullable<typeof channel> => !!channel && channel.isTextBased()
      )
      .map((channel) => ({
        id: channel.id,
        name: 'name' in channel && typeof channel.name === 'string' ? channel.name : channel.id
      }))
  }

  private normalizeToken(token: string): string {
    let normalized = token.trim()
    if (
      (normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'"))
    ) {
      normalized = normalized.slice(1, -1)
    }
    return normalized
  }

  private async registerCommands(token: string): Promise<void> {
    if (!this.client?.user) return
    const commands = [
      { name: 'list', description: 'List all OmniHost servers and their status' },
      { name: 'servers', description: 'Show a rich server dashboard' },
      { name: 'start', description: 'Start a server', options: [this.serverIdOption()] },
      { name: 'stop', description: 'Stop a server', options: [this.serverIdOption()] },
      { name: 'restart', description: 'Restart a server', options: [this.serverIdOption()] },
      {
        name: 'status',
        description: 'Check the live status of a server',
        options: [this.serverIdOption()]
      },
      { name: 'players', description: 'List online players', options: [this.serverIdOption()] },
      {
        name: 'resources',
        description: 'Show live CPU and memory usage',
        options: [this.serverIdOption()]
      },
      {
        name: 'inventory',
        description: 'Inspect a player inventory when supported',
        options: [
          this.serverIdOption(),
          { name: 'player', type: 3, description: 'Player name', required: true, max_length: 32 }
        ]
      },
      {
        name: 'player-stats',
        description: 'Inspect player stats when supported',
        options: [
          this.serverIdOption(),
          { name: 'player', type: 3, description: 'Player name', required: true, max_length: 32 }
        ]
      },
      {
        name: 'kick',
        description: 'Kick a player from a Minecraft server',
        options: [
          this.serverIdOption(),
          { name: 'player', type: 3, description: 'Player name', required: true, max_length: 32 }
        ]
      },
      {
        name: 'ban',
        description: 'Ban a player from a Minecraft server',
        options: [
          this.serverIdOption(),
          { name: 'player', type: 3, description: 'Player name', required: true, max_length: 32 }
        ]
      },
      {
        name: 'unban',
        description: 'Unban a player from a Minecraft server',
        options: [
          this.serverIdOption(),
          { name: 'player', type: 3, description: 'Player name', required: true, max_length: 32 }
        ]
      },
      {
        name: 'logs',
        description: 'Show recent server log lines',
        options: [
          this.serverIdOption(),
          {
            name: 'lines',
            type: 4,
            description: 'Number of lines (1-25)',
            required: false,
            min_value: 1,
            max_value: 25
          }
        ]
      },
      {
        name: 'console',
        description: 'Send an administrator console command',
        options: [
          this.serverIdOption(),
          {
            name: 'command',
            type: 3,
            description: 'Command to send',
            required: true,
            max_length: 300
          }
        ]
      },
      {
        name: 'broadcast',
        description: 'Broadcast a message to players',
        options: [
          this.serverIdOption(),
          {
            name: 'message',
            type: 3,
            description: 'Message to broadcast',
            required: true,
            max_length: 300
          }
        ]
      },
      {
        name: 'backup-create',
        description: 'Create a server world backup',
        options: [
          this.serverIdOption(),
          {
            name: 'name',
            type: 3,
            description: 'Optional backup name',
            required: false,
            max_length: 40
          }
        ]
      },
      {
        name: 'backup-list',
        description: 'List recent server backups',
        options: [this.serverIdOption()]
      },
      {
        name: 'backup-restore',
        description: 'Restore a server world backup',
        options: [
          this.serverIdOption(),
          {
            name: 'file',
            type: 3,
            description: 'Backup filename',
            required: true,
            max_length: 200
          },
          {
            name: 'confirm',
            type: 5,
            description: 'Confirm replacing current world data',
            required: true
          }
        ]
      },
      {
        name: 'backup-prune',
        description: 'Keep only the newest backups',
        options: [
          this.serverIdOption(),
          {
            name: 'keep',
            type: 4,
            description: 'Number to keep (1-100)',
            required: true,
            min_value: 1,
            max_value: 100
          }
        ]
      },
      {
        name: 'schedule-start',
        description: 'Schedule a server start using a Unix timestamp',
        options: [
          this.serverIdOption(),
          { name: 'at', type: 4, description: 'Unix timestamp in seconds', required: true }
        ]
      },
      {
        name: 'schedule-stop',
        description: 'Schedule a server stop using a Unix timestamp',
        options: [
          this.serverIdOption(),
          { name: 'at', type: 4, description: 'Unix timestamp in seconds', required: true }
        ]
      },
      {
        name: 'schedule-backup',
        description: 'Schedule a backup using a Unix timestamp',
        options: [
          this.serverIdOption(),
          { name: 'at', type: 4, description: 'Unix timestamp in seconds', required: true },
          {
            name: 'keep',
            type: 4,
            description: 'Number of backups to keep (1-100)',
            required: true,
            min_value: 1,
            max_value: 100
          }
        ]
      },
      { name: 'schedule-list', description: 'List scheduled server actions' },
      {
        name: 'schedule-cancel',
        description: 'Cancel a scheduled action',
        options: [{ name: 'schedule', type: 4, description: 'Schedule ID', required: true }]
      },
      {
        name: 'audit',
        description: 'View recent Discord control actions',
        options: [
          {
            name: 'lines',
            type: 4,
            description: 'Number of entries (1-25)',
            required: false,
            min_value: 1,
            max_value: 25
          }
        ]
      },
      {
        name: 'address',
        description: 'Show LAN, Radmin VPN, and public connection addresses',
        options: [this.serverIdOption()]
      }
    ]
    const rest = new REST({ version: '10' }).setToken(token)
    const settings = discordBotSettings.readSettings()
    try {
      if (settings.guildId) {
        await rest.put(Routes.applicationGuildCommands(this.client.user.id, settings.guildId), {
          body: commands
        })
        // Remove the old globally registered copies. Discord clients can otherwise keep
        // presenting a stale global command definition after switching to guild mode.
        await rest.put(Routes.applicationCommands(this.client.user.id), { body: [] })
      } else {
        await rest.put(Routes.applicationCommands(this.client.user.id), { body: commands })
      }
      console.log('[DiscordBot] Successfully registered slash commands.')
    } catch (error) {
      console.error('[DiscordBot] Failed to register slash commands:', error)
    }
  }

  private serverIdOption(): { name: string; type: number; description: string; required: boolean } {
    return { name: 'id', type: 4, description: 'The ID of the server', required: true }
  }

  private getServers(): DiscordServer[] {
    return (this.lifecycleMethods?.getServerList() ?? []) as DiscordServer[]
  }

  private findServer(interaction: ChatInputCommandInteraction): DiscordServer | undefined {
    const id = interaction.options.getInteger('id', true)
    return this.getServers().find((server) => server.id === id)
  }

  private hasPermission(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    admin = false
  ): boolean {
    const settings = discordBotSettings.readSettings()
    if (settings.guildId && interaction.guildId !== settings.guildId) return false
    if (!interaction.guildId) return false

    const member = interaction.member
    const roleIds =
      member && 'roles' in member && member.roles && 'cache' in member.roles
        ? [...member.roles.cache.keys()]
        : []
    if (settings.allowedUserIds.length || settings.allowedRoleIds.length) {
      const allowed =
        settings.allowedUserIds.includes(interaction.user.id) ||
        roleIds.some((roleId) => settings.allowedRoleIds.includes(roleId))
      if (!allowed) return false
    }
    if (
      admin &&
      settings.adminRoleIds.length > 0 &&
      !roleIds.some((roleId) => settings.adminRoleIds.includes(roleId))
    ) {
      return false
    }
    return true
  }

  private async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.lifecycleMethods) {
      await interaction.reply({
        content: 'Server lifecycle methods are not initialized.',
        ephemeral: true
      })
      return
    }
    const adminCommand = [
      'stop',
      'restart',
      'console',
      'broadcast',
      'backup-create',
      'backup-restore',
      'backup-prune',
      'kick',
      'ban',
      'unban',
      'audit',
      'schedule-start',
      'schedule-stop',
      'schedule-backup',
      'schedule-cancel'
    ].includes(interaction.commandName)
    if (!this.checkRateLimit(interaction.user.id, interaction.commandName)) {
      discordAuditService.record({
        at: new Date().toISOString(),
        userId: interaction.user.id,
        username: interaction.user.tag,
        command: interaction.commandName,
        result: 'denied',
        detail: 'rate limit'
      })
      await interaction.reply({
        content: 'You are using commands too quickly. Try again shortly.',
        ephemeral: true
      })
      return
    }
    if (!this.hasPermission(interaction, adminCommand)) {
      discordAuditService.record({
        at: new Date().toISOString(),
        userId: interaction.user.id,
        username: interaction.user.tag,
        command: interaction.commandName,
        result: 'denied',
        detail: 'permission'
      })
      await interaction.reply({
        content: 'You are not authorized to use this bot.',
        ephemeral: true
      })
      return
    }

    try {
      const command = interaction.commandName
      if (command === 'list' || command === 'servers') {
        await interaction.reply({ embeds: [this.createServerListEmbed(this.getServers())] })
        return
      }
      if (command === 'schedule-list') {
        const schedules = discordBotSettings.readSettings().schedules
        await interaction.reply({
          content: schedules.length
            ? schedules
                .map(
                  (schedule) =>
                    `#${schedule.id} • ${schedule.action} server ${schedule.serverId} • <t:${Math.floor(schedule.runAt / 1000)}:F>`
                )
                .join('\n')
            : 'No scheduled actions.',
          ephemeral: true
        })
        return
      }
      if (command === 'schedule-cancel') {
        const scheduleId = interaction.options.getInteger('schedule', true)
        const settings = discordBotSettings.readSettings()
        const remaining = settings.schedules.filter((schedule) => schedule.id !== scheduleId)
        if (remaining.length === settings.schedules.length) {
          await interaction.reply({
            content: `Schedule #${scheduleId} was not found.`,
            ephemeral: true
          })
          return
        }
        discordBotSettings.writeSettings({ ...settings, schedules: remaining })
        await interaction.reply({ content: `Cancelled schedule #${scheduleId}.`, ephemeral: true })
        return
      }
      if (command === 'audit') {
        const lines = Math.min(Math.max(interaction.options.getInteger('lines') ?? 10, 1), 25)
        const entries = discordAuditService.recent(lines)
        const output = entries.length
          ? entries
              .map(
                (entry) =>
                  `${entry.at} ${entry.username} ${entry.command} ${entry.result}${entry.detail ? ` (${entry.detail})` : ''}`
              )
              .join('\n')
          : 'No audit entries yet.'
        await interaction.reply({ content: this.formatCodeBlock(output), ephemeral: true })
        return
      }
      const server = this.findServer(interaction)
      if (!server) {
        await interaction.reply({ content: 'That server was not found.', ephemeral: true })
        return
      }
      if (command === 'status') {
        await interaction.reply({ embeds: [this.createStatusEmbed(server)] })
      } else if (command === 'players') {
        const players = server.onlinePlayers ?? []
        await interaction.reply({
          content: players.length
            ? `Online players: ${players.join(', ')}`
            : 'No players are online.',
          ephemeral: true
        })
      } else if (command === 'resources') {
        const resources = await this.lifecycleMethods.getServerResources(server.id)
        await interaction.reply({
          content: resources
            ? this.formatCodeBlock(formatDiscordResources(resources))
            : 'The server is not currently running.',
          ephemeral: true
        })
      } else if (command === 'inventory' || command === 'player-stats') {
        const player = interaction.options.getString('player', true).trim()
        const data =
          command === 'inventory'
            ? await this.lifecycleMethods.getPlayerInventory(server.id, player)
            : await this.lifecycleMethods.getPlayerStats(server.id, player)
        if (data === null || data === undefined) {
          await interaction.reply({
            content: 'This server or game does not support that player inspection command.',
            ephemeral: true
          })
          return
        }
        await interaction.reply({
          content: this.formatCodeBlock(JSON.stringify(data, null, 2)),
          ephemeral: true
        })
      } else if (command === 'kick' || command === 'ban' || command === 'unban') {
        const player = interaction.options.getString('player', true).trim()
        const game = (server.game ?? '').toLowerCase()
        if (!game.includes('minecraft')) {
          await interaction.reply({
            content: 'Player moderation is currently supported only for Minecraft servers.',
            ephemeral: true
          })
          return
        }
        const action = command === 'unban' ? 'pardon' : command
        if (!this.lifecycleMethods.sendCommand(server.id, `${action} ${player}`)) {
          await interaction.reply({
            content: 'The server is not running or does not support console commands.',
            ephemeral: true
          })
          return
        }
        await interaction.reply({
          content: `🛡️ ${command} applied to **${player}**.`,
          ephemeral: true
        })
      } else if (command === 'logs') {
        const lines = Math.min(Math.max(interaction.options.getInteger('lines') ?? 10, 1), 25)
        const logs = (server as DiscordServer & { logs?: string[] }).logs ?? []
        await interaction.reply({
          content: this.formatCodeBlock(
            logs.slice(-lines).join('\n') || 'No log output is available.'
          ),
          ephemeral: true
        })
      } else if (command === 'console' || command === 'broadcast') {
        const option = command === 'console' ? 'command' : 'message'
        const input = interaction.options.getString(option, true).trim()
        const commandText = command === 'broadcast' ? `say ${input}` : input.replace(/^\//, '')
        if (!this.lifecycleMethods.sendCommand(server.id, commandText)) {
          await interaction.reply({
            content: 'The server is not running or does not support console commands.',
            ephemeral: true
          })
          return
        }
        await interaction.reply({
          content: `Command sent to **${server.name ?? `Server ${server.id}`}**.`,
          ephemeral: true
        })
      } else if (command === 'backup-list') {
        const backups = await discordBackupService.list(server.id)
        const content = backups.length
          ? backups
              .map((backup) => `• **${backup.name}** — ${this.formatBytes(backup.size)}`)
              .join('\n')
          : 'No backups found.'
        await interaction.reply({
          content: `Recent backups for **${server.name ?? `Server ${server.id}`}**:\n${content}`,
          ephemeral: true
        })
      } else if (command === 'backup-create') {
        if (server.status !== 'Offline') {
          await interaction.reply({
            content: 'Stop the server before creating a Discord backup.',
            ephemeral: true
          })
          return
        }
        const name = interaction.options.getString('name') ?? 'discord-backup'
        await interaction.deferReply({ ephemeral: true })
        const backupName = await discordBackupService.create(server.id, name)
        await interaction.editReply(`Backup created: **${backupName}**`)
      } else if (command === 'backup-restore') {
        const filename = interaction.options.getString('file', true)
        const confirmed = interaction.options.getBoolean('confirm', true)
        if (!confirmed) {
          await interaction.reply({
            content: 'Restore cancelled. Set `confirm` to true to proceed.',
            ephemeral: true
          })
          return
        }
        if (server.status !== 'Offline') {
          await interaction.reply({
            content: 'Stop the server before restoring a backup.',
            ephemeral: true
          })
          return
        }
        await interaction.deferReply({ ephemeral: true })
        await discordBackupService.restore(server.id, filename)
        await interaction.editReply(`Backup restored: **${filename}**`)
      } else if (command === 'backup-prune') {
        const keep = interaction.options.getInteger('keep', true)
        const removed = await discordBackupService.prune(server.id, keep)
        await interaction.reply({
          content: `Removed ${removed} old backup${removed === 1 ? '' : 's'}. Kept the newest ${keep}.`,
          ephemeral: true
        })
      } else if (
        command === 'schedule-start' ||
        command === 'schedule-stop' ||
        command === 'schedule-backup'
      ) {
        const runAtSeconds = interaction.options.getInteger('at', true)
        const runAt = runAtSeconds * 1000
        if (runAt <= Date.now()) {
          await interaction.reply({
            content: 'Schedule time must be in the future.',
            ephemeral: true
          })
          return
        }
        const settings = discordBotSettings.readSettings()
        const id =
          settings.schedules.reduce((highest, schedule) => Math.max(highest, schedule.id), 0) + 1
        settings.schedules.push({
          id,
          serverId: server.id,
          action:
            command === 'schedule-backup'
              ? 'backup'
              : command === 'schedule-start'
                ? 'start'
                : 'stop',
          runAt,
          createdBy: interaction.user.id,
          ...(command === 'schedule-backup'
            ? { keep: interaction.options.getInteger('keep', true) }
            : {})
        })
        discordBotSettings.writeSettings(settings)
        await interaction.reply({
          content: `Scheduled **${command === 'schedule-backup' ? 'backup' : command === 'schedule-start' ? 'start' : 'stop'}** for **${server.name ?? `Server ${server.id}`}** at <t:${runAtSeconds}:F> (schedule #${id}).`,
          ephemeral: true
        })
      } else if (command === 'address') {
        await interaction.deferReply({ ephemeral: true })
        await interaction.editReply({ embeds: [await this.createAddressEmbed(server)] })
      } else if (command === 'start' || command === 'stop' || command === 'restart') {
        await interaction.deferReply()
        if (command === 'restart') await this.lifecycleMethods.stopServer(server.id)
        if (command === 'start' || command === 'restart')
          await this.lifecycleMethods.startServer(server.id)
        await interaction.editReply(
          `${command === 'stop' ? '🔴 Stopped' : '🟢 Started'} **${server.name ?? `Server ${server.id}`}**.`
        )
      }
      discordAuditService.record({
        at: new Date().toISOString(),
        userId: interaction.user.id,
        username: interaction.user.tag,
        command,
        serverId: server.id,
        result: 'success'
      })
    } catch (error) {
      console.error('[DiscordBot] Error handling interaction:', error)
      const message = error instanceof Error ? error.message : String(error)
      discordAuditService.record({
        at: new Date().toISOString(),
        userId: interaction.user.id,
        username: interaction.user.tag,
        command: interaction.commandName,
        result: 'failure',
        detail: message
      })
      if (interaction.deferred || interaction.replied)
        await interaction.followUp({ content: `Operation failed: ${message}`, ephemeral: true })
      else await interaction.reply({ content: `Operation failed: ${message}`, ephemeral: true })
    }
  }

  private checkRateLimit(userId: string, command: string): boolean {
    return this.rateLimiter.allow(`${userId}:${command}`)
  }

  private async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    if (!this.checkRateLimit(interaction.user.id, interaction.customId)) {
      discordAuditService.record({
        at: new Date().toISOString(),
        userId: interaction.user.id,
        username: interaction.user.tag,
        command: interaction.customId,
        result: 'denied',
        detail: 'rate limit'
      })
      await interaction.reply({
        content: 'You are using controls too quickly. Try again shortly.',
        ephemeral: true
      })
      return
    }
    if (
      !this.lifecycleMethods ||
      !this.hasPermission(
        interaction,
        ['stop', 'restart'].some((action) => interaction.customId.startsWith(`omni:${action}:`))
      )
    ) {
      await interaction.reply({
        content: 'You are not authorized to use this control.',
        ephemeral: true
      })
      return
    }
    const [, action, rawId] = interaction.customId.split(':')
    if (action === 'refresh') {
      await interaction.update({
        embeds: [this.createServerListEmbed(this.getServers())],
        components: this.dashboardComponents(this.getServers())
      })
      return
    }
    const id = Number(rawId)
    const server = this.getServers().find((item) => item.id === id)
    if (!server) {
      await interaction.reply({ content: 'That server no longer exists.', ephemeral: true })
      return
    }
    try {
      if (action === 'address') {
        await interaction.reply({
          embeds: [await this.createAddressEmbed(server)],
          ephemeral: true
        })
        return
      }
      await interaction.deferReply({ ephemeral: true })
      if (action === 'start') await this.lifecycleMethods.startServer(id)
      else if (action === 'stop') await this.lifecycleMethods.stopServer(id)
      else if (action === 'restart') {
        await this.lifecycleMethods.stopServer(id)
        await this.lifecycleMethods.startServer(id)
      } else throw new Error('Unknown dashboard action')
      await interaction.editReply(
        `Action **${action}** completed for **${server.name ?? `Server ${id}`}**.`
      )
      discordAuditService.record({
        at: new Date().toISOString(),
        userId: interaction.user.id,
        username: interaction.user.tag,
        command: interaction.customId,
        serverId: id,
        result: 'success'
      })
      await this.publishStatusChanges()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      discordAuditService.record({
        at: new Date().toISOString(),
        userId: interaction.user.id,
        username: interaction.user.tag,
        command: interaction.customId,
        serverId: id,
        result: 'failure',
        detail: message
      })
      if (interaction.deferred || interaction.replied)
        await interaction.editReply(`Action failed: ${message}`)
      else await interaction.reply({ content: `Action failed: ${message}`, ephemeral: true })
    }
  }

  private async handleLifecycleEvent(event: ServerLifecycleEvent): Promise<void> {
    if (!this.client?.isReady()) return
    await this.publishStatusChanges()
    if (event.state === 'Failed' && event.error)
      console.error(`[DiscordBot] Server ${event.id} failed: ${event.error}`)
  }

  private formatCodeBlock(output: string): string {
    const sanitized = output.replace(/```/g, "'''").slice(-1900)
    return `\`\`\`\n${sanitized}\n\`\`\``
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  private createServerListEmbed(servers: DiscordServer[]): EmbedBuilder {
    const embed = new EmbedBuilder().setTitle('OmniHost Servers').setColor('#0099ff').setTimestamp()
    if (!servers.length) return embed.setDescription('No servers are currently configured.')
    for (const server of servers) {
      const icon = server.status === 'Online' ? '🟢' : server.status === 'Offline' ? '🔴' : '🟡'
      embed.addFields({
        name: `${icon} ${server.name ?? `Server ${server.id}`} (#${server.id})`,
        value: `${server.status ?? 'Unknown'} • ${server.game ?? 'Unknown'} • Port ${server.port ?? 'N/A'}\nPlayers: ${(server.onlinePlayers ?? []).length}`,
        inline: true
      })
    }
    return embed
  }

  private createStatusEmbed(server: DiscordServer): EmbedBuilder {
    const icon = server.status === 'Online' ? '🟢' : server.status === 'Offline' ? '🔴' : '🟡'
    return new EmbedBuilder()
      .setTitle(`${server.name ?? `Server ${server.id}`} Status`)
      .setColor(server.status === 'Online' ? '#00cc66' : '#cc3344')
      .addFields(
        { name: 'Status', value: `${icon} ${server.status ?? 'Unknown'}`, inline: true },
        { name: 'Game', value: server.game ?? 'Unknown', inline: true },
        { name: 'Port', value: String(server.port ?? 'N/A'), inline: true },
        { name: 'Players', value: (server.onlinePlayers ?? []).join(', ') || 'None' }
      )
      .setTimestamp()
  }

  private async createAddressEmbed(server: DiscordServer): Promise<EmbedBuilder> {
    const settings = discordBotSettings.readSettings()
    const info = await discordConnectionInfo.getInfo(server)
    const lines = [`Port: \`${info.port}\``]
    if (settings.announceLanIp && info.lanAddresses.length)
      lines.push(`LAN: ${info.lanAddresses.map((ip) => `\`${ip}:${info.port}\``).join(', ')}`)
    if (settings.announceRadminIp && info.radminAddress)
      lines.push(`Radmin VPN: \`${info.radminAddress}:${info.port}\``)
    if (info.tunnelAddress) lines.push(`FRP tunnel: \`${info.tunnelAddress}\``)
    if (settings.announcePublicIp && info.publicAddress)
      lines.push(`Public IP: \`${info.publicAddress}:${info.port}\``)
    return new EmbedBuilder()
      .setTitle(`How to join ${server.name ?? `Server ${server.id}`}`)
      .setDescription(lines.join('\n') || 'No connection address is currently available.')
      .setColor('#8b5cf6')
      .setTimestamp()
  }

  private startStatusPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = setInterval(() => void this.publishStatusChanges(), 15_000)
    void this.publishStatusChanges()
  }

  private startScheduleRunner(): void {
    if (this.scheduleTimer) clearInterval(this.scheduleTimer)
    this.scheduleTimer = setInterval(() => void this.runScheduledActions(), 15_000)
    void this.runScheduledActions()
  }

  private async runScheduledActions(): Promise<void> {
    if (!this.lifecycleMethods) return
    const settings = discordBotSettings.readSettings()
    const now = Date.now()
    const due = settings.schedules.filter((schedule) => schedule.runAt <= now)
    if (!due.length) return
    const remaining = settings.schedules.filter((schedule) => schedule.runAt > now)
    for (const schedule of due) {
      try {
        if (schedule.action === 'start') await this.lifecycleMethods.startServer(schedule.serverId)
        else if (schedule.action === 'stop')
          await this.lifecycleMethods.stopServer(schedule.serverId)
        else {
          const server = this.getServers().find((item) => item.id === schedule.serverId)
          if (!server || server.status !== 'Offline')
            throw new Error('Server must be offline for a scheduled backup')
          await discordBackupService.create(schedule.serverId, 'scheduled-backup')
          await discordBackupService.prune(schedule.serverId, schedule.keep ?? 7)
        }
      } catch (error) {
        console.error(
          `[DiscordBot] Scheduled ${schedule.action} failed for server ${schedule.serverId}:`,
          error
        )
      }
    }
    discordBotSettings.writeSettings({ ...settings, schedules: remaining })
  }

  private async publishStatusChanges(): Promise<void> {
    const settings = discordBotSettings.readSettings()
    if (!settings.announceServerEvents || !this.client?.isReady() || !this.lifecycleMethods) return
    const channelId = settings.announcementChannelId || settings.defaultChannelId
    if (!channelId) return
    const channel = await this.client.channels.fetch(channelId).catch(() => null)
    if (!(channel instanceof TextChannel)) return

    await this.updateDashboard(channel, this.getServers(), settings.dashboardMessageId)

    for (const server of this.getServers()) {
      const previousStatus = this.lastStatuses.get(server.id)
      this.lastStatuses.set(server.id, server.status ?? 'Unknown')
      if (
        previousStatus &&
        previousStatus !== server.status &&
        ['Online', 'Offline', 'Failed'].includes(server.status ?? '')
      ) {
        await channel
          .send({ embeds: [this.createStatusEmbed(server)] })
          .catch((error) => console.error('[DiscordBot] Announcement failed:', error))
      }
      if (server.status === 'Online' && !this.lastAddresses.has(server.id)) {
        const info = await discordConnectionInfo.getInfo(server)
        const addressKey = `${info.publicAddress}|${info.radminAddress}|${info.tunnelAddress}|${info.lanAddresses.join(',')}|${info.port}`
        this.lastAddresses.set(server.id, addressKey)
        await channel
          .send({ embeds: [await this.createAddressEmbed(server)] })
          .catch((error) => console.error('[DiscordBot] Address announcement failed:', error))
      }
      if (server.status !== 'Online') this.lastAddresses.delete(server.id)
    }
  }

  private async updateDashboard(
    channel: TextChannel,
    servers: DiscordServer[],
    dashboardMessageId: string
  ): Promise<void> {
    const embed = this.createServerListEmbed(servers).setFooter({ text: 'OmniHost live dashboard' })
    const components = this.dashboardComponents(servers)
    if (dashboardMessageId) {
      const message = await channel.messages.fetch(dashboardMessageId).catch(() => null)
      if (message) {
        await message.edit({ embeds: [embed], components })
        return
      }
    }
    const message = await channel.send({ embeds: [embed], components })
    discordBotSettings.writeSettings({
      ...discordBotSettings.readSettings(),
      dashboardMessageId: message.id
    })
  }

  private dashboardComponents(servers: DiscordServer[]): ActionRowBuilder<ButtonBuilder>[] {
    const rows = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('omni:refresh:0')
          .setLabel('Refresh')
          .setStyle(ButtonStyle.Secondary)
      )
    ]
    for (const server of servers.slice(0, 4)) {
      rows.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`omni:start:${server.id}`)
            .setLabel(`Start ${server.name ?? server.id}`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`omni:stop:${server.id}`)
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`omni:restart:${server.id}`)
            .setLabel('Restart')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`omni:address:${server.id}`)
            .setLabel('Address')
            .setStyle(ButtonStyle.Secondary)
        )
      )
    }
    return rows
  }
}

export const discordBot = new DiscordBot()
