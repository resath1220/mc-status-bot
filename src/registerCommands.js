const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Force-refresh the Minecraft server status panel now.'),
  new SlashCommandBuilder()
    .setName('setup-status')
    .setDescription('Post a new auto-updating status panel in this channel.'),
].map((c) => c.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('Registering slash commands...');
    if (config.guildId) {
      // Guild commands register instantly — best for development.
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commands,
      });
      console.log(`Registered guild commands for guild ${config.guildId}.`);
    } else {
      // Global commands can take up to an hour to propagate.
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      console.log('Registered global commands.');
    }
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
})();
