const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { renderBanner } = require('./banner');
const config = require('./config');

/**
 * Builds the {embed, files} payload for a given status snapshot.
 * The heavy visual lifting happens in banner.js (a rendered PNG);
 * the embed itself just frames it with a color accent + link buttons info.
 */
async function buildStatusPayload(status) {
  const pngBuffer = await renderBanner(status);
  const attachment = new AttachmentBuilder(pngBuffer, { name: 'status.png' });

  const embed = new EmbedBuilder()
    .setColor(status.online ? 0x3ddc84 : 0xff5c72)
    .setImage('attachment://status.png')
    .setFooter({
      text: status.online
        ? `${status.players.online} playing now`
        : 'Server unreachable — retrying automatically',
    })
    .setTimestamp(status.checkedAt);

  return { embeds: [embed], files: [attachment] };
}

module.exports = { buildStatusPayload };
