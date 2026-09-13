const util = require('minecraft-server-util');
const config = require('./config');

/**
 * Pings the Java server. Returns a normalized status object.
 * Never throws — resolves to { online: false } on failure.
 */
async function getJavaStatus() {
  try {
    const res = await util.status(config.javaHost, config.javaPort, {
      timeout: 5000,
      enableSRV: true,
    });

    return {
      online: true,
      players: {
        online: res.players.online,
        max: res.players.max,
        sample: (res.players.sample || []).map((p) => p.name),
      },
      version: res.version?.name?.replace(/§./g, '') || 'Unknown',
      motd: res.motd?.clean || '',
      ping: res.roundTripLatency ?? null,
      favicon: res.favicon || null,
    };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Pings the Bedrock server. Returns a normalized status object.
 * Never throws — resolves to { online: false } on failure.
 */
async function getBedrockStatus() {
  try {
    const res = await util.statusBedrock(config.bedrockHost, config.bedrockPort, {
      timeout: 5000,
    });

    return {
      online: true,
      players: {
        online: res.players.online,
        max: res.players.max,
      },
      version: res.version?.name || 'Unknown',
      motd: res.motd?.clean || '',
      ping: res.roundTripLatency ?? null,
    };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Fetches both Java and Bedrock status in parallel and merges them into a
 * single object the renderer/embed builder can consume.
 */
async function getCombinedStatus() {
  const [java, bedrock] = await Promise.all([getJavaStatus(), getBedrockStatus()]);

  const online = java.online || bedrock.online;

  // Prefer Java's richer player data (sample names) when available,
  // otherwise fall back to Bedrock's counts.
  const primary = java.online ? java : bedrock;

  return {
    online,
    java,
    bedrock,
    players: primary.players || { online: 0, max: 0, sample: [] },
    version: primary.version || 'Unknown',
    motd: primary.motd || '',
    ping: primary.ping ?? null,
    favicon: java.favicon || null,
    checkedAt: new Date(),
  };
}

module.exports = { getJavaStatus, getBedrockStatus, getCombinedStatus };
