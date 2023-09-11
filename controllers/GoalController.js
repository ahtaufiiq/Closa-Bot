const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { CHANNEL_GOALS, CHANNEL_PARTY_ROOM, CHANNEL_GENERAL, CHANNEL_CLOSA_CAFE, GUILD_ID, CATEGORY_CHAT, ROLE_TRIAL_MEMBER, CHANNEL_BOT, CHANNEL_6WIC, CHANNEL_STATUS, CHANNEL_STREAK } = require('../helpers/config');
const LocalData = require('../helpers/LocalData.js');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const PartyMessage = require('../views/PartyMessage');
const ChannelController = require('./ChannelController');
const schedule = require('node-schedule');
const MemberController = require('./MemberController');
const MessageFormatting = require('../helpers/MessageFormatting');
const GoalMessage = require('../views/GoalMessage');
const PartyController = require('./PartyController');
const PointController = require('./PointController');
const FormatString = require('../helpers/formatString');
const UserController = require('./UserController');
const GenerateImage = require('../helpers/GenerateImage');
const { AttachmentBuilder } = require('discord.js');
const ReminderController = require('./ReminderController');
const DiscordWebhook = require('../helpers/DiscordWebhook');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const OnboardingController = require('./OnboardingController');
const BoostController = require('./BoostController');
const RequestAxios = require('../helpers/axios');
const InfoUser = require('../helpers/InfoUser');
const ReferralCodeController = require('./ReferralCodeController');
const DailyStreakController = require('./DailyStreakController');
const ReferralCodeMessage = require('../views/ReferralCodeMessage');
const DailyStreakMessage = require('../views/DailyStreakMessage');
const AchievementBadgeController = require('./AchievementBadgeController');

class GoalController {

    static async interactionPickGoalCategory(interaction){
        const deadlineGoal = GoalController.getDeadlineGoal()
        await interaction.editReply(GoalMessage.askUserWriteGoal(deadlineGoal.dayLeft,interaction.user.id))
        interaction.message.delete()
    }
    static async modalSubmitPreferredCoworkingTime(modal){
		await modal.deferReply()
		const coworkingTime = modal.getTextInputValue('coworkingTime');
		let preferredCoworkingTime = Time.getTimeFromText(coworkingTime)
		const differentTime = coworkingTime.toLowerCase().includes(' wita') ? 1 :coworkingTime.toLowerCase().includes(' wit') ? 2 : 0
		try {
			if(preferredCoworkingTime){
				const date = Time.getDate()
				const [hours,minutes] = preferredCoworkingTime.split(/[.:]/)
				date.setHours(hours - differentTime,minutes-30)
				const time = `${date.getHours()}.${date.getMinutes()}`
				
				ReminderController.setHighlightReminder(modal.client,time,modal.user.id)
				supabase.from("Users")
					.update({preferredCoworkingTime:coworkingTime})
					.eq('id',modal.user.id)
					.then()
			}
			const deadlineGoal = GoalController.getDayLeftBeforeDemoDay()
			const [commandButton,_,value] = modal.customId.split("_")
			const isSixWeekChallenge = !!value
			await modal.editReply(GoalMessage.setReminderShareProgress(modal.user.id,isSixWeekChallenge))
			ChannelController.deleteMessage(modal.message)
			
		} catch (error) {
			DiscordWebhook.sendError(error,`${modal.user.id} ${coworkingTime}`)
		}
    }

