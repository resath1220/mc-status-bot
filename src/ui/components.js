const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Buttons attached to every status panel. Custom IDs are namespaced with the
 * server's database id so one interaction handler can serve every panel.
 */
function panelButtons(serverId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`panel:refresh:${serverId}`)
      .setLabel('Refresh')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`panel:players:${serverId}`)
      .setLabel('Players')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`panel:stats:${serverId}`)
      .setLabel('Statistics')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`panel:info:${serverId}`)
      .setLabel('Server Info')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = { panelButtons };
