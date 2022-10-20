const supabase = require("../helpers/supabaseClient");
const schedule = require('node-schedule');
const Time = require("../helpers/time");
const TodoReminderMessage = require("../views/TodoReminderMessage");
const ChannelController = require("./ChannelController");
const HighlightReminderMessage = require("../views/HighlightReminderMessage");

class ReminderController{
    static remindPostProgress(client){
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
					if (!Time.isCooldownPeriod()) {
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
									const notificationThread = await ChannelController.getNotificationThread(client,data.id,data.notification_id)
									notificationThread.send(TodoReminderMessage.progressReminder(userId))
								}
							}
						})
					}
				
				})
			})
			
		})
        
    }

    static remindSetHighlight(client){
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
						if(!Time.isCooldownPeriod()){
							supabase.from('Users')
							.select()
							.eq('id',user.id)
							.single()
							.then(async ({data})=>{
								if (data) {
									if (user.reminder_highlight !== data.reminder_highlight) {
										scheduleReminderHighlight.cancel()
									}else if(data.last_highlight !== Time.getDate().toISOString().substring(0,10)){
										const userId = data.id;
										const notificationThread = await ChannelController.getNotificationThread(client,data.id,data.notification_id)
										notificationThread.send(HighlightReminderMessage.highlightReminder(userId))
									}
								}
							})
						}
					})
				})
				
			})
    }

    static remindHighlightUser(client){
        supabase.from('Reminders')
			.select('*,Users(notification_id)')
			.gte('time',new Date().toUTCString())
			.eq('type',"highlight")
			.then(data=>{
				data.body.forEach(reminder=>{
					schedule.scheduleJob(reminder.time,async function() {
						const notificationThread = await ChannelController.getNotificationThread(client,reminder.UserId,reminder.Users.notification_id)
						notificationThread.send(`Hi <@${reminder.UserId}> reminder: ${reminder.message} `)
					})
				})
			})
    }
	
}

module.exports = ReminderController