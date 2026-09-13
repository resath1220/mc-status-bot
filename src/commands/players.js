const { SlashCommandBuilder } = require('discord.js');
const { resolveServer } = require('../utils/resolveServer');
const { getServerStatus } = require('../services/minecraft/mcstatus');
const { playersEmbed } = require('../ui/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('players')
    .setDescription('Show who is currently online on a monitored server.')
    .addStringOption((o) => o.setName('server').setDescription('Server name (omit if you only monitor one)')),

  async execute(interaction) {
    const server = resolveServer(interaction);
    if (!server) {
      return interaction.reply({ content: '❌ Specify which server with `server:<name>`.', ephemeral: true });
    }

    await interaction.deferReply();
    const status = await getServerStatus({ host: server.host, port: server.port, edition: server.edition });
    return interaction.editReply({ embeds: [playersEmbed(server, status)] });
  },
};
