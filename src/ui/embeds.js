const { EmbedBuilder } = require('discord.js');
const { formatUptime, escapeDiscordMarkdown } = require('../utils/format');

const COLOR_ONLINE = 0x39ff9e;
const COLOR_OFFLINE = 0xff3b6b;
const COLOR_NEUTRAL = 0x4ee8ff;

function playersEmbed(serverRecord, status) {
  const embed = new EmbedBuilder()
    .setTitle(`👥 ${serverRecord.name} — Players`)
    .setColor(status.online ? COLOR_ONLINE : COLOR_OFFLINE)
    .setTimestamp(status.checkedAt);

  if (!status.online) {
    embed.setDescription('Server is offline — player data unavailable.');
    return embed;
  }

  const players = status.players || { online: 0, max: 0, sample: [] };
  embed.setDescription(`**${players.online} / ${players.max}** players online`);

  if (players.sample && players.sample.length > 0) {
    const names = players.sample.map((n) => `• ${escapeDiscordMarkdown(n)}`).join('\n');
    const extra = players.online - players.sample.length;
    embed.addFields({
      name: extra > 0 ? `Sample (+${extra} more not shown)` : 'Online now',
      value: names.slice(0, 1024),
    });
    embed.setFooter({ text: 'The Minecraft protocol only guarantees a sample list, not the full roster.' });
  } else {
    embed.addFields({
      name: 'Player list',
      value: players.online > 0 ? 'Unavailable — this server does not expose a player sample.' : 'No players online.',
    });
  }

  return embed;
}

function statsEmbed(serverRecord, summary) {
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${serverRecord.name} — Statistics`)
    .setColor(COLOR_NEUTRAL)
    .setTimestamp();

  if (!summary.totalChecks) {
    embed.setDescription('No monitoring data yet — check back after the next update.');
    return embed;
  }

  embed.addFields(
    { name: 'Uptime', value: summary.uptimePercent !== null ? `${summary.uptimePercent.toFixed(1)}%` : '—', inline: true },
    { name: 'Total checks', value: `${summary.totalChecks}`, inline: true },
    { name: 'Downtime events', value: `${summary.downtimeChecks}`, inline: true },
    { name: 'Peak players', value: summary.peakPlayers !== null ? `${summary.peakPlayers}` : '—', inline: true },
    { name: 'Average players', value: summary.avgPlayers !== null ? `${summary.avgPlayers}` : '—', inline: true },
    { name: 'Average ping', value: summary.avgPing !== null ? `${summary.avgPing} ms` : '—', inline: true }
  );

  if (summary.since) {
    embed.setFooter({ text: `Tracking since ${summary.since} UTC` });
  }

  return embed;
}

function serverInfoEmbed(serverRecord, status) {
  const embed = new EmbedBuilder()
    .setTitle(`📋 ${serverRecord.name}`)
    .setColor(status.online ? COLOR_ONLINE : COLOR_OFFLINE)
    .setTimestamp(status.checkedAt)
    .addFields(
      { name: 'Address', value: `\`${serverRecord.host}:${serverRecord.port}\``, inline: true },
      { name: 'Edition', value: (status.edition || serverRecord.edition || 'auto').toUpperCase(), inline: true },
      { name: 'Status', value: status.online ? '🟢 Online' : '🔴 Offline', inline: true },
      { name: 'Version', value: status.online ? status.version || 'Unknown' : '—', inline: true },
      { name: 'Ping', value: status.online && status.ping !== null ? `${status.ping} ms` : '—', inline: true },
      {
        name: 'Panel updates every',
        value: `${Math.round((serverRecord.update_interval_ms || 30000) / 1000)}s`,
        inline: true,
      }
    );

  if (status.motd) {
    embed.setDescription(`*"${status.motd.replace(/\s+/g, ' ').trim()}"*`);
  }

  return embed;
}

function serversListEmbed(guildName, rows) {
  const embed = new EmbedBuilder()
    .setTitle(`🖥️ Monitored Servers — ${guildName}`)
    .setColor(COLOR_NEUTRAL)
    .setTimestamp();

  if (rows.length === 0) {
    embed.setDescription('No servers are being monitored yet. Add one with `/server add`.');
    return embed;
  }

  const lines = rows.map((r) => {
    const dot = r.last_online === 1 ? '🟢' : r.last_online === 0 ? '🔴' : '⚪';
    const panel = r.channel_id ? ` — panel in <#${r.channel_id}>` : '';
    return `${dot} **${escapeDiscordMarkdown(r.name)}** \`${r.host}:${r.port}\`${panel}`;
  });

  embed.setDescription(lines.join('\n'));
  return embed;
}

function stateChangeEmbed(serverRecord, status, wentOnline) {
  const embed = new EmbedBuilder()
    .setTimestamp(status.checkedAt)
    .setColor(wentOnline ? COLOR_ONLINE : COLOR_OFFLINE)
    .setTitle(wentOnline ? '🟢 Minecraft Server Online' : '🔴 Minecraft Server Offline')
    .addFields(
      { name: 'Server', value: serverRecord.name, inline: false },
      { name: 'Address', value: `\`${serverRecord.host}:${serverRecord.port}\``, inline: false }
    );

  if (wentOnline) {
    embed.addFields(
      { name: 'Players', value: `${status.players?.online ?? 0} / ${status.players?.max ?? 0}`, inline: true },
      { name: 'Ping', value: status.ping !== null ? `${status.ping}ms` : '—', inline: true }
    );
  } else {
    embed.setDescription('The server is currently unreachable. You will be notified again when it recovers.');
  }

  return embed;
}

module.exports = { playersEmbed, statsEmbed, serverInfoEmbed, serversListEmbed, stateChangeEmbed, formatUptime };
