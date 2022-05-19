const {GUILD_ID,CHANNEL_REMINDER, MY_ID} = require('../helpers/config')
const supabase  = require('../helpers/supabaseClient');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const Email = require('../helpers/Email');
module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		let rulePaymentReminder = new schedule.RecurrenceRule();
		rulePaymentReminder.hour = Time.minus7Hours(8)
		rulePaymentReminder.minute = 0
// 		schedule.scheduleJob(rulePaymentReminder,function(){
// 			supabase.from('Users')
// 			.select('email,name')
// 			.eq('end_membership',Time.getReminderDate(5))
// 			.then(async data=>{
// 				if (data.body) {
// 					const endedMembership = Time.getFormattedDate(Time.getNextDate(5))
// 					Email.sendPaymentReminder(data.body,'5 days',endedMembership)
// 				}
// 			})
// 			supabase.from('Users')
// 			.select('email,name')
// 			.eq('end_membership',Time.getReminderDate(3))
// 			.then(async data=>{
// 				if (data.body) {
// 					const endedMembership = Time.getFormattedDate(Time.getNextDate(3))
// 					Email.sendPaymentReminder(data.body,'3 days',endedMembership)
// 				}
// 			})
// 			supabase.from('Users')
// 			.select('email,name')
// 			.eq('end_membership',Time.getReminderDate(1))
// 			.then(async data=>{
// 				if (data.body) {
// 					const endedMembership = Time.getFormattedDate(Time.getNextDate(1))
// 					Email.sendPaymentReminder(data.body,'1 day',endedMembership)
// 					for (let i = 0; i < data.body.length; i++) {
// 						const {id} = data.body[i];
// 						const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(id)
// 						user.send(`Hi ${user} :wave:,
// Thank you for being part of Closa Community :sparkles:.

// **A friendly reminder that your Closa membership will be ended within the next 1 day  on ${endedMembership}.
// You can extend your membership period via this link**—  https://tally.so/r/wbRa2w`)
// 					}
// 				}
// 			})
// 			supabase.from('Users')
// 			.select('id,email,name')
// 			.eq('end_membership',Time.getReminderDate())
// 			.then(async data=>{
// 				if (data.body) {
// 					const endedMembership = Time.getFormattedDate(Time.getDate())
// 					Email.sendPaymentReminder(data.body,'0',endedMembership)
// 					for (let i = 0; i < data.body.length; i++) {
// 						const {id} = data.body[i];
// 						const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(id)
// 						user.send(`Hi ${user} :wave:,
// Thank you for being part of Closa Community :sparkles:.

// **A friendly reminder that your Closa membership will be ended today on ${endedMembership}.
// You can extend your membership period via this link**—  https://tally.so/r/wbRa2w`)
// 					}
// 				}
// 			})
		
// 		})
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
		

		const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(MY_ID)
		user.send("Restart Bot")
	},
};
