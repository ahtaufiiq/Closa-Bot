const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { CHANNEL_GOALS } = require('../helpers/config');
const LocalData = require('../helpers/getData');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const PartyMessage = require('../views/PartyMessage');
const ChannelController = require('./ChannelController');
const schedule = require('node-schedule');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const MemberController = require('./MemberController');
class PartyController{
    static showModalWriteGoal(interaction){
        if(interaction.customId.includes('writeGoal')){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent()
					.setCustomId('project')
					.setLabel("Project Name")
					.setPlaceholder("Short project's name e.g: Design Exploration")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('goal')
					.setLabel("My goal is")
					.setPlaceholder("Write specific & measurable goal e.g: read 2 books")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('about')
					.setLabel("About Project")
					.setPlaceholder("Tell a bit about this project")
					.setStyle("LONG")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('shareProgressAt')
					.setLabel("I'll share my progress at")
					.setPlaceholder("e.g 21.00")
					.setStyle("SHORT")
					.setRequired(true),
			)
			showModal(modal, {
				client: interaction.client, // Client to show the Modal through the Discord API.
				interaction: interaction, // Show the modal with interaction data.
			});
			return true
		}
        return false
    }

    static showModalEditGoal(interaction){
        if(interaction.customId.includes('editGoal')){
			const project = interaction.message.embeds[0].title
			const [
				{value:goal},
				{value:about},
				{value:descriptionShareProgress},
			] = interaction.message.embeds[0].fields
			const shareProgressAt = PartyController.getTimeShareProgress(descriptionShareProgress)
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent()
					.setCustomId('project')
					.setLabel("Project Name")
					.setDefaultValue(project)
					.setPlaceholder("Short project's name e.g: Design Exploration")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('goal')
					.setLabel("My goal is")
					.setDefaultValue(goal)
					.setPlaceholder("Write specific & measurable goal e.g: read 2 books")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('about')
					.setLabel("About Project")
					.setDefaultValue(about)
					.setPlaceholder("Tell a bit about this project")
					.setStyle("LONG")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('shareProgressAt')
					.setLabel("I'll share my progress at")
					.setDefaultValue(shareProgressAt)
					.setPlaceholder("e.g 21.00")
					.setStyle("SHORT")
					.setRequired(true),
			)
			showModal(modal, {
				client: interaction.client, // Client to show the Modal through the Discord API.
				interaction: interaction, // Show the modal with interaction data.
			});
			return true
		}
        return false
    }


    static async interactionPickRole(interaction,role,type='party'){
        await interaction.editReply(PartyMessage.pickYourGoalCategory(role,interaction.user.id,type))
        interaction.message.delete()
    }

	static getTimeShareProgress(shareProgressAt){
		return shareProgressAt.split(" ")[0]
	}

	static async interactionPostGoal(interaction,value){
		const deadlineGoal = PartyController.getDeadlineGoal()
		const project = interaction.message.embeds[0].title
		const [
			{value:goal},
			{value:about},
			{value:descriptionShareProgress}
		] = interaction.message.embeds[0].fields
		const shareProgressAt = PartyController.getTimeShareProgress(descriptionShareProgress)
		const [accountabilityMode,role,goalCategory] = value.split('-')
		await interaction.editReply(PartyMessage.askUserWriteHighlight(interaction.user.id))
		interaction.message.delete()

		PartyController.setProgressReminder(interaction,shareProgressAt)
		const channelGoals = ChannelController.getChannel(interaction.client,CHANNEL_GOALS)
		channelGoals.send(PartyMessage.postGoal({
			project,
			goal,
			about,
			shareProgressAt,
			role,
			user:interaction.user,
			deadlineGoal:deadlineGoal,
			value
		}))
		.then(msg=>{
			supabase.from("Goals")
			.update({deadlineGoal:Time.getDateOnly(Time.getNextDate(-1))})
			.eq("UserId",interaction.user.id)
			.gte('deadlineGoal',Time.getTodayDateOnly())
			.single()
			.then(async updatedData =>{
				supabase.from('Goals')
				.insert([{
					role,
					goalCategory,
					project,
					goal,
					about,
					shareProgressAt,
					id:msg.id,
					deadlineGoal:deadlineGoal.deadlineDate,
					isPartyMode:accountabilityMode === 'party' ? true : false,
					alreadySetHighlight:false,
					UserId:interaction.user.id,
				}])
				.then()
				if (updatedData.body) {
					PartyController.updateGoal(interaction.client,updatedData.body,0)
				}
			})
			ChannelController.createThread(msg,project,interaction.user.username)
			supabase.from('Users')
				.update({
					goalId:msg.id,
					reminderProgress:shareProgressAt
				})
				.eq('id',interaction.user.id)
				.then()
		})
	}

	static async alreadyHaveGoal(userId){
		const data = await supabase.from("Goals")
		.select('id')
		.eq("UserId",userId)
		.gt('deadlineGoal',Time.getTodayDateOnly())
		

		return data.body.length !== 0
	}

	static async getAllActiveGoal(){
		const data = await supabase.from("Goals")
		.select()
		.gte('deadlineGoal',Time.getTodayDateOnly())
		
		return data
	}

	static async updateGoal(client,data,dayLeft){
		const channelGoals = ChannelController.getChannel(client,CHANNEL_GOALS)
		const user = await MemberController.getMember(client,data.UserId)
		const existingGoal = await ChannelController.getMessage(channelGoals,data.id)
		const {
			role,
			project,
			goal,
			about,
			shareProgressAt,
			deadlineGoal,
			isPartyMode,
		} = data
		existingGoal.edit(PartyMessage.postGoal({
			project,
			goal,
			about,
			shareProgressAt,
			role,
			deadlineGoal:{deadlineDate:deadlineGoal,dayLeft},
			user:user,
			value:isPartyMode ? 'party':'solo'
		}))
	}

	static async updateAllActiveGoal(client){
		let ruleUpdateGoal = new schedule.RecurrenceRule();
        
        ruleUpdateGoal.hour = 17
        ruleUpdateGoal.minute = 1
        schedule.scheduleJob(ruleUpdateGoal,function(){
			PartyController.getAllActiveGoal()
				.then(data=>{
					data.body.forEach(goal=>{
						const dayLeft = Time.getDayLeft(Time.getDate(goal.deadlineGoal))
						PartyController.updateGoal(client,goal,dayLeft)
					})
				})
		})
	}

	static async sendNotifToSetHighlight(client,userId) {
		supabase.from("Goals")
			.select('id,alreadySetHighlight,Users(notificationId,reminderHighlight)')
			.eq("UserId",userId)
			.gt('deadlineGoal',Time.getTodayDateOnly())
			.eq('alreadySetHighlight',false)
			.single()
			.then(async data => {
				 if(data.body){
						supabase.from("Goals")
							.update({alreadySetHighlight:true})
							.eq('id',data.body.id)
							.then()
						const {reminderHighlight,notificationId}= data.body.Users
						const notificationThread = await ChannelController.getNotificationThread(client,userId,notificationId)
						if(reminderHighlight){
							notificationThread.send(PartyMessage.settingReminderHighlightExistingUser(userId,reminderHighlight))
						}else{
							notificationThread.send(PartyMessage.settingReminderHighlight(userId))
						}
												
				}
			})
	}

	static async interactionSetDefaultReminder(interaction,value){
		if (!value) {
			supabase.from("Users")
				.update({reminderHighlight:'07.30'})
				.eq('id',interaction.user.id)
				.then()
		}
		await interaction.editReply(PartyMessage.replyDefaultReminder(value))
		interaction.message.delete()
	}

	static setProgressReminder(interaction,shareProgressAt){
		supabase.from("Users")
		.select('reminderProgress')
		.eq('id',interaction.user.id)
		.single()
		.then(data => {
			if (data.body.reminderProgress !== shareProgressAt) {
				supabase.from("Users")
				.update({reminderProgress:shareProgressAt})
				.eq('id',interaction.user.id)
				.single()
				.then(async ({data:user})=>{
					const [hours,minutes] = user.reminderProgress.split(/[.:]/)
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
								if (user.reminderProgress !== data.reminderProgress) {
									scheduleReminderProgress.cancel()
								}else if (data.lastDone !== Time.getDate().toISOString().substring(0,10)) {
									const userId = data.id;
									const notificationThread = await ChannelController.getNotificationThread(interaction.client,data.id,data.notificationId)
									notificationThread.send(TodoReminderMessage.progressReminder(userId))

								}
							}
						})
					
					})
				})
			}
		})

	}

	static isLastWeekCohort(){
		const {kickoffDate} = LocalData.getData()
		const todayDate = Time.getTodayDateOnly()
		const lastWeekCohort = Time.getDateOnly(Time.getNextDate(-14,kickoffDate))
		return todayDate <= lastWeekCohort
	}

	static getDeadlineGoal(){
		const {celebrationDate,kickoffDate} = LocalData.getData()
		const todayDate = Time.getTodayDateOnly()
		const result = {
			dayLeft:null,
			description:'',
			deadlineDate:null
		}
		
		if (this.isLastWeekCohort() || Time.isCooldownPeriod() ) {
			result.dayLeft = Time.getDiffDay(Time.getDate(todayDate),Time.getDate(celebrationDate))
			result.deadlineDate = celebrationDate
			result.description = 'celebration'
		}else {
			const deadlineDate = Time.getNextDate(-1,kickoffDate)
			result.dayLeft = Time.getDiffDay(Time.getDate(todayDate),deadlineDate)
			result.deadlineDate = Time.getDateOnly(deadlineDate)
			result.description = 'kick-off'
		}
		return result
	}
}

module.exports = PartyController