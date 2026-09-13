require('dotenv').config();

function bool(v, fallback = false) {
  if (v === undefined || v === null || v === '') return fallback;
  return v === 'true' || v === '1';
}

function int(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

module.exports = {
  // ── Discord auth ──────────────────────────────────────────
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null, // optional: instant guild-scoped command registration

  // ── Defaults for newly-added servers ─────────────────────
  defaultUpdateIntervalMs: int(process.env.UPDATE_INTERVAL_MS, 30000),
  maxPlayerChips: int(process.env.MAX_PLAYER_CHIPS, 10),
  minUpdateIntervalMs: 15000, // floor to protect against accidental hammering
  requestTimeoutMs: int(process.env.REQUEST_TIMEOUT_MS, 5000),

  // ── Legacy single-server env vars (used once, to auto-seed
  // the database on first run so existing deployments keep working
  // without re-running setup). Safe to remove after first boot. ──
  legacy: {
    serverName: process.env.SERVER_NAME || null,
    javaHost: process.env.JAVA_HOST || null,
    javaPort: int(process.env.JAVA_PORT, 25565),
    bedrockHost: process.env.BEDROCK_HOST || null,
    bedrockPort: int(process.env.BEDROCK_PORT, 19132),
    channelId: process.env.CHANNEL_ID || null,
    serverIconUrl: process.env.SERVER_ICON_URL || null,
  },

  // ── Misc ──────────────────────────────────────────────────
  dbPath: process.env.DB_PATH || require('path').join(__dirname, '..', 'data', 'monitor.sqlite'),
  ownerNotifyOnStateChangeOnly: true,
};
