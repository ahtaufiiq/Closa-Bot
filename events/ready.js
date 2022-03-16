const {GUILD_ID,CHANNEL_REMINDER} = require('../helpers/config')
const supabase  = require('../helpers/supabaseClient');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
const TodoReminderMessage = require('../views/TodoReminderMessage');
module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		const channelReminder = await client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_REMINDER)
		var ruleReminderHighlight = new schedule.RecurrenceRule();
		ruleReminderHighlight.hour = Time.minus7Hours(9)
		ruleReminderHighlight.minute = 0
		schedule.scheduleJob(ruleReminderHighlight,function(){
			supabase.from('Users')
			.select()
			.neq('last_highlight',Time.getDate().toISOString().substring(0,10))
			.then(async data=>{
				for (let i = 0; i < data.body.length; i++) {
					const userId = data.body[i].id;
					channelReminder.send(HighlightReminderMessage.highlightReminder(userId))
				}
			})
		
		})
		var ruleReminderDone = new schedule.RecurrenceRule();
		ruleReminderDone.hour = Time.minus7Hours(21)
		ruleReminderDone.minute = 0
		schedule.scheduleJob(ruleReminderDone,function(){
			supabase.from('Users')
			.select()
			.neq('last_done',Time.getDate().toISOString().substring(0,10))
			.then(async data=>{
				for (let i = 0; i < data.body.length; i++) {
					const userId = data.body[i].id;
					channelReminder.send(TodoReminderMessage.progressReminder(userId))
				}
			})
		
		})
	},
};