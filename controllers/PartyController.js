const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { CHANNEL_GOALS } = require('../helpers/config');
const LocalData = require('../helpers/getData');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const PartyMessage = require('../views/PartyMessage');
const ChannelController = require('./ChannelController');
const schedule = require('node-schedule');
const TodoReminderMessage = require('../views/TodoReminderMessage');
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
		await interaction.editReply(PartyMessage.postGoal({
			project,
			goal,
			about,
			role,
			shareProgressAt,
			value,
			user:interaction.user,
			deadlineDate:deadlineGoal.deadlineDate,
		}))
		interaction.message.delete()

		supabase.from("Goals")
		.update({deadlineGoal:Time.getDateOnly(Time.getNextDate(-1))})
		.eq("UserId",interaction.user.id)
		.gt('deadlineGoal',Time.getTodayDateOnly())
		.single()
		.then(()=>{
			supabase.from('Goals')
			.insert([{
				role,
				goalCategory,
				project,
				goal,
				about,
				shareProgressAt,
				deadlineGoal:deadlineGoal.deadlineDate,
				isPartyMode:accountabilityMode === 'party' ? true : false,
				alreadySetHighlight:false,
				UserId:interaction.user.id,
			}])
			.then()
		})
		

		PartyController.setProgressReminder(interaction,shareProgressAt)
		const channelGoals = ChannelController.getChannel(interaction.client,CHANNEL_GOALS)
		channelGoals.send(PartyMessage.postGoal({
			project,
			goal,
			about,
			shareProgressAt,
			role,
			user:interaction.user,
			deadlineDate:deadlineGoal.deadlineDate,
			value
		}))
		.then(msg=>{
			ChannelController.createThread(msg,project,interaction.user.username)
			supabase.from('Users')
				.update({
					goal_id:msg.id,
					reminder_progress:shareProgressAt
				})
				.eq('id',interaction.user.id)
				.then()
		})
		const notificationThread = await ChannelController.getNotificationThread(interaction.client,interaction.user.id)
		notificationThread.send(PartyMessage.askUserWriteHighlight(interaction.user.id))
	}

	static async alreadyHaveGoal(userId){
		const data = await supabase.from("Goals")
		.select('id')
		.eq("UserId",userId)
		.gt('deadlineGoal',Time.getTodayDateOnly())
		

		return data.body.length !== 0
	}

	static async sendNotifToSetHighlight(client,userId) {
		supabase.from("Goals")
			.select('id,alreadySetHighlight,Users(notification_id)')
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
						const notificationThread = await ChannelController.getNotificationThread(client,userId,data.body.Users.notification_id)
						notificationThread.send(PartyMessage.settingReminderHighlight(userId))						
				}
			})
	}

	static setProgressReminder(interaction,shareProgressAt){
		supabase.from("Users")
		.select('reminder_progress')
		.eq('id',interaction.user.id)
		.single()
		.then(data => {
			if (data.body.reminder_progress !== shareProgressAt) {
				supabase.from("Users")
				.update({reminder_progress:shareProgressAt})
				.eq('id',interaction.user.id)
				.single()
				.then(async ({data:user})=>{
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
									const notificationThread = await ChannelController.getNotificationThread(interaction.client,data.id,data.notification_id)
									notificationThread.send(TodoReminderMessage.progressReminder(userId))

								}
							}
						})
					
					})
				})
			}
		})

	}

	static getDeadlineGoal(){
		const {celebrationDate,kickoffDate} = LocalData.getData()
		const todayDate = Time.getTodayDateOnly()
		const lastWeekDate = Time.getDateOnly(Time.getNextDate(-7,celebrationDate))
		const result = {
			dayLeft:null,
			deadlineDate:null
		}
		if (todayDate <= lastWeekDate ) {
			result.dayLeft = Time.getDiffDay(Time.getDate(todayDate),Time.getDate(celebrationDate))
			result.deadlineDate = celebrationDate
		}else {
			const deadlineDate = Time.getNextDate(-1,kickoffDate)
			result.dayLeft = Time.getDiffDay(Time.getDate(),deadlineDate)
			result.deadlineDate = Time.getDateOnly(deadlineDate)
		}
		return result
	}
}

module.exports = PartyController