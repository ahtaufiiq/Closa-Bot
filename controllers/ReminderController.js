const supabase = require("../helpers/supabaseClient");
const schedule = require('node-schedule');
const Time = require("../helpers/time");
const TodoReminderMessage = require("../views/TodoReminderMessage");
const ChannelController = require("./ChannelController");
const HighlightReminderMessage = require("../views/HighlightReminderMessage");
const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const MemberController = require("./MemberController");
class ReminderController{

	static showModalSetHighlightReminder(interaction){
		const [commandButton,userId] = interaction.customId.split('_')
        if(commandButton === 'setReminderHighlight'){
			if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't set someone else highlight.`})

			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set Reminder 🔔")
			.addComponents(
				new TextInputComponent().setCustomId('taskName').setLabel('Task name').setPlaceholder("e.g. design exploration at 20.00 wib").setStyle("SHORT").setRequired(true)
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

    static remindPostProgress(client){
        supabase.from('Users')
		.select()
		.neq('reminderProgress',null)
		.neq('goalId',null)
		.gte('lastActive',Time.getDateOnly(Time.getNextDate(-7)))
		.then(async data=>{
			if (data.data) {
				for (let i = 0; i < data.data.length; i++) {
					const user = data.data[i];
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
									}else if (data.lastDone !== Time.getDate().toISOString().substring(0,10) && !data.onVacation) {
										const {id:userId,notificationId} = data;
										await ChannelController.sendToNotification(
											client,
											TodoReminderMessage.progressReminder(userId),
											userId,
											notificationId,
											true
										)
									}
								}
							})
						}
					})
				}
			}
			
		})
        
    }

    static remindSetHighlight(client){
        supabase.from('Users')
			.select()
			.neq('reminderHighlight',null)
			.neq('goalId',null)
			.gte('lastActive',Time.getDateOnly(Time.getNextDate(-7)))
			.then(data=>{
				if(data.data){
					for (let i = 0; i < data.data.length; i++) {
						const user = data.data[i];
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
										}else if(data.lastHighlight !== Time.getDate().toISOString().substring(0,10) && data.lastDone !== Time.getDate().toISOString().substring(0,10) && !data.onVacation){
											const {id:userId,notificationId} = data;
											await ChannelController.sendToNotification(
												client,
												HighlightReminderMessage.highlightReminder(userId),
												userId,
												notificationId,
												true
											)
										}
									}
								})
							}
						})
						
					}
					
				}
				
			})
    }

    static remindHighlightUser(client){
        supabase.from('Reminders')
			.select('*,Users(notificationId)')
			.gte('time',new Date().toUTCString())
			.eq('type',"highlight")
			.then(data=>{
				if(data.data){
					data.data.forEach(reminder=>{
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

	static async setHighlightReminder(client,time,userId){
		const {data} = await supabase.from("Users")
		.select()
		.eq('id',userId)
		.single()

	const [hours,minutes] = time.split(/[.:]/)
	
	if (data.reminderHighlight !== time) {
		supabase.from("Users")
			.update({reminderHighlight:time})
			.eq('id',userId)
			.single()
			.then(async ({data:user})=>{
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
							if (user.reminderHighlight !== data.reminderHighlight) {
								scheduleReminderHighlight.cancel()
							}else if(data.lastHighlight !== Time.getDate().toISOString().substring(0,10)){
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
				
				})
			})
	}
	}
}

module.exports = ReminderController