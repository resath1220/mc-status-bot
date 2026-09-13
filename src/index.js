const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');
const { getCombinedStatus } = require('./mcstatus');
const { buildStatusPayload } = require('./statusEmbed');

if (!config.token) {
  console.error('Missing DISCORD_TOKEN in .env — see .env.example.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

// Tracks the live panel message per channel so we can edit it in place.
const panels = new Map(); // channelId -> Message

async function refreshPanel(channel) {
  const status = await getCombinedStatus();
  const payload = await buildStatusPayload(status);

  const existing = panels.get(channel.id);

  try {
    if (existing) {
      await existing.edit(payload);
    } else {
      const msg = await channel.send(payload);
      panels.set(channel.id, msg);
    }
  } catch (err) {
    // Message may have been deleted — recreate it.
    console.warn(`Panel edit failed (${err.message}), re-posting...`);
    const msg = await channel.send(payload);
    panels.set(channel.id, msg);
  }

  return status;
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity('Minecraft server status', { type: 3 }); // Watching

  if (config.channelId) {
    try {
      const channel = await client.channels.fetch(config.channelId);
      await refreshPanel(channel);

      setInterval(() => {
        refreshPanel(channel).catch((e) => console.error('Auto-refresh error:', e));
      }, config.updateIntervalMs);

      console.log(
        `Status panel live in #${channel.name || channel.id}, refreshing every ${
          config.updateIntervalMs / 1000
        }s.`
      );
    } catch (err) {
      console.error('Could not initialize status panel channel:', err.message);
    }
  } else {
    console.log('No CHANNEL_ID set — use /setup-status in a channel to start a panel.');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'status') {
    await interaction.deferReply({ ephemeral: true });
    const status = await getCombinedStatus();
    await refreshPanel(interaction.channel);
    await interaction.editReply(
      status.online
        ? `✅ Panel refreshed — ${status.players.online}/${status.players.max} players online.`
        : '⚠️ Panel refreshed — server appears to be offline.'
    );
  }

  if (interaction.commandName === 'setup-status') {
    await interaction.deferReply({ ephemeral: true });
    panels.delete(interaction.channel.id);
    await refreshPanel(interaction.channel);
    await interaction.editReply('✅ Live status panel created in this channel.');
  }
});

client.login(config.token);
