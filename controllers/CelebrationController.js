const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const Time = require('../helpers/time');
const schedule = require('node-schedule');
const supabase = require('../helpers/supabaseClient');
const ChannelController = require('./ChannelController');
const { CHANNEL_ANNOUNCEMENT, CHANNEL_PARTY_ROOM, CHANNEL_GENERAL } = require('../helpers/config');
const MessageFormatting = require('../helpers/MessageFormatting');
const LocalData = require('../helpers/LocalData');
const UserController = require('./UserController');
const CelebrationMessage = require('../views/CelebrationMessage');
const fetch = require('node-fetch')

class CelebrationController {
	static async sendAnnouncementCelebration(client){
		const {celebrationDate} = LocalData.getData()
		const date = Time.getDate(celebrationDate)
        date.setHours(Time.minus7Hours(21))
        date.setMinutes(0)
		schedule.scheduleJob(date, async function(){
			const data = LocalData.getData()
			const channelAnnouncement = ChannelController.getChannel(client,CHANNEL_ANNOUNCEMENT)
			const msg = await channelAnnouncement.send(CelebrationMessage.announcement(CelebrationController.getTimeLeft()))
			ChannelController.createThread(msg,"Celebration")
			data.msgIdCelebration = msg.id
			LocalData.writeData(data)
			CelebrationController.countdownWritingCelebration(msg)

			UserController.getActiveMembers('id,notificationId')
				.then(async data=>{
					for (let i = 0; i < data.body.length; i++) {
						const {id:userId,notificationId} = data.body[i]
						ChannelController.sendToNotification(
							client,
							CelebrationMessage.writeCelebration(userId),
							userId,
							notificationId
						)
					}
			})
		});
	}

	static async updateAnnouncementCelebration(client){
		const date = Time.getDate()
		if(CelebrationController.isRangeCelebration()){
			const {msgIdCelebration} = LocalData.getData()
			const channelAnnouncement = ChannelController.getChannel(client,CHANNEL_ANNOUNCEMENT)
			const msg = await ChannelController.getMessage(channelAnnouncement,msgIdCelebration)
			CelebrationController.countdownWritingCelebration(msg)
		}
	}

	static isRangeCelebration(){
		const {celebrationDate} = LocalData.getData()
		const endDate = Time.getDateOnly(Time.getNextDate(1,celebrationDate))
		const todayDate = Time.getTodayDateOnly()
		const date = Time.getDate()
		return (todayDate === celebrationDate && date.getHours() >= 21) || todayDate === endDate
	}

    static showModalWriteCelebration(interaction){
		if(interaction.customId.includes('writeCelebration')){
			if(!CelebrationController.isRangeCelebration()) {
				interaction.reply(CelebrationMessage.replySubmissionClosed())
				return true
			}
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Reflect on this week 📝")
			.addComponents(
				new TextInputComponent().setCustomId('story').setLabel(CelebrationMessage.labelModal.story).setStyle("LONG"),
				new TextInputComponent().setCustomId('linkProject').setLabel(CelebrationMessage.labelModal.linkProject).setStyle("SHORT"),
				new TextInputComponent().setCustomId('linkDeck').setLabel(CelebrationMessage.labelModal.linkDeck).setPlaceholder('link to canva, figma, pitch, slides, or etc..').setStyle("SHORT"),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }
    static showModalEditCelebration(interaction){
		const [commandButton,userId] = interaction.customId.split('_')

        if(commandButton === 'editCelebration'){
			if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't edit someone else celebration.`})

			const {story,linkDeck,linkProject} = CelebrationController.getDataCelebrationFromMessage(interaction.message)
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Reflect on this week 📝")
			.addComponents(
				new TextInputComponent().setCustomId('story').setLabel(CelebrationMessage.labelModal.story).setStyle("LONG").setDefaultValue(story || ''),
				new TextInputComponent().setCustomId('linkProject').setLabel(CelebrationMessage.labelModal.linkProject).setStyle("SHORT").setDefaultValue(linkProject || ""),
				new TextInputComponent().setCustomId('linkDeck').setLabel(CelebrationMessage.labelModal.linkDeck).setPlaceholder('link to canva, figma, pitch, slides, or etc..').setStyle("SHORT").setDefaultValue(linkDeck || ""),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

	static async addCelebration({story,linkProject,linkDeck,UserId}){
		const {cohort} = LocalData.getData()
		return await supabase.from("Celebrations")
			.insert({cohort,story,linkProject,linkDeck,UserId})
	}

	static async getAllParticipant(){
		const {cohort} = LocalData.getData()
		const data = await supabase.from("Celebrations")
			.select()
			.eq('cohort',cohort)

		return data.body
	}

	static getDataCelebrationFromMessage(message){
		const data = {}
		message.embeds[0].fields.forEach(field => {
			const {name,value} = field
			if(name === CelebrationMessage.titleField.story) data.story = value
			if(name === CelebrationMessage.titleField.linkProject) data.linkProject = value
			if(name === CelebrationMessage.titleField.linkDeck) data.linkDeck = value
		});
		return data
	}

	static countdownWritingCelebration(msg){
		const countdownCelebration = setInterval(async () => {
			CelebrationController.updateMessageAnnouncement(msg)
			if(CelebrationController.getTimeLeft().includes('-')){
				clearInterval(countdownCelebration)
			}
		}, 1000 * 60);
	}

	static async getMetatagImages(link){
		if(!link.includes('http')) link = 'https://' + link
		const res = await fetch(`https://jsonlink.io/api/extract?url=${link}`)
		const json = await res.json()
		if(json.error) return null
		return json.images[0]
	}

	static async updateMessageAnnouncement(msg){
		const dataParticipant = await CelebrationController.getAllParticipant()
		const participants = dataParticipant.map(participant=>MessageFormatting.tagUser(participant.UserId))
		if(CelebrationController.getTimeLeft().includes('-')){
			msg.edit(CelebrationMessage.announcement('ended',participants))
		}else{
			msg.edit(CelebrationMessage.announcement(CelebrationController.getTimeLeft(),participants))
		}
	}

	static getTimeLeft(){
		const {celebrationDate} = LocalData.getData()
        const endDate = Time.getNextDate(1,celebrationDate)
        endDate.setHours(23)
        endDate.setMinutes(59)
		const diffTime = Time.getDiffTime(Time.getDate(),endDate)
		return `${Time.convertTime(diffTime,'short')} left`
	}
}

module.exports = CelebrationController