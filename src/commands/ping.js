const { SlashCommandBuilder } = require('discord.js');
const { resolveServer } = require('../utils/resolveServer');
const { getServerStatus } = require('../services/minecraft/mcstatus');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Check a monitored server's latency.")
    .addStringOption((o) => o.setName('server').setDescription('Server name (omit if you only monitor one)')),

  async execute(interaction) {
    const server = resolveServer(interaction);
    if (!server) {
      return interaction.reply({ content: '❌ Specify which server with `server:<name>`.', ephemeral: true });
    }

    await interaction.deferReply();
    const status = await getServerStatus({ host: server.host, port: server.port, edition: server.edition });

    if (!status.online) {
      return interaction.editReply(`🔴 **${server.name}** is offline — no ping available.`);
    }

    return interaction.editReply(
      status.ping !== null ? `🏓 **${server.name}**: ${status.ping}ms` : `🏓 **${server.name}**: ping unavailable`
    );
  },
};
