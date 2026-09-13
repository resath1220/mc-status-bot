const logger = require('../utils/logger');
const db = require('../services/database/db');
const { getServerStatus } = require('../services/minecraft/mcstatus');
const { playersEmbed, statsEmbed, serverInfoEmbed } = require('../ui/embeds');

async function handleButton(interaction) {
  const [, action, serverIdRaw] = interaction.customId.split(':');
  const serverId = Number(serverIdRaw);
  const server = db.getServerById(serverId);

  if (!server) {
    return interaction.reply({ content: '❌ This server is no longer being monitored.', ephemeral: true });
  }

  if (action === 'refresh') {
    await interaction.deferReply({ ephemeral: true });
    const { runCycle } = require('../services/monitoring/monitor');
    const status = await runCycle(interaction.client, server.id);
    return interaction.editReply(
      status
        ? status.online
          ? `✅ Refreshed — ${status.players.online}/${status.players.max} players online.`
          : '⚠️ Refreshed — server appears to be offline.'
        : '⚠️ An update was already in progress — try again shortly.'
    );
  }

  await interaction.deferReply({ ephemeral: true });
  const status = await getServerStatus({ host: server.host, port: server.port, edition: server.edition });

  if (action === 'players') return interaction.editReply({ embeds: [playersEmbed(server, status)] });
  if (action === 'stats') return interaction.editReply({ embeds: [statsEmbed(server, db.getStatsSummary(server.id))] });
  if (action === 'info') return interaction.editReply({ embeds: [serverInfoEmbed(server, status)] });

  return interaction.editReply('❌ Unknown action.');
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('panel:')) {
        await handleButton(interaction);
        return;
      }
    } catch (err) {
      logger.error(`Interaction error (${interaction.commandName || interaction.customId}):`, err);
      const payload = { content: '❌ Something went wrong handling that.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
