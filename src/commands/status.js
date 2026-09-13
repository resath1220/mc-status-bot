const { SlashCommandBuilder } = require('discord.js');
const { getServerStatus } = require('../services/minecraft/mcstatus');
const { serverInfoEmbed } = require('../ui/embeds');
const { resolveServer } = require('../utils/resolveServer');
const { runCycle } = require('../services/monitoring/monitor');
const { isValidHost, isValidPort } = require('../utils/validate');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check a Minecraft server status, or refresh a monitored panel.')
    .addStringOption((o) => o.setName('ip').setDescription('Server host/IP to look up (skip to use a monitored server instead)'))
    .addIntegerOption((o) => o.setName('port').setDescription('Server port (default 25565)').setMinValue(1).setMaxValue(65535))
    .addStringOption((o) => o.setName('server').setDescription('Monitored server name (omit if you only monitor one)')),

  async execute(interaction) {
    const ip = interaction.options.getString('ip');
    await interaction.deferReply({ ephemeral: true });

    // Ad-hoc lookup of an arbitrary address — does not register anything.
    if (ip) {
      if (!isValidHost(ip)) return interaction.editReply('❌ That hostname/IP doesn\'t look valid.');
      const port = interaction.options.getInteger('port') || 25565;
      if (!isValidPort(port)) return interaction.editReply('❌ Port must be between 1 and 65535.');

      const status = await getServerStatus({ host: ip, port, edition: 'auto' });
      const fakeRecord = { name: ip, host: ip, port, edition: status.edition || 'auto', update_interval_ms: 30000 };
      return interaction.editReply({ embeds: [serverInfoEmbed(fakeRecord, status)] });
    }

    // No IP given — refresh a monitored server's live panel instead.
    const server = resolveServer(interaction);
    if (!server) {
      return interaction.editReply('❌ Specify `ip:` for a one-off lookup, or `server:<name>` to refresh a monitored panel.');
    }

    const status = await runCycle(interaction.client, server.id);
    if (!status) return interaction.editReply('⚠️ Refresh skipped — an update was already in progress.');

    return interaction.editReply(
      status.online
        ? `✅ Panel refreshed — ${status.players.online}/${status.players.max} players online.`
        : '⚠️ Panel refreshed — server appears to be offline.'
    );
  },
};
