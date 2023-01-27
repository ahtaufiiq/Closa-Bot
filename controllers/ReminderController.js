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
		.gte('endMembership',Time.getDateOnly(Time.getDate()))
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
							.then(async ({body:data})=>{
								if (data) {
									if (user.reminderProgress !== data.reminderProgress) {
										scheduleReminderProgress.cancel()
									}else if (data.lastDone !== Time.getDate().toISOString().substring(0,10) && !data.onVacation) {
										const {id:userId,notificationId} = data;
										ChannelController.sendToNotification(
											client,
											TodoReminderMessage.progressReminder(userId),
											userId,
											notificationId
										)
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
			.gte('endMembership',Time.getDateOnly(Time.getDate()))
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
								.then(async ({body:data})=>{
									if (data) {
										if (user.reminderHighlight !== data.reminderHighlight) {
											scheduleReminderHighlight.cancel()
										}else if(data.lastHighlight !== Time.getDate().toISOString().substring(0,10) && !data.onVacation){
											const {id:userId,notificationId} = data;
											ChannelController.sendToNotification(
												client,
												HighlightReminderMessage.highlightReminder(userId),
												userId,
												notificationId
											)
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
							ChannelController.sendToNotification(
								client,
								HighlightReminderMessage.remindHighlightUser(reminder.UserId,reminder.message),
								reminder.UserId,
								reminder.Users.notificationId
							)
						})
					})
				}
			})
    }
}

module.exports = ReminderController