const util = require('minecraft-server-util');
const config = require('../../config');

/**
 * Pings a Java Edition server. Never throws — resolves to { online: false } on failure.
 */
async function getJavaStatus(host, port) {
  try {
    const res = await util.status(host, port, {
      timeout: config.requestTimeoutMs,
      enableSRV: true,
    });

    return {
      online: true,
      edition: 'java',
      players: {
        online: res.players.online,
        max: res.players.max,
        sample: (res.players.sample || []).map((p) => p.name),
        sampleIsPartial: res.players.online > (res.players.sample || []).length,
      },
      version: res.version?.name?.replace(/§./g, '') || 'Unknown',
      motd: res.motd?.clean || '',
      ping: res.roundTripLatency ?? null,
      favicon: res.favicon || null,
    };
  } catch (err) {
    return { online: false, edition: 'java', error: err.message };
  }
}

/**
 * Pings a Bedrock Edition server. Never throws — resolves to { online: false } on failure.
 * Bedrock's protocol does not expose a player sample, only counts.
 */
async function getBedrockStatus(host, port) {
  try {
    const res = await util.statusBedrock(host, port, {
      timeout: config.requestTimeoutMs,
    });

    return {
      online: true,
      edition: 'bedrock',
      players: {
        online: res.players.online,
        max: res.players.max,
        sample: [],
        sampleIsPartial: false,
      },
      version: res.version?.name || 'Unknown',
      motd: res.motd?.clean || '',
      ping: res.roundTripLatency ?? null,
      favicon: null,
    };
  } catch (err) {
    return { online: false, edition: 'bedrock', error: err.message };
  }
}

/**
 * Queries a server, respecting an explicit edition when the caller knows it,
 * or auto-detecting by trying Java then falling back to Bedrock.
 *
 * Returns a normalized status object. `edition` reflects which protocol
 * actually answered ('java' | 'bedrock' | null when both failed).
 */
async function getServerStatus({ host, port, edition = 'auto' }) {
  if (edition === 'java') {
    const java = await getJavaStatus(host, port);
    return normalize(java, host, port);
  }
  if (edition === 'bedrock') {
    const bedrock = await getBedrockStatus(host, port);
    return normalize(bedrock, host, port);
  }

  // auto: try both in parallel, prefer Java's richer data if both answer
  // (mixed deployments sometimes expose the same host on both protocols).
  const [java, bedrock] = await Promise.all([
    getJavaStatus(host, port),
    getBedrockStatus(host, port),
  ]);

  if (java.online) return normalize(java, host, port);
  if (bedrock.online) return normalize(bedrock, host, port);

  return normalize(java, host, port); // both offline — report the Java attempt's error
}

function normalize(result, host, port) {
  return {
    online: result.online,
    edition: result.online ? result.edition : null,
    host,
    port,
    players: result.players || { online: 0, max: 0, sample: [], sampleIsPartial: false },
    version: result.version || 'Unknown',
    motd: result.motd || '',
    ping: result.ping ?? null,
    favicon: result.favicon || null,
    error: result.error || null,
    checkedAt: new Date(),
  };
}

module.exports = { getJavaStatus, getBedrockStatus, getServerStatus };
