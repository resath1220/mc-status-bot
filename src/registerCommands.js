const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');
const logger = require('./utils/logger');

const commandsDir = path.join(__dirname, 'commands');
const commands = fs
  .readdirSync(commandsDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => require(path.join(commandsDir, f)).data.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    logger.info(`Registering ${commands.length} slash command(s)...`);
    if (config.guildId) {
      // Guild commands register instantly — best for development.
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
      logger.info(`Registered guild commands for guild ${config.guildId}.`);
    } else {
      // Global commands can take up to an hour to propagate.
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      logger.info('Registered global commands.');
    }
  } catch (err) {
    logger.error('Failed to register commands:', err);
    process.exit(1);
  }
})();
