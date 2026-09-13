const { SlashCommandBuilder } = require('discord.js');
const db = require('../services/database/db');
const { serversListEmbed } = require('../ui/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('servers')
    .setDescription('Show a quick overview of every monitored server.'),

  async execute(interaction) {
    const rows = db.getServersByGuild(interaction.guildId);
    const embed = serversListEmbed(interaction.guild.name, rows);
    return interaction.reply({ embeds: [embed] });
  },
};
