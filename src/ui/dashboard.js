const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { renderBanner } = require('./banner');
const { panelButtons } = require('./components');

/**
 * Builds the full panel payload (image dashboard + buttons) for a given
 * monitored server and its latest status snapshot.
 */
async function buildStatusPayload(serverRecord, status) {
  const pngBuffer = await renderBanner(status, serverRecord);
  const attachment = new AttachmentBuilder(pngBuffer, { name: 'status.png' });

  const embed = new EmbedBuilder()
    .setColor(status.online ? 0x39ff9e : 0xff3b6b)
    .setImage('attachment://status.png')
    .setFooter({
      text: status.online
        ? `${status.players.online} playing now`
        : 'Server unreachable — retrying automatically',
    })
    .setTimestamp(status.checkedAt);

  return {
    embeds: [embed],
    files: [attachment],
    components: [panelButtons(serverRecord.id)],
  };
}

module.exports = { buildStatusPayload };
