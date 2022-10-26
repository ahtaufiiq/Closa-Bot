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
		.neq('reminderProgress',null)
		.then(data=>{
			if (data.body) {
				data.body.forEach(user=>{
					const [hours,minutes] = user.reminderProgress.split(/[.:]/)
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
									if (user.reminderProgress !== data.reminderProgress) {
										scheduleReminderProgress.cancel()
									}else if (data.lastDone !== Time.getDate().toISOString().substring(0,10)) {
										const userId = data.id;
										const notificationThread = await ChannelController.getNotificationThread(client,data.id,data.notificationId)
										notificationThread.send(TodoReminderMessage.progressReminder(userId))
									}
								}
							})
						}
					
					})
				})
			}
			
		})
        
    }

    static remindSetHighlight(client){
        supabase.from('Users')
			.select()
			.neq('reminderHighlight',null)
			.then(data=>{
				if(data.body){
					data.body.forEach(user=>{
						const [hours,minutes] = user.reminderHighlight.split(/[.:]/)
						
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
										if (user.reminderHighlight !== data.reminderHighlight) {
											scheduleReminderHighlight.cancel()
										}else if(data.lastHighlight !== Time.getDate().toISOString().substring(0,10)){
											const userId = data.id;
											const notificationThread = await ChannelController.getNotificationThread(client,data.id,data.notificationId)
											notificationThread.send(HighlightReminderMessage.highlightReminder(userId))
										}
									}
								})
							}
						})
					})
					
				}
				
			})
    }

    static remindHighlightUser(client){
        supabase.from('Reminders')
			.select('*,Users(notificationId)')
			.gte('time',new Date().toUTCString())
			.eq('type',"highlight")
			.then(data=>{
				if(data.body){
					data.body.forEach(reminder=>{
						schedule.scheduleJob(reminder.time,async function() {
							const notificationThread = await ChannelController.getNotificationThread(client,reminder.UserId,reminder.Users.notificationId)
							notificationThread.send(`Hi <@${reminder.UserId}> reminder: ${reminder.message} `)
						})
					})
				}
			})
    }
	
}

module.exports = ReminderController