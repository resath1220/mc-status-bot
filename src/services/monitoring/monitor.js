const { getServerStatus } = require('../minecraft/mcstatus');
const { buildStatusPayload } = require('../../ui/dashboard');
const { stateChangeEmbed } = require('../../ui/embeds');
const db = require('../database/db');
const logger = require('../../utils/logger');

// serverId -> { timer, running }
const jobs = new Map();

/**
 * Runs a single check-and-update cycle for one server. Safe to call directly
 * (e.g. from /status-refresh) as well as from the scheduled interval.
 * Skips the run entirely if a previous cycle for this server is still in flight.
 */
async function runCycle(client, serverId) {
  const job = jobs.get(serverId) || {};
  if (job.running) {
    logger.warn(`Skipping cycle for server ${serverId} — previous update still running.`);
    return null;
  }
  jobs.set(serverId, { ...job, running: true });

  try {
    const server = db.getServerById(serverId);
    if (!server || !server.enabled) return null;

    const status = await getServerStatus({ host: server.host, port: server.port, edition: server.edition });
    db.recordCheck(serverId, status);

    const previouslyOnline = server.last_online;
    const stateChanged = previouslyOnline !== null && previouslyOnline !== (status.online ? 1 : 0);
    db.setLastOnline(serverId, status.online);

    if (server.channel_id) {
      await updatePanelMessage(client, server, status);
    }

    if (stateChanged && server.channel_id) {
      await sendStateChangeNotification(client, server, status);
    }

    return status;
  } catch (err) {
    logger.error(`Monitoring cycle failed for server ${serverId}:`, err.message);
    return null;
  } finally {
    const current = jobs.get(serverId) || {};
    jobs.set(serverId, { ...current, running: false });
  }
}

async function updatePanelMessage(client, server, status) {
  try {
    const channel = await client.channels.fetch(server.channel_id);
    const payload = await buildStatusPayload(server, status);

    if (server.message_id) {
      try {
        const msg = await channel.messages.fetch(server.message_id);
        await msg.edit(payload);
        return;
      } catch (err) {
        logger.warn(`Panel message missing for server ${server.id} (${err.message}) — re-posting.`);
      }
    }

    const msg = await channel.send(payload);
    db.setPanel(server.id, { channelId: server.channel_id, messageId: msg.id });
  } catch (err) {
    logger.error(`Could not update panel for server ${server.id}:`, err.message);
  }
}

async function sendStateChangeNotification(client, server, status) {
  try {
    const channel = await client.channels.fetch(server.channel_id);
    await channel.send({ embeds: [stateChangeEmbed(server, status, status.online)] });
  } catch (err) {
    logger.error(`Could not send state-change notification for server ${server.id}:`, err.message);
  }
}

/**
 * Starts (or restarts) the recurring interval for one server.
 */
function startServerMonitor(client, serverId) {
  stopServerMonitor(serverId);
  const server = db.getServerById(serverId);
  if (!server || !server.enabled) return;

  runCycle(client, serverId).catch((e) => logger.error('Initial cycle error:', e.message));

  const timer = setInterval(() => {
    runCycle(client, serverId).catch((e) => logger.error('Scheduled cycle error:', e.message));
  }, server.update_interval_ms || 30000);

  jobs.set(serverId, { ...(jobs.get(serverId) || {}), timer });
}

function stopServerMonitor(serverId) {
  const job = jobs.get(serverId);
  if (job?.timer) clearInterval(job.timer);
  jobs.set(serverId, { running: job?.running || false, timer: null });
}

/**
 * Restores monitoring for every enabled server on boot, so the bot survives
 * restarts without requiring the admin to re-run /setup-status.
 */
function restoreAllMonitors(client) {
  const servers = db.getAllEnabledServers();
  for (const server of servers) {
    startServerMonitor(client, server.id);
  }
  logger.info(`Restored monitoring for ${servers.length} server(s).`);
}

module.exports = { runCycle, startServerMonitor, stopServerMonitor, restoreAllMonitors };
