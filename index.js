const { Client, Intents, Collection } = require('discord.js')
const fs = require('fs')
const { TOKEN, SENTRY_DSN} = require('./helpers/config');
const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')

const client = new Client({ 
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS,Intents.FLAGS.GUILD_SCHEDULED_EVENTS],
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

Sentry.init({
	dsn: SENTRY_DSN,
  
	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,
  });
  
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


client.login(TOKEN);