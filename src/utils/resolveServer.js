const db = require('../services/database/db');

/**
 * Resolves the target server for a command:
 * - if a `server` option was given, look it up by name
 * - otherwise, if the guild only monitors one server, use it
 * - otherwise, return null (caller should ask the user to specify one)
 */
function resolveServer(interaction, optionName = 'server') {
  const guildId = interaction.guildId;
  const name = interaction.options?.getString?.(optionName);

  if (name) {
    return db.getServerByName(guildId, name) || null;
  }

  const servers = db.getServersByGuild(guildId);
  if (servers.length === 1) return servers[0];
  return null;
}

module.exports = { resolveServer };
