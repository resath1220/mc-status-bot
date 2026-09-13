const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../services/database/db');
const { resolveServer } = require('../utils/resolveServer');
const { stopServerMonitor } = require('../services/monitoring/monitor');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status-stop')
    .setDescription('Stop the auto-updating panel for a monitored server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName('server').setDescription('Server name (omit if you only monitor one)')),

  async execute(interaction) {
    const server = resolveServer(interaction);
    if (!server) {
      return interaction.reply({ content: '❌ Specify which server with `server:<name>`.', ephemeral: true });
    }

    stopServerMonitor(server.id);
    db.setEnabled(server.id, false);
    db.clearPanel(server.id);

    return interaction.reply({ content: `⏸️ Stopped monitoring **${server.name}**. Re-enable with \`/server add\` or \`/setup-status\`.`, ephemeral: true });
  },
};
