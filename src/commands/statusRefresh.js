const { SlashCommandBuilder } = require('discord.js');
const { resolveServer } = require('../utils/resolveServer');
const { runCycle } = require('../services/monitoring/monitor');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status-refresh')
    .setDescription('Force-refresh a server status panel right now.')
    .addStringOption((o) => o.setName('server').setDescription('Server name (omit if you only monitor one)')),

  async execute(interaction) {
    const server = resolveServer(interaction);
    if (!server) {
      return interaction.reply({ content: '❌ Specify which server with `server:<name>`.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const status = await runCycle(interaction.client, server.id);

    if (!status) {
      return interaction.editReply('⚠️ Refresh skipped — an update was already in progress. Try again shortly.');
    }

    await interaction.editReply(
      status.online
        ? `✅ **${server.name}** refreshed — ${status.players.online}/${status.players.max} players online.`
        : `⚠️ **${server.name}** refreshed — server appears to be offline.`
    );
  },
};
