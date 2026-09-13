const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all available commands.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Minecraft Status Bot — Commands')
      .setColor(0x4ee8ff)
      .addFields(
        { name: '/server add | remove | list', value: 'Manage which servers are monitored. *(Manage Server)*' },
        { name: '/servers', value: 'Quick overview of every monitored server.' },
        { name: '/setup-status', value: 'Post a live auto-updating panel for a server. *(Manage Server)*' },
        { name: '/status-config', value: "Change a panel's refresh interval or icon. *(Manage Server)*" },
        { name: '/status-refresh', value: 'Force-refresh a panel immediately.' },
        { name: '/status-stop', value: 'Stop auto-updating a panel. *(Manage Server)*' },
        { name: '/status', value: 'Look up any `ip:port`, or refresh a monitored panel.' },
        { name: '/players', value: 'Show who is currently online.' },
        { name: '/ping', value: "Check a server's latency." },
        { name: '/stats', value: 'Show uptime and performance history.' }
      )
      .setFooter({ text: 'Panels also have Refresh / Players / Statistics / Server Info buttons.' });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