    static showModalWriteGoal(interaction){
		let [commandButton,_,value] = interaction.customId.split("_")
        if(commandButton === 'writeGoal'){
			const isSixWeekChallenge = !!value
			const labelAbout = isSixWeekChallenge ? 'About (in one-liner)' : "About project"
			const placeholderAbout = isSixWeekChallenge ? 'Write in one-liner format. e.g. Closa is a smart discord bot to boost your productivity with friends' : "Tell a bit about this project"
			const fieldTypeAbout = isSixWeekChallenge ? "SHORT" : "LONG"
			const deadlineGoal = GoalController.getDayLeftBeforeDemoDay()
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent().setCustomId('project').setLabel("Project Name (up to 4 words)").setPlaceholder("Short project's name e.g: Design Exploration").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('goal').setLabel("Goal (that excites you & can be quantify)").setPlaceholder("e.g. 10 design exploration & get 1 clients").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('about').setLabel(labelAbout).setPlaceholder(placeholderAbout).setStyle(fieldTypeAbout).setRequired(true),
				new TextInputComponent().setCustomId('deadline').setLabel("Project Deadline").setPlaceholder("e.g. 20 may").setStyle("SHORT").setDefaultValue(deadlineGoal.formattedDate).setRequired(true),
				new TextInputComponent().setCustomId('shareProgressAt').setLabel("i'll try to share my progress at").setPlaceholder("e.g. 21.00").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

	static showModalEditGoal(interaction){
		let [commandButton,_,value] = interaction.customId.split("_")
        if(commandButton === 'editGoal'){
			const project = interaction.message.embeds[0].title
			let goal
			let descriptionShareProgress
			let deadlineValue
			if(interaction.message.embeds[0].fields.length === 5){
				goal = interaction.message.embeds[0].fields[0].value
				descriptionShareProgress = interaction.message.embeds[0].fields[2].value
				deadlineValue = interaction.message.embeds[0].fields[4].value
			}else{
				goal = interaction.message.embeds[0].fields[0].value
				descriptionShareProgress = interaction.message.embeds[0].fields[1].value
				deadlineValue = interaction.message.embeds[0].fields[3].value
			}
			const [month,dateOfMonth] = deadlineValue.split('(')[0].split(/[, ]/)
			const [commandButton,userId] = interaction.customId.split('_')
			if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't edit someone else goal.`})

			const shareProgressAt = Time.getTimeFromText(descriptionShareProgress)
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent().setCustomId('project').setLabel("Project Name (up to 4 words)").setDefaultValue(project).setPlaceholder("Short project's name e.g: Design Exploration").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('goal').setLabel("Goal (that excites you & can be quantify)").setDefaultValue(goal).setPlaceholder("e.g. 10 design exploration & get 1 clients").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('deadline').setLabel("Project Deadline").setPlaceholder("e.g. 20 may").setStyle("SHORT").setDefaultValue(`${dateOfMonth} ${month}`).setRequired(true),
				new TextInputComponent().setCustomId('shareProgressAt').setLabel("i'll try to share my progress at").setDefaultValue(shareProgressAt).setPlaceholder("e.g. 21.00").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

	static showModalPreferredCoworkingTime(interaction){
        if(interaction.customId.includes('scheduledCoworkingTimeGoal') || interaction.customId.includes('selectPreferredCoworkingTime')){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Preferred coworking time 🕖👩‍💻👨‍💻")
			.addComponents(
				new TextInputComponent().setCustomId('coworkingTime').setLabel("Preferred daily coworking time (minimal one)").setPlaceholder("e.g. 08.00, 15.00, 20.00 wib").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }
	static showModalReminderShareProgress(interaction){
        if(interaction.customId.includes('setReminderShareProgress')){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set reminder 🔔")
			.addComponents(
				new TextInputComponent().setCustomId('shareProgress').setLabel("Remind me to share progress at 🔔").setPlaceholder("e.g. 21.30").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }
	static showModalDeadlineProject(interaction){
        if(interaction.customId.includes('setDeadlineProject')){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set custom deadline 🗓️")
			.addComponents(
				new TextInputComponent().setCustomId('deadline').setLabel("Set project's deadline 🗓️").setPlaceholder("e.g. 22 Aug / 22 August").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

	static showModalCustomDailyWorkTime(interaction){
		const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Daily work time goal")
			.addComponents(
				new TextInputComponent().setCustomId('dailyWorkGoal').setLabel("Set your daily work time goal").setPlaceholder("e.g. 1 hr 30 min").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
	
    }

    static async interactionPostGoal(interaction,{goal,about,project,shareProgressAt,deadlineGoal},isSixWeekChallenge=false){
		// PartyController.setProgressReminder(interaction,shareProgressAt)

		ChannelController.deleteMessage(interaction.message)
		
		const goalId = await GoalController.submitGoal(interaction.client,interaction.user,{project,goal,about,shareProgressAt,deadlineGoal},isSixWeekChallenge)
		const channelId = isSixWeekChallenge ? CHANNEL_6WIC : CHANNEL_GOALS
		await interaction.editReply(GoalMessage.replySuccessSubmitGoal(interaction.user.id,channelId,goalId))
	}

	static async submitGoal(client,user,{project,goal,about,goalCategory,shareProgressAt,deadlineGoal},isSixWeekChallenge=false){
		PointController.addPoint(user.id,'goal')
		const dataUser = await supabase.from('Users')
			.select()
			.eq('id',user.id)
			.single()
		const preferredCoworkingTime = dataUser.data?.preferredCoworkingTime
		const channelId = isSixWeekChallenge ? CHANNEL_6WIC : CHANNEL_GOALS
		const channelGoals = ChannelController.getChannel(client,channelId)
		const buffer = await GenerateImage.project({
			user,project,goal,date:deadlineGoal
		},isSixWeekChallenge)
		const files = [new AttachmentBuilder(buffer,{name:`${project}_${user.username}.png`})]
		const msg = await channelGoals.send(GoalMessage.postGoal({
			project,
			goal,
			about,
			shareProgressAt,
			user:user,
			deadlineGoal,
			preferredCoworkingTime,
			files
		},isSixWeekChallenge))

		supabase.from('Goals')
		.insert({
			goalCategory,
			project,
			goal,
			about,
			shareProgressAt,
			id:msg.id,
			deadlineGoal:Time.getDateOnly(deadlineGoal),
			lastProgress:new Date(),
			isPartyMode:false,
			alreadySetHighlight:false,
			UserId:user.id,
			goalType: isSixWeekChallenge ? '6wic' : 'default'
		})
		.then()

		supabase.from("Projects")
			.select()
			.eq('UserId',user.id)
			.eq('name',FormatString.capitalizeFirstChar(project))
			.limit(1)
			.single()
			.then(data=>{
				if (!data.data) {
					supabase.from("Projects")
						.insert({name:FormatString.capitalizeFirstChar(project),UserId:user.id})
						.then()
				}
			})

		ChannelController.createThread(msg,project,false,user.username)
			.then(async thread=>{
				await thread.send(GoalMessage.infoThreadProject(user.id))
				thread.setArchived(true)
			})
		supabase.from('Users')
			.update({
				goalId:msg.id,
				reminderProgress:shareProgressAt
			})
			.eq('id',user.id)
			.then()
		return msg.id
	}

	static async updateDataGoal({id,project,goal,about,shareProgressAt}){
		return await supabase.from('Goals')
			.update({project,goal,about,shareProgressAt})
			.eq('id',id)
	}

	static async generateAllUserGoalFromWaitingRoom(client){
		const {kickoffDate} = LocalData.getData()
		const ruleKickoff = Time.getDate(kickoffDate)
		ruleKickoff.setHours(Time.minus7Hours(20))
		ruleKickoff.setMinutes(30)
		schedule.scheduleJob(ruleKickoff,async function(){
			const data = await supabase.from("JoinParties")
			.select()
			.eq('cohort',PartyController.getThisCohort())
			.not('goal','is',null)
			data.data.forEach(async ({UserId,goal,project,about,goalCategory,shareProgressAt})=>{
				const {user} = await MemberController.getMember(client,UserId)
				GoalController.submitGoal(client,user,{project,goal,about,goalCategory,shareProgressAt})
			})
		})
	}

	static async getAllUserJoinedPartyForMatchMaking(client){

		const data = await supabase.from("JoinParties")
		.select()
		.eq('cohort',PartyController.getThisCohort())
		.order('role')
		.order('goalCategory')
		.order('shareProgressAt')
		.not('goal','is',null)
		const channelBot = ChannelController.getChannel(client,CHANNEL_BOT)
		const msg = await channelBot.send(`Cohort ${PartyController.getThisCohort()}`)
		const thread = await ChannelController.createThread(msg,`Cohort ${PartyController.getThisCohort()}`)
		const deadlineGoal = GoalController.getDeadlineGoal()
		let roleChannel =''
		data.data.forEach(async ({UserId,goal,project,about,goalCategory,shareProgressAt,role})=>{
			const {user} = await MemberController.getMember(client,UserId)
			if(roleChannel !== role) {
				roleChannel = role
				await thread.send(`--------------------------------------\n${role.toUpperCase()}\n--------------------------------------`)
			}
			thread.send(GoalMessage.postGoal({
				project,
				goal,
				about,
				shareProgressAt,
				role,
				deadlineGoal,
				user:user,
				value:`party-${role}`
			}))
		})
	}

	static async updateGoal(client,data,preferredCoworkingTime){
		const {project,goal,goalType,about,shareProgressAt,deadlineGoal} = data
		const isSixWeekChallenge = goalType === 'default' ? false : true
		const channelGoals = ChannelController.getChannel(client,isSixWeekChallenge ? CHANNEL_6WIC : CHANNEL_GOALS)
		try {
			const {user} = await MemberController.getMember(client,data.UserId)
			const existingGoal = await ChannelController.getMessage(channelGoals,data.id)
			const buffer = await GenerateImage.project({
				user,project,goal,date:Time.getDate(deadlineGoal)
			},isSixWeekChallenge)
			const files = [new AttachmentBuilder(buffer,{name:`${project}_${user.username}.png`})]
			await existingGoal.edit(GoalMessage.postGoal({project,goal,about,shareProgressAt,deadlineGoal:Time.getDate(deadlineGoal),user:user,files,preferredCoworkingTime},isSixWeekChallenge))
		} catch (error) {
			DiscordWebhook.sendError(error,`${data?.UserId} : ${MessageFormatting.linkToMessage(channelGoals.id,data?.id)}`)			
		}
	}

	static async updateAllActiveGoal(client){
		let ruleUpdateGoal = new schedule.RecurrenceRule();
        ruleUpdateGoal.hour = 17
        ruleUpdateGoal.minute = 1
        schedule.scheduleJob(ruleUpdateGoal,function(){
			GoalController.getAllActiveGoal()
				.then(async data=>{
					if (data.data) {
						for (let i = 0; i < data.data.length; i++) {
							await Time.wait(10000)
							const goal = data.data[i];
							await GoalController.updateGoal(client,goal,goal?.Users?.preferredCoworkingTime)
						}
					}
				})
		})
	}

	static remindToWriteGoal(client){
		const {kickoffDate} = LocalData.getData()
		const remindBeforeKickoff = Time.getDate(kickoffDate)
        remindBeforeKickoff.setHours(Time.minus7Hours(20))
        remindBeforeKickoff.setMinutes(5)

        schedule.scheduleJob(remindBeforeKickoff,function() {
			supabase.from("JoinParties")
				.select("UserId")
				.eq('cohort',PartyController.getThisCohort())
				.eq('alreadySetGoal',false)
				.then(data=>{
					if(data.data){
						data.data.forEach(async member=>{
							const {UserId} = member
							ChannelController.sendToNotification(
								client,
								[
									GoalMessage.remindToWriteGoal(UserId),
									GoalMessage.pickYourRole(UserId,'party')
								],
								UserId,
							)
						})
					}
				})
        })
	
	}

    static async createThreadGoal(msg){
        let threadName = `${msg.content.split('\n')[0]}`
        if (threadName.includes("**")) {
            threadName = threadName.split("**")[1]
        }else if (threadName.includes("*")) {
            threadName = threadName.split("*")[1]
        }
        const threadGoal = await ChannelController.createThread(
            msg,
            threadName,
            msg.author.username
        )

        return threadGoal
    }

	static async getActiveGoal(UserId){
		const data = await supabase.from("Goals").select("*,Users(preferredCoworkingTime)").gte('deadlineGoal',Time.getTodayDateOnly()).eq("UserId",UserId).order('createdAt',{ascending:false}).limit(1).single()
		return data
	}
	static async getActiveGoalUser(UserId){
		const data = await supabase.from("Goals").select("*").eq('UserId',UserId).gte('lastProgress',Time.getDateOnly(Time.getNextDate(-30))).order('lastProgress',{ascending:false}).order('createdAt',{ascending:false}).limit(25)
		return data
	}
	static async getArchivedGoalUser(UserId){
		const data = await supabase.from("Goals").select("*").eq('UserId',UserId).lt('lastProgress',Time.getDateOnly(Time.getNextDate(-30))).order('lastProgress',{ascending:false}).order('createdAt',{ascending:false}).limit(25)
		return data
	}
	static async getAllActiveGoal(){
		const data = await supabase.from("Goals").select("*,Users(preferredCoworkingTime)").gte('deadlineGoal',Time.getTodayDateOnly()).gte('lastProgress',Time.getDateOnly(Time.getNextDate(-30)))
		return data
	}

	static async alreadyHaveGoal(userId){
		const data = await supabase.from("Goals").select('id').eq("UserId",userId).gte('deadlineGoal',Time.getTodayDateOnly())
		return data.data.length !== 0
	}

	static async haveArchivedProject(UserId){
		const data = await supabase.from("Goals").select("*").eq('UserId',UserId).lt('lastProgress',Time.getDateOnly(Time.getNextDate(-30))).limit(1).single()
		return !!data.data
	}

    static async updateGoalId(goalId,userId){
        return await supabase.from('Users')
            .update({
                goalId
            })
            .eq('id',userId)
    }

    static getDeadlineGoal(){
		const {kickoffDate,deadlineGoal} = LocalData.getData()
		const todayDate = Time.getTodayDateOnly()
		const result = {
			dayLeft:null,
			description:'',
			deadlineDate:null
		}
		
		if (PartyController.isLastWeekCohort() || Time.isCooldownPeriod() ) {
			result.dayLeft = Time.getDiffDay(Time.getDate(todayDate),Time.getDate(deadlineGoal))
			result.deadlineDate = deadlineGoal
			result.description = 'celebration'
		}else {
			const deadlineDate = Time.getNextDate(-1,kickoffDate)
			result.dayLeft = Time.getDiffDay(Time.getDate(todayDate),deadlineDate)
			result.deadlineDate = Time.getDateOnly(deadlineDate)
			result.description = 'kick-off'
		}
		return result
	}
    static getDayLeftBeforeDemoDay(){
		const {celebrationDate} = LocalData.getData()
		const todayDate = Time.getTodayDateOnly()
		const result = {
			dayLeft:null,
			deadlineDate:null,
			formattedDate:''
		}
		
		result.dayLeft = Time.getDiffDay(Time.getDate(todayDate),Time.getDate(celebrationDate))
		result.deadlineDate = Time.getDate(celebrationDate)
		const [month,dateOfMonth] = Time.getFormattedDate(result.deadlineDate,false,'medium').split(/[, ]+/)
		result.formattedDate = `${dateOfMonth} ${month}`
		
		return result
	}

	static async interactionStartProject(interaction,targetUserId,isSixWeekChallenge=false){
		const dataUser = await UserController.getDetail('dailyWorkTime')
		const dailyWorkTime = dataUser.data?.dailyWorkTime
		const msg = await ChannelController.sendToNotification(
			interaction.client,
			GoalMessage.setDailyWorkTime(targetUserId,null,isSixWeekChallenge,dailyWorkTime),
			targetUserId
		)
		const notificationId = await UserController.getNotificationId(targetUserId)
		if(!msg) DiscordWebhook.sendError('msg null start project',targetUserId)
		await interaction.editReply(GoalMessage.replyStartSetGoal(notificationId,msg?.id))
	}

	static getFormattedGoalMenu(goals,withGoalType=false){
        const menus = []
		const maxLength = goals.length > 25 ? 25 : goals.length
        for (let i = 0; i < maxLength; i++) {
            const project = goals[i];
            menus.push({
                label:FormatString.truncateString(`${FormatString.capitalizeFirstChar(project.project)} — ${project.goal}`,90),
                value:`${project.id}${withGoalType ? `-${project.goalType}`:''}`
            })
        }

        return menus
    }

	static async interactionSetReminderShareProgress(interaction,shareProgressAt){
		await interaction.deferReply()
		const value = interaction.customId.split("_")[2]
		const dataUser = await UserController.getDetail(interaction.user.id,'reminderProgress')
		const differentTime = shareProgressAt.toLowerCase().includes(' wita') ? 1 :shareProgressAt.toLowerCase().includes(' wit') ? 2 : 0
		let reminderProgress = Time.getTimeFromText(shareProgressAt)
		if(differentTime > 0){
			const date = Time.getDate()
			const [hours,minutes] = reminderProgress.split(/[.:]/)
			date.setHours(hours - differentTime,minutes)
			reminderProgress = Time.getTimeOnly(date,true)
		}
		try {
			UserController.updateData({reminderProgress},interaction.user.id)
			if(dataUser.data.reminderProgress !== reminderProgress){
				const [hours,minutes] = reminderProgress.split(/[.:]/)
				let ruleReminderProgress = new schedule.RecurrenceRule();
				ruleReminderProgress.hour = Time.minus7Hours(hours)
				ruleReminderProgress.minute = minutes
				const scheduleReminderProgress = schedule.scheduleJob(ruleReminderProgress,function(){
					if (!Time.isCooldownPeriod()) {
						supabase.from('Users')
						.select()
						.eq('id',interaction.user.id)
						.single()
						.then(async ({data:data})=>{
							if (data) {
								if (reminderProgress !== data.reminderProgress) {
									scheduleReminderProgress.cancel()
								}else if (data.lastDone !== Time.getDate().toISOString().substring(0,10) && !data.onVacation) {
									const {id:userId,notificationId} = data;
									await ChannelController.sendToNotification(
										interaction.client,
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
			const isSixWeekChallenge = !!value
			await interaction.editReply(GoalMessage.setDeadlineProject(interaction.user.id,isSixWeekChallenge))
			ChannelController.deleteMessage(interaction.message)
		} catch (error) {
			DiscordWebhook.sendError(error,`${interaction?.user?.id} setReminderShareProgress`)
		}
	}

	static showModalStartNewProject(interaction){
		let [commandButton,_,value] = interaction.customId.split("_")
        if(commandButton === 'startNewProject'){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent().setCustomId('project').setLabel("Project Name").setPlaceholder("Short project's name up to 5 words").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('goal').setLabel("Goal (that excites you)").setPlaceholder("idea you want to build & the final result").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

	static async postProgress(msg,goalId,taskId){
		const ChannelStreak = ChannelController.getChannel(msg.client,CHANNEL_STREAK)
		const data = await UserController.getDetail(msg.author.id)
		let goalName = ''
		let msgGoalId
		const attachments = []
		let files = []

		msg.attachments.each(data=>{
			const fileSizeInMB = Math.ceil(data.size / 1e6)
			if(fileSizeInMB <= 24){
				files.push({
					attachment:data.attachment
				})
			}
			attachments.push(data.attachment)
		})
		const thread = await ChannelController.getGoalThread(msg.client,goalId)
		goalName = thread.name.split('by')[0]
		let {totalDay,lastDone} = data.data
		if(lastDone !== Time.getTodayDateOnly()) totalDay += 1
		const msgGoal = await thread.send(
			GoalMessage.shareProgress(msg,files,totalDay)
		)
		supabase.from("Goals").update({lastProgress:new Date()}).eq('id',goalId).then()
		if(totalDay === 1){
			const channelStatus = ChannelController.getChannel(msg.client,CHANNEL_STATUS)
			channelStatus.send(GoalMessage.shareProgress(msg,files,totalDay))
		}
		msgGoalId = msgGoal.id
		ChannelController.archivedThreadInactive(msg.author.id,thread,60,false)
	
		OnboardingController.handleOnboardingProgress(msg.client,msg.author)
		BoostController.deleteBoostMessage(msg.client,msg.author.id)
		
		RequestAxios.get(`todos/${msg.author.id}`)
		.then(async (data) => {
			await supabase.from("Todos")
				.update({
					attachments,
					msgGoalId,
					type:null
				})
				.eq('id',taskId)

			if (data.length > 0) {
				throw new Error("Tidak perlu kirim daily streak ke channel")
			} else {
				supabase.from("Users").update({avatarURL:InfoUser.getAvatar(msg.author),username:UserController.getNameFromUserDiscord(msg.author)}).eq('id',msg.author.id).then()
				if(!Time.isCooldownPeriod()) await ReferralCodeController.updateTotalDaysThisCohort(msg.author.id)
			}
			
			return supabase.from("Users")
				.select()
				.eq('id',msg.author.id)
				.single()
		})
		.then(async data=>{
			let currentStreak = data.data.currentStreak + 1
			let totalDay =  (data.data.totalDay || 0) + 1
			
			if (Time.isValidStreak(currentStreak,data.data.lastDone,data.data.lastSafety) || Time.isValidCooldownPeriod(data.data.lastDone)) {
				if (Time.onlyMissOneDay(data.data.lastDone,data.data.lastSafety) && (!Time.isCooldownPeriod() || Time.isFirstDayCooldownPeriod())) {
					const missedDate = Time.getNextDate(-1)
					missedDate.setHours(8)
					await DailyStreakController.addSafetyDot(msg.author.id,missedDate)
				}
				if (currentStreak > data.data.longestStreak) {
					return supabase.from("Users")
						.update({
							currentStreak,
							totalDay,
							'longestStreak':currentStreak,
							'endLongestStreak':Time.getTodayDateOnly()
						})
						.eq('id',msg.author.id)
						.select()
						.single()
				}else{
					return supabase.from("Users")
						.update({
							currentStreak,
							totalDay
						})
						.eq('id',msg.author.id)
						.select()
						.single()
				}
			}else{
				const updatedData = {
					currentStreak:1,
					totalDay,
				}
				if (currentStreak > data.data.longestStreak) {
					updatedData.longestStreak = currentStreak
					updatedData.endLongestStreak = Time.getTodayDateOnly()
				}
				return supabase.from("Users")
					.update(updatedData)
					.eq('id',msg.author.id)
					.select()
					.single()
			}
		})
		.then(async data => {
			supabase.from('Users')
				.update({lastDone:Time.getTodayDateOnly()})
				.eq('id',msg.author.id)
				.then()
			let {
				currentStreak,
				longestStreak, 
				totalDay ,
				totalPoint, 
				endLongestStreak,
				totalDaysThisCohort
			} = data.data

			if(totalDay === 20){
				await MemberController.addRole(msg.client,msg.author.id,ROLE_MEMBER)
				MemberController.removeRole(msg.client,msg.author.id,ROLE_NEW_MEMBER)
				ChannelController.sendToNotification(
					msg.client,
					ReferralCodeMessage.levelUpBecomeMember(msg.author.id),
					msg.author.id
				)
				supabase.from("Users")
					.update({type:'member'})
					.eq('id',msg.author.id)
					.then()
			}

			if(totalDaysThisCohort === 12 && !Time.isCooldownPeriod()){
				ChannelController.sendToNotification(
					msg.client,
					ReferralCodeMessage.appreciationForActiveUser(msg.author.id),
					msg.author.id
				)
			}
			
			if (goalName) {
				DailyStreakController.generateHabitBuilder(msg.client,msg.author)
					.then(async files=>{
						await ChannelStreak.send({
							embeds:[DailyStreakMessage.dailyStreak(currentStreak,msg.author,longestStreak)],content:`${msg.author}`,
							files
						})

						if(endLongestStreak === Time.getTodayDateOnly()){
							if(currentStreak === 7 || currentStreak === 30 || currentStreak === 100 || currentStreak === 200 || currentStreak === 365) {
								AchievementBadgeController.achieveProgressStreak(msg.client,currentStreak,msg.author,true)
							}
						}else {
							if(currentStreak === 30 || currentStreak === 100 || currentStreak === 200 || currentStreak === 365) {
								AchievementBadgeController.achieveProgressStreak(msg.client,currentStreak,msg.author)
							}
						}
					})
			}else{
				ChannelStreak.send({
					embeds:[DailyStreakMessage.dailyStreak(currentStreak,msg.author,longestStreak)],content:`${msg.author}`
				})
			}
			
		})
		
		.catch(err => {
		})
	}
	
	static async interactionSearchProject(interaction,user){
		const [allActiveGoal,haveArchivedProject] = await Promise.all([
			GoalController.getActiveGoalUser(user.id),
			GoalController.haveArchivedProject(user.id)
		])
		if(allActiveGoal.data.length > 0 || (allActiveGoal.data.length === 1 && haveArchivedProject)){
			const goalMenus = GoalController.getFormattedGoalMenu(allActiveGoal.data,true)
			if(haveArchivedProject){
				goalMenus.push({
					label:'📁 Archived projects',
					value:`archivedProject-${user.id}`
				})
			}
			interaction.editReply(GoalMessage.searchProject(user.id,goalMenus,interaction.user.id !== user.id))
		}else if(haveArchivedProject){
			const allArchivedGoal = await GoalController.getArchivedGoalUser(user.id)
			const goalMenus = GoalController.getFormattedGoalMenu(allArchivedGoal.data,true)
			interaction.editReply(GoalMessage.searchProject(user.id,goalMenus,interaction.user.id !== user.id,true))
		}else {
			interaction.editReply(`${user} has never started a project.`)
		}

	}
}

module.exports = GoalController