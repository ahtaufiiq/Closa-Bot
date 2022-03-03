const {REST} = require('@discordjs/rest')
const {Routes} = require('discord-api-types/v9')
const fs = require('fs')
const {CLIENT_ID,GUILD_ID,TOKEN} = require('./helpers/config')

const commands = []; 
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	commands.push(command.data.toJSON())
}
  
  const rest = new REST({ version: '9' }).setToken(TOKEN);
  
  (async () => {
    try {
      console.log('Started refreshing application (/) commands.');
  
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands },
      );
  
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  })();