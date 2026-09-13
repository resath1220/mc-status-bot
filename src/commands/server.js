const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../services/database/db');
const config = require('../config');
const { isValidHost, isValidPort, sanitizeName } = require('../utils/validate');
const { serversListEmbed } = require('../ui/embeds');
const { startServerMonitor, stopServerMonitor } = require('../services/monitoring/monitor');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Manage the Minecraft servers this bot monitors.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a Minecraft server to monitor.')
        .addStringOption((o) => o.setName('name').setDescription('Display name for this server').setRequired(true))
        .addStringOption((o) => o.setName('host').setDescription('Server hostname or IP').setRequired(true))
        .addIntegerOption((o) => o.setName('port').setDescription('Server port').setMinValue(1).setMaxValue(65535))
        .addStringOption((o) =>
          o
            .setName('edition')
            .setDescription('Edition (default: auto-detect)')
            .addChoices({ name: 'Auto-detect', value: 'auto' }, { name: 'Java', value: 'java' }, { name: 'Bedrock', value: 'bedrock' })
        )
        .addStringOption((o) => o.setName('icon_url').setDescription('Optional custom icon URL (overrides auto favicon)'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Stop monitoring a server.')
        .addStringOption((o) => o.setName('name').setDescription('Server name').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List all monitored servers in this server.')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'add') {
      const name = sanitizeName(interaction.options.getString('name'));
      const host = interaction.options.getString('host').trim();
      const port = interaction.options.getInteger('port') || 25565;
      const edition = interaction.options.getString('edition') || 'auto';
      const iconUrl = interaction.options.getString('icon_url') || null;

      if (!name) return interaction.reply({ content: '❌ Please provide a valid name.', ephemeral: true });
      if (!isValidHost(host)) return interaction.reply({ content: '❌ That hostname/IP doesn\'t look valid.', ephemeral: true });
      if (!isValidPort(port)) return interaction.reply({ content: '❌ Port must be between 1 and 65535.', ephemeral: true });

      const existing = db.getServerByName(guildId, name);
      if (existing) return interaction.reply({ content: `❌ A server named **${name}** already exists.`, ephemeral: true });

      const server = db.addServer({
        guildId,
        name,
        host,
        port,
        edition,
        updateIntervalMs: config.defaultUpdateIntervalMs,
        iconUrl,
      });

      startServerMonitor(interaction.client, server.id);

      return interaction.reply({
        content: `✅ Added **${name}** (\`${host}:${port}\`, ${edition}). Use \`/setup-status server:${name}\` to post a live panel.`,
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const name = interaction.options.getString('name');
      const server = db.getServerByName(guildId, name);
      if (!server) return interaction.reply({ content: `❌ No server named **${name}** found.`, ephemeral: true });

      stopServerMonitor(server.id);
      db.removeServer(server.id);
      return interaction.reply({ content: `🗑️ Removed **${server.name}** from monitoring.`, ephemeral: true });
    }

    if (sub === 'list') {
      const rows = db.getServersByGuild(guildId);
      const embed = serversListEmbed(interaction.guild.name, rows);
      return interaction.reply({ embeds: [embed] });
    }
  },
};
