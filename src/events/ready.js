const logger = require('../utils/logger');
const { restoreAllMonitors } = require('../services/monitoring/monitor');
const { seedLegacyServer } = require('../services/database/migrate');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`Logged in as ${client.user.tag}`);
    client.user.setActivity('Minecraft servers', { type: 3 }); // Watching

    seedLegacyServer(client);
    restoreAllMonitors(client);
  },
};
