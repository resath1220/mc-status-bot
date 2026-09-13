const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../services/database/db');
const config = require('../config');
const { resolveServer } = require('../utils/resolveServer');
const { startServerMonitor } = require('../services/monitoring/monitor');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status-config')
    .setDescription("Change a monitored server's panel settings.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName('server').setDescription('Server name (omit if you only monitor one)'))
    .addIntegerOption((o) =>
      o.setName('interval_seconds').setDescription('How often the panel refreshes (min 15s)').setMinValue(15).setMaxValue(3600)
    )
    .addStringOption((o) => o.setName('icon_url').setDescription("Custom icon URL, or 'none' to clear it")),

  async execute(interaction) {
    const server = resolveServer(interaction);
    if (!server) {
      return interaction.reply({ content: '❌ Specify which server with `server:<name>`.', ephemeral: true });
    }

    const intervalSeconds = interaction.options.getInteger('interval_seconds');
    const iconUrlInput = interaction.options.getString('icon_url');
    const changes = [];

    if (intervalSeconds) {
      const ms = Math.max(config.minUpdateIntervalMs, intervalSeconds * 1000);
      db.setUpdateInterval(server.id, ms);
      changes.push(`update interval → ${ms / 1000}s`);
    }

    if (iconUrlInput) {
      const value = iconUrlInput.toLowerCase() === 'none' ? null : iconUrlInput;
      db.db.prepare(`UPDATE servers SET icon_url = ? WHERE id = ?`).run(value, server.id);
      changes.push(value ? 'icon URL updated' : 'icon URL cleared');
    }

    if (changes.length === 0) {
      return interaction.reply({ content: 'Nothing to change — pass an option to update.', ephemeral: true });
    }

    if (server.channel_id) startServerMonitor(interaction.client, server.id);

    return interaction.reply({ content: `✅ **${server.name}**: ${changes.join(', ')}.`, ephemeral: true });
  },
};
