const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js')
const fs = require('fs')
const { TOKEN, SENTRY_DSN} = require('./helpers/config');
const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')
const {ProfilingIntegration} = require('@sentry/profiling-node')
const client = new Client({ 
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions,GatewayIntentBits.GuildScheduledEvents],
	partials: [Partials.Channel,Partials.Message,Partials.Reaction],
});
const discordModals = require('discord-modals'); // Define the discord-modals package!
discordModals(client);
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
    integrations: [
		// add profiling integration
		new ProfilingIntegration()
	  ],
	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,
	profilesSampleRate: 1.0,
  });
  
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

const focusRoomUser = {
}

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}else {
		if(file === 'interactionCreate.js' || file === 'voiceStateUpdate.js' || file === 'ready.js'){
			client.on(event.name, (...args) => event.execute(...args,focusRoomUser));
		}else{
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
}


client.login(TOKEN);