const { SlashCommandBuilder } = require('discord.js');
const db = require('../services/database/db');
const { resolveServer } = require('../utils/resolveServer');
const { statsEmbed } = require('../ui/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show uptime and performance statistics for a monitored server.')
    .addStringOption((o) => o.setName('server').setDescription('Server name (omit if you only monitor one)')),

  async execute(interaction) {
    const server = resolveServer(interaction);
    if (!server) {
      return interaction.reply({ content: '❌ Specify which server with `server:<name>`.', ephemeral: true });
    }

    const summary = db.getStatsSummary(server.id);
    return interaction.reply({ embeds: [statsEmbed(server, summary)] });
  },
};
