const {GUILD_ID,CHANNEL_REMINDER} = require('../helpers/config')
const supabase  = require('../helpers/supabaseClient');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		const channelReminder = await client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_REMINDER)
		var ruleReminderHighlight = new schedule.RecurrenceRule();
		ruleReminderHighlight.hour = Time.add7Hours(9)
		ruleReminderHighlight.minute = 0
		schedule.scheduleJob(ruleReminderHighlight,function(){
			supabase.from('Users')
			.select()
			.neq('last_highlight',new Date().toISOString().substring(0,10))
			.then(async data=>{
				for (let i = 0; i < data.body.length; i++) {
					const userId = data.body[i].id;
					channelReminder.send({content:HighlightReminderMessage.reminderHighlight(userId),ephemeral:true})
				}
			})
		
		})
	},
};