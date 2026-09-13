require('dotenv').config();

function bool(v, fallback = false) {
  if (v === undefined || v === null || v === '') return fallback;
  return v === 'true' || v === '1';
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  channelId: process.env.CHANNEL_ID,
  guildId: process.env.GUILD_ID,

  serverName: process.env.SERVER_NAME || 'MINECRAFT NETWORK',
  serverSubtitle: process.env.SERVER_SUBTITLE || 'Server Status',

  javaHost: process.env.JAVA_HOST,
  javaPort: Number(process.env.JAVA_PORT) || 25565,

  bedrockHost: process.env.BEDROCK_HOST,
  bedrockPort: Number(process.env.BEDROCK_PORT) || 19132,

  serverIconUrl: process.env.SERVER_ICON_URL || null,

  updateIntervalMs: Number(process.env.UPDATE_INTERVAL_MS) || 30000,
  maxPlayerChips: Number(process.env.MAX_PLAYER_CHIPS) || 10,
};
