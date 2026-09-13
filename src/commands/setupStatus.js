const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../services/database/db');
const { resolveServer } = require('../utils/resolveServer');
const { startServerMonitor } = require('../services/monitoring/monitor');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-status')
    .setDescription('Post a new auto-updating status panel for a monitored server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName('server').setDescription('Server name (omit if you only monitor one)'))
    .addChannelOption((o) =>
      o.setName('channel').setDescription('Channel to post the panel in (default: this channel)').addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    const server = resolveServer(interaction);
    if (!server) {
      return interaction.reply({
        content: '❌ Specify which server with `server:<name>`, or add one first with `/server add`.',
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await interaction.deferReply({ ephemeral: true });

    db.setPanel(server.id, { channelId: channel.id, messageId: null });
    db.setEnabled(server.id, true);
    startServerMonitor(interaction.client, server.id);

    await interaction.editReply(`✅ Live status panel for **${server.name}** created in <#${channel.id}>.`);
  },
};
