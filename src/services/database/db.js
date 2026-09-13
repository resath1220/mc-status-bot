const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('../../config');
const logger = require('../../utils/logger');

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id          TEXT NOT NULL,
    name              TEXT NOT NULL,
    host              TEXT NOT NULL,
    port              INTEGER NOT NULL,
    edition           TEXT NOT NULL DEFAULT 'auto',   -- 'java' | 'bedrock' | 'auto'
    channel_id        TEXT,
    message_id        TEXT,
    icon_url          TEXT,
    update_interval_ms INTEGER NOT NULL DEFAULT 30000,
    enabled           INTEGER NOT NULL DEFAULT 1,
    last_online       INTEGER,                        -- NULL until first check
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(guild_id, host, port)
  );

  CREATE TABLE IF NOT EXISTS server_stats (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id    INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    checked_at   TEXT NOT NULL DEFAULT (datetime('now')),
    online       INTEGER NOT NULL,
    players      INTEGER,
    max_players  INTEGER,
    ping         INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_server_stats_server_id ON server_stats(server_id);
  CREATE INDEX IF NOT EXISTS idx_servers_guild_id ON servers(guild_id);
`);

// ── Servers ───────────────────────────────────────────────────

function addServer({ guildId, name, host, port, edition = 'auto', updateIntervalMs, iconUrl = null }) {
  const stmt = db.prepare(`
    INSERT INTO servers (guild_id, name, host, port, edition, update_interval_ms, icon_url)
    VALUES (@guildId, @name, @host, @port, @edition, @updateIntervalMs, @iconUrl)
  `);
  const info = stmt.run({
    guildId,
    name,
    host,
    port,
    edition,
    updateIntervalMs: updateIntervalMs || config.defaultUpdateIntervalMs,
    iconUrl,
  });
  return getServerById(info.lastInsertRowid);
}

function getServerById(id) {
  return db.prepare(`SELECT * FROM servers WHERE id = ?`).get(id);
}

function getServersByGuild(guildId) {
  return db.prepare(`SELECT * FROM servers WHERE guild_id = ? ORDER BY id ASC`).all(guildId);
}

function getServerByName(guildId, name) {
  return db
    .prepare(`SELECT * FROM servers WHERE guild_id = ? AND LOWER(name) = LOWER(?)`)
    .get(guildId, name);
}

function getAllEnabledServers() {
  return db.prepare(`SELECT * FROM servers WHERE enabled = 1`).all();
}

function removeServer(id) {
  return db.prepare(`DELETE FROM servers WHERE id = ?`).run(id);
}

function setPanel(id, { channelId, messageId }) {
  return db
    .prepare(`UPDATE servers SET channel_id = ?, message_id = ? WHERE id = ?`)
    .run(channelId, messageId, id);
}

function clearPanel(id) {
  return db.prepare(`UPDATE servers SET channel_id = NULL, message_id = NULL WHERE id = ?`).run(id);
}

function setEnabled(id, enabled) {
  return db.prepare(`UPDATE servers SET enabled = ? WHERE id = ?`).run(enabled ? 1 : 0, id);
}

function setUpdateInterval(id, ms) {
  return db.prepare(`UPDATE servers SET update_interval_ms = ? WHERE id = ?`).run(ms, id);
}

function setLastOnline(id, online) {
  return db.prepare(`UPDATE servers SET last_online = ? WHERE id = ?`).run(online ? 1 : 0, id);
}

// ── Stats ─────────────────────────────────────────────────────

function recordCheck(serverId, status) {
  db.prepare(`
    INSERT INTO server_stats (server_id, online, players, max_players, ping)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    serverId,
    status.online ? 1 : 0,
    status.online ? status.players?.online ?? null : null,
    status.online ? status.players?.max ?? null : null,
    status.online ? status.ping ?? null : null
  );

  // Keep the table bounded — retain the most recent 5,000 checks per server.
  db.prepare(`
    DELETE FROM server_stats
    WHERE server_id = ? AND id NOT IN (
      SELECT id FROM server_stats WHERE server_id = ? ORDER BY id DESC LIMIT 5000
    )
  `).run(serverId, serverId);
}

function getStatsSummary(serverId) {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS totalChecks,
         SUM(online) AS onlineChecks,
         MAX(players) AS peakPlayers,
         AVG(CASE WHEN online = 1 THEN players END) AS avgPlayers,
         AVG(CASE WHEN online = 1 THEN ping END) AS avgPing,
         MIN(checked_at) AS since
       FROM server_stats WHERE server_id = ?`
    )
    .get(serverId);

  const totalChecks = row.totalChecks || 0;
  const onlineChecks = row.onlineChecks || 0;
  return {
    totalChecks,
    onlineChecks,
    downtimeChecks: totalChecks - onlineChecks,
    uptimePercent: totalChecks ? (onlineChecks / totalChecks) * 100 : null,
    peakPlayers: row.peakPlayers ?? null,
    avgPlayers: row.avgPlayers !== null ? Math.round(row.avgPlayers * 10) / 10 : null,
    avgPing: row.avgPing !== null ? Math.round(row.avgPing) : null,
    since: row.since,
  };
}

logger.info(`Database ready at ${config.dbPath}`);

module.exports = {
  db,
  addServer,
  getServerById,
  getServersByGuild,
  getServerByName,
  getAllEnabledServers,
  removeServer,
  setPanel,
  clearPanel,
  setEnabled,
  setUpdateInterval,
  setLastOnline,
  recordCheck,
  getStatsSummary,
};
