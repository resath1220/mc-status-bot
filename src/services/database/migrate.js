const db = require('./db');
const config = require('../../config');
const logger = require('../../utils/logger');

/**
 * If the bot has never had any servers registered yet, and the old
 * single-server env vars (JAVA_HOST/BEDROCK_HOST/CHANNEL_ID/GUILD_ID) are
 * still present, seed one server + panel from them automatically. This runs
 * once — after the first successful seed, servers live entirely in the DB
 * and these env vars can be deleted.
 */
function seedLegacyServer(client) {
  const { legacy, guildId } = config;
  const hasLegacyHost = legacy.javaHost || legacy.bedrockHost;
  if (!hasLegacyHost || !guildId) return;

  const anyServers = db.getServersByGuild(guildId);
  if (anyServers.length > 0) return; // already migrated or manually configured

  const host = legacy.javaHost || legacy.bedrockHost;
  const port = legacy.javaHost ? legacy.javaPort : legacy.bedrockPort;
  const edition = legacy.javaHost ? 'java' : 'bedrock';

  const server = db.addServer({
    guildId,
    name: legacy.serverName || 'Minecraft Server',
    host,
    port,
    edition,
    updateIntervalMs: config.defaultUpdateIntervalMs,
    iconUrl: legacy.serverIconUrl,
  });

  if (legacy.channelId) {
    db.setPanel(server.id, { channelId: legacy.channelId, messageId: null });
  }

  logger.info(`Migrated legacy .env config into database as server "${server.name}" (id ${server.id}).`);
}

module.exports = { seedLegacyServer };
