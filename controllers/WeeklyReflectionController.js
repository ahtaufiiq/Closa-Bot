const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const Time = require('../helpers/time');
const WeeklyReflectionMessage = require('../views/WeeklyReflectionMessage');
const schedule = require('node-schedule');
const supabase = require('../helpers/supabaseClient');
const ChannelController = require('./ChannelController');
const { CHANNEL_ANNOUNCEMENT, CHANNEL_PARTY_ROOM, CHANNEL_REFLECTION } = require('../helpers/config');
const MessageFormatting = require('../helpers/MessageFormatting');
const LocalData = require('../helpers/LocalData');
const UserController = require('./UserController');
class WeeklyReflectionController {
	static async sendReflectionEveryWeek(client){
		schedule.scheduleJob(`30 ${Time.minus7Hours(19)} * * 2`, async function(){
			if(!Time.isCooldownPeriod()){
				const data = LocalData.getData()
				const channelAnnouncement = ChannelController.getChannel(client,CHANNEL_ANNOUNCEMENT)
				const msg = await channelAnnouncement.send(WeeklyReflectionMessage.announcement(WeeklyReflectionController.getTimeLeft()))
				ChannelController.createThread(msg,"Weekly Reflection")
				data.msgIdWeeklyReflection = msg.id
				LocalData.writeData(data)
				WeeklyReflectionController.countdownWritingReflection(msg)

				UserController.getActiveMembers()
					.then(async data=>{
						for (let i = 0; i < data.body.length; i++) {
							const {id,notificationId} = data.body[i]
							const notificationThread = await ChannelController.getNotificationThread(client,id,notificationId)
							notificationThread.send(WeeklyReflectionMessage.writeReflection(id))
						}
					})
			}
		});
	}
	static async sendReminderReflection(client){
		schedule.scheduleJob(`30 ${Time.minus7Hours(18)} * * 2`, async function(){
			if(!Time.isCooldownPeriod()){
				const channelAnnouncement = ChannelController.getChannel(client,CHANNEL_ANNOUNCEMENT)
				channelAnnouncement.send(WeeklyReflectionMessage.reminderReflection())
			}
		});
	}

	static async updateAnnouncementReflection(client){
		const date = Time.getDate()
		if(!Time.isCooldownPeriod && date.getDay() === 2 && date.getHours() >= 19){
			const {msgIdWeeklyReflection} = LocalData.getData()
			const channelAnnouncement = ChannelController.getChannel(client,CHANNEL_ANNOUNCEMENT)
			const msg = await ChannelController.getMessage(channelAnnouncement,msgIdWeeklyReflection)
			WeeklyReflectionController.countdownWritingReflection(msg)
		}
	}

	static isRangeWeeklyReflection(){
		const date = Time.getDate()
		const isSunday = date.getDay() === 2
		let beforeEnded = date.getHours() <= 23
		if(date.getHours() === 23 ){
			if(date.getMinutes() > 30) beforeEnded = false
		}
		return isSunday && beforeEnded
	}

    static showModalWriteReflection(interaction){
		if(interaction.customId.includes('writeReflection')){
			if(!WeeklyReflectionController.isRangeWeeklyReflection()) {
				interaction.reply(WeeklyReflectionMessage.replySubmissionClosed())
				return false
			}
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Reflect on this week 📝")
			.addComponents(
				new TextInputComponent().setCustomId('highlight').setLabel("What went well?").setStyle("LONG"),
				new TextInputComponent().setCustomId('lowlight').setLabel("What didn't go well?").setStyle("LONG"),
				new TextInputComponent().setCustomId('actionPlan').setLabel("What the next action plan for improvements?").setStyle("LONG"),
				new TextInputComponent().setCustomId('note').setLabel("Additional notes / Key learnings").setPlaceholder("Additional story, notes, or learnings").setStyle('LONG'),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }
    static showModalEditReflection(interaction){
        if(interaction.customId.includes('editReflection')){
			if(!WeeklyReflectionController.isRangeWeeklyReflection()) {
				interaction.reply(WeeklyReflectionMessage.replySubmissionClosed())
				return false
			}
			const {highlight,lowlight,actionPlan,note} = WeeklyReflectionController.getDataReflectionFromMessage(interaction.message)
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Reflect on this week 📝")
			.addComponents(
				new TextInputComponent().setCustomId('highlight').setLabel("What went well?").setStyle("LONG").setDefaultValue(highlight || ''),
				new TextInputComponent().setCustomId('lowlight').setLabel("What didn't go well?").setStyle("LONG").setDefaultValue(lowlight || ""),
				new TextInputComponent().setCustomId('actionPlan').setLabel("What the next action plan for improvements?").setStyle("LONG").setDefaultValue(actionPlan || ""),
				new TextInputComponent().setCustomId('note').setLabel("Additional notes / Key learnings").setPlaceholder("Additional story, notes, or learnings").setStyle('LONG').setDefaultValue(note || ""),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

	static async addReflection({highlight,lowlight,actionPlan,note,UserId}){
		return await supabase.from("WeeklyReflections")
			.insert({highlight,lowlight,actionPlan,note,UserId,date:Time.getTodayDateOnly()})
	}

	static async getAllParticipant(){
		const data = await supabase.from("WeeklyReflections")
			.select()
			.eq('date',Time.getTodayDateOnly())

		return data.body
	}

	static getDataReflectionFromMessage(message){
		const data = {}
		message.embeds[0].fields.forEach(field => {
			const {name,value} = field
			if(name === "Went well?") data.highlight = value
			if(name === "Didn't go weel?") data.lowlight = value
			if(name === "Next action plan for improvements") data.actionPlan = value
			if(name === "Additional Notes / Key learnings") data.note = value
		});
		return data
	}

	static countdownWritingReflection(msg){
		const countdownReflection = setInterval(async () => {
			WeeklyReflectionController.updateMessageAnnouncement(msg)
			if(WeeklyReflectionController.getTimeLeft().includes('-')){
				clearInterval(countdownReflection)
			}
		}, 1000 * 60);
	}

	static async updateMessageAnnouncement(msg){
		const dataParticipant = await WeeklyReflectionController.getAllParticipant()
		const participants = dataParticipant.map(participant=>MessageFormatting.tagUser(participant.UserId))
		if(WeeklyReflectionController.getTimeLeft().includes('-')){
			msg.edit(WeeklyReflectionMessage.announcement('ended',participants))
		}else{
			msg.edit(WeeklyReflectionMessage.announcement(WeeklyReflectionController.getTimeLeft(),participants))
		}
	}

	static getTimeLeft(){
		const endDate = Time.getDate()
		endDate.setHours(23)
		endDate.setMinutes(30)
		const diffTime = Time.getDiffTime(Time.getDate(),endDate)
		return `${Time.convertTime(diffTime,'short')} left`
	}
}

module.exports = WeeklyReflectionController