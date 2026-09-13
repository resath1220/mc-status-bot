const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const config = require('./config');
const logger = require('./utils/logger');

if (!config.token) {
  logger.error('Missing DISCORD_TOKEN in .env — see .env.example.');
  process.exit(1);
}
if (!config.clientId) {
  logger.error('Missing CLIENT_ID in .env — see .env.example.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

// ── Load commands ─────────────────────────────────────────────
client.commands = new Collection();
const commandsDir = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsDir, file));
  if (command?.data?.name) {
    client.commands.set(command.data.name, command);
  }
}
logger.info(`Loaded ${client.commands.size} command(s).`);

// ── Load events ───────────────────────────────────────────────
const eventsDir = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsDir, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}
logger.info(`Loaded ${fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js')).length} event handler(s).`);

process.on('unhandledRejection', (err) => logger.error('Unhandled rejection:', err));

client.login(config.token);
