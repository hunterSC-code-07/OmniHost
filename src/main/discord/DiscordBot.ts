import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js'
import { discordBotSettings } from './DiscordBotSettings'
import type { ServerLifecycleMethods } from '../ipc/ServerLifecycleController'

export class DiscordBot {
  private client: Client | null = null
  private lifecycleMethods: ServerLifecycleMethods | null = null

  init(lifecycleMethods: ServerLifecycleMethods) {
    this.lifecycleMethods = lifecycleMethods
    const settings = discordBotSettings.readSettings()
    if (settings.autoStart && settings.token) {
      this.start(settings.token).catch(console.error)
    }
  }

  async start(token: string): Promise<void> {
    if (this.client) {
      await this.stop()
    }

    if (!token.trim()) {
      throw new Error('Discord Bot Token is empty')
    }

    this.client = new Client({ intents: [GatewayIntentBits.Guilds] })

    this.client.on('ready', async () => {
      console.log(`[DiscordBot] Logged in as ${this.client?.user?.tag}`)
      await this.registerCommands(token)
    })

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return
      await this.handleInteraction(interaction)
    })

    await this.client.login(token)
  }

  async stop(): Promise<void> {
    if (this.client) {
      this.client.destroy()
      this.client = null
      console.log('[DiscordBot] Disconnected')
    }
  }

  isRunning(): boolean {
    return this.client?.isReady() ?? false
  }

  private async registerCommands(token: string) {
    if (!this.client?.user) return

    const commands = [
      {
        name: 'list',
        description: 'List all OmniHost servers and their status'
      },
      {
        name: 'start',
        description: 'Start a server',
        options: [
          {
            name: 'id',
            type: 4, // INTEGER
            description: 'The ID of the server to start',
            required: true
          }
        ]
      },
      {
        name: 'stop',
        description: 'Stop a server',
        options: [
          {
            name: 'id',
            type: 4, // INTEGER
            description: 'The ID of the server to stop',
            required: true
          }
        ]
      },
      {
        name: 'status',
        description: 'Check the live status of a server',
        options: [
          {
            name: 'id',
            type: 4, // INTEGER
            description: 'The ID of the server to check',
            required: true
          }
        ]
      }
    ]

    const rest = new REST({ version: '10' }).setToken(token)

    try {
      await rest.put(Routes.applicationCommands(this.client.user.id), { body: commands })
      console.log('[DiscordBot] Successfully registered slash commands.')
    } catch (error) {
      console.error('[DiscordBot] Failed to register slash commands:', error)
    }
  }

  private async handleInteraction(interaction: ChatInputCommandInteraction) {
    if (!this.lifecycleMethods) {
      await interaction.reply({
        content: 'Server lifecycle methods not initialized.',
        ephemeral: true
      })
      return
    }

    const { commandName } = interaction

    try {
      if (commandName === 'list') {
        const servers = this.lifecycleMethods.getServerList()

        if (servers.length === 0) {
          await interaction.reply({
            content: 'There are no servers currently configured.',
            ephemeral: true
          })
          return
        }

        const embed = new EmbedBuilder().setTitle('OmniHost Servers').setColor('#0099ff')

        servers.forEach((server) => {
          const statusIcon =
            server.status === 'Online' ? '🟢' : server.status === 'Offline' ? '🔴' : '🟡'
          embed.addFields({
            name: `ID: ${server.id} - ${server.name}`,
            value: `${statusIcon} ${server.status}\nGame: ${server.game}\nPort: ${server.port}`,
            inline: true
          })
        })

        await interaction.reply({ embeds: [embed] })
      } else if (commandName === 'start') {
        const id = interaction.options.getInteger('id', true)
        const server = this.lifecycleMethods.getServerList().find((s) => s.id === id)

        if (!server) {
          await interaction.reply({ content: `Server with ID ${id} not found.`, ephemeral: true })
          return
        }

        if (server.status === 'Online' || server.status === 'Starting') {
          await interaction.reply({
            content: `Server **${server.name}** is already ${server.status}.`,
            ephemeral: true
          })
          return
        }

        await interaction.deferReply()
        await this.lifecycleMethods.startServer(id)
        await interaction.editReply(`🟢 Started server **${server.name}**!`)
      } else if (commandName === 'stop') {
        const id = interaction.options.getInteger('id', true)
        const server = this.lifecycleMethods.getServerList().find((s) => s.id === id)

        if (!server) {
          await interaction.reply({ content: `Server with ID ${id} not found.`, ephemeral: true })
          return
        }

        if (server.status === 'Offline' || server.status === 'Stopping') {
          await interaction.reply({
            content: `Server **${server.name}** is already ${server.status}.`,
            ephemeral: true
          })
          return
        }

        await interaction.deferReply()
        await this.lifecycleMethods.stopServer(id)
        await interaction.editReply(`🔴 Stopped server **${server.name}**!`)
      } else if (commandName === 'status') {
        const id = interaction.options.getInteger('id', true)
        const server = this.lifecycleMethods.getServerList().find((s) => s.id === id)

        if (!server) {
          await interaction.reply({ content: `Server with ID ${id} not found.`, ephemeral: true })
          return
        }

        const statusIcon =
          server.status === 'Online' ? '🟢' : server.status === 'Offline' ? '🔴' : '🟡'

        const embed = new EmbedBuilder()
          .setTitle(`${server.name} Status`)
          .setColor(server.status === 'Online' ? '#00ff00' : '#ff0000')
          .addFields(
            { name: 'Game', value: String(server.game), inline: true },
            { name: 'Status', value: `${statusIcon} ${server.status}`, inline: true },
            { name: 'Port', value: String(server.port), inline: true }
          )

        if (server.onlinePlayers && server.onlinePlayers.length > 0) {
          embed.addFields({ name: 'Players', value: server.onlinePlayers.join(', ') })
        } else if (server.status === 'Online') {
          embed.addFields({ name: 'Players', value: 'None' })
        }

        await interaction.reply({ embeds: [embed] })
      }
    } catch (error) {
      console.error('[DiscordBot] Error handling interaction:', error)
      const msg = error instanceof Error ? error.message : String(error)
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: `An error occurred: ${msg}`, ephemeral: true })
      } else {
        await interaction.reply({ content: `An error occurred: ${msg}`, ephemeral: true })
      }
    }
  }
}

export const discordBot = new DiscordBot()
