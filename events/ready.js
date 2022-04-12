const {GUILD_ID,CHANNEL_REMINDER, MY_ID} = require('../helpers/config')
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
		supabase.from('Reminders')
			.select()
			.gte('time',new Date().toUTCString())
			.then(data=>{
				data.body.forEach(reminder=>{
					schedule.scheduleJob(reminder.time,function() {
						channelReminder.send(`Hi <@${reminder.UserId}> reminder: ${reminder.message} `)
					})
				})
			})
		supabase.from('Users')
			.select()
			.neq('reminder_highlight',null)
			.then(data=>{
				data.body.forEach(user=>{
					const [hours,minutes] = user.reminder_highlight.split(/[.:]/)
					
					let ruleReminderHighlight = new schedule.RecurrenceRule();
					ruleReminderHighlight.hour = Time.minus7Hours(hours)
					ruleReminderHighlight.minute = minutes
					const scheduleReminderHighlight = schedule.scheduleJob(ruleReminderHighlight,function(){
						supabase.from('Users')
						.select()
						.eq('id',user.id)
						.single()
						.then(async ({data})=>{
							if (data) {
								if (user.reminder_highlight !== data.reminder_highlight) {
									console.log('matiin reminder highligth');
									scheduleReminderHighlight.cancel()
								}else if(data.last_highlight !== Time.getDate().toISOString().substring(0,10)){
									const userId = data.id;
									channelReminder.send(HighlightReminderMessage.highlightReminder(userId))
								}
							}
						})
					
					})
				})
				
			})
		let ruleReminderHighlight = new schedule.RecurrenceRule();
		ruleReminderHighlight.hour = Time.minus7Hours(7)
		ruleReminderHighlight.minute = 30
		schedule.scheduleJob(ruleReminderHighlight,function(){
			supabase.from('Users')
			.select()
			.neq('last_highlight',Time.getDate().toISOString().substring(0,10))
			.is('reminder_highlight',null)
			.then(async data=>{
				for (let i = 0; i < data.body.length; i++) {
					const userId = data.body[i].id;
					channelReminder.send(HighlightReminderMessage.highlightReminder(userId))
				}
			})
		
		})
		supabase.from('Users')
		.select()
		.neq('reminder_progress',null)
		.then(data=>{
			data.body.forEach(user=>{
				const [hours,minutes] = user.reminder_progress.split(/[.:]/)
			
				let ruleReminderProgress = new schedule.RecurrenceRule();
				ruleReminderProgress.hour = Time.minus7Hours(hours)
				ruleReminderProgress.minute = minutes
				const scheduleReminderProgress = schedule.scheduleJob(ruleReminderProgress,function(){
					supabase.from('Users')
					.select()
					.eq('id',user.id)
					.single()
					.then(async ({data})=>{
						if (data) {
							if (user.reminder_progress !== data.reminder_progress) {
								scheduleReminderProgress.cancel()
							}else if (data.last_done !== Time.getDate().toISOString().substring(0,10)) {
								const userId = data.id;
								channelReminder.send(TodoReminderMessage.progressReminder(userId))
							}
						}
					})
				
				})
			})
			
		})
		let ruleReminderDone = new schedule.RecurrenceRule();
		ruleReminderDone.hour = Time.minus7Hours(21)
		ruleReminderDone.minute = 0
		schedule.scheduleJob(ruleReminderDone,function(){
			supabase.from('Users')
			.select()
			.neq('last_done',Time.getDate().toISOString().substring(0,10))
			.is('reminder_progress',null)
			.then(async data=>{
				for (let i = 0; i < data.body.length; i++) {
					const userId = data.body[i].id;
					channelReminder.send(TodoReminderMessage.progressReminder(userId))
				}
			})
		
		})

		const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(MY_ID)
		user.send("Restart Bot")
	},
};