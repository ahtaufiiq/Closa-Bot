const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { CHANNEL_GOALS, CHANNEL_PARTY_MODE, CHANNEL_GENERAL, CHANNEL_CLOSA_CAFE, GUILD_ID, CATEGORY_CHAT, CHANNEL_PARTY_ROOM, ROLE_TRIAL_MEMBER, CHANNEL_BOT } = require('../helpers/config');
const LocalData = require('../helpers/LocalData.js');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const PartyMessage = require('../views/PartyMessage');
const ChannelController = require('./ChannelController');
const schedule = require('node-schedule');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const MemberController = require('./MemberController');
const MessageFormatting = require('../helpers/MessageFormatting');
const { ChannelType, PermissionFlagsBits } = require('discord-api-types/v9');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');
const RecurringMeetupController = require('./RecurringMeetupController');
const GoalMessage = require('../views/GoalMessage');
const PartyController = require('./PartyController');
const PointController = require('./PointController');

class GoalController {

    static async interactionPickRole(interaction,role,type='party'){
        await interaction.editReply(GoalMessage.pickYourGoalCategory(role,interaction.user.id,type))
        interaction.message.delete()
    }

    static async interactionPickGoalCategory(interaction,valueMenu){
        const deadlineGoal = GoalController.getDeadlineGoal()
        await interaction.editReply(GoalMessage.askUserWriteGoal(deadlineGoal.dayLeft,deadlineGoal.description,interaction.user.id,valueMenu))
        interaction.message.delete()
    }

    static showModalWriteGoal(interaction){
        if(interaction.customId.includes('writeGoal')){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent().setCustomId('project').setLabel("Project Name").setPlaceholder("Short project's name e.g: Design Exploration").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('goal').setLabel("My goal is").setPlaceholder("Write specific & measurable goal e.g: read 2 books").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('about').setLabel("About Project").setPlaceholder("Tell a bit about this project").setStyle("LONG").setRequired(true),
				new TextInputComponent().setCustomId('shareProgressAt').setLabel("I'll share my everyday progress at").setPlaceholder("e.g 21.00").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

    static async interactionPostGoal(interaction,{goal,about,project,shareProgressAt,accountabilityMode,role,goalCategory}){

		PartyController.setProgressReminder(interaction,shareProgressAt)
		
		if(accountabilityMode === 'party'){
			const kickoffDate = Time.getFormattedDate(Time.getDate(LocalData.getData().kickoffDate))
			const kickoffEventId = LocalData.getData().kickoffEventId
			ChannelController.sendToNotification(
				interaction.client,
				MessageFormatting.linkToEvent(kickoffEventId),
				interaction.user.id
			)

			await interaction.editReply(PartyMessage.remindUserAttendKicoff(interaction.user.id,kickoffDate,kickoffEventId))
			interaction.message.delete()

			await supabase.from("JoinParties")
				.update({role,goalCategory,project,goal,about,shareProgressAt,alreadySetGoal:true})
				.eq('UserId',interaction.user.id)
				.eq('cohort',PartyController.getNextCohort())
			
			PartyController.updateMessageWaitingRoom(interaction.client)

			const channelGeneral = ChannelController.getChannel(interaction.client,CHANNEL_GENERAL)
			channelGeneral.send(`**${interaction.user} has joined ${MessageFormatting.tagChannel(CHANNEL_PARTY_MODE)} & set a goal**`)
		}else if(accountabilityMode.includes('joinParty')){
			const msgGoalId = await GoalController.submitGoal(interaction.client,interaction.user,{project,goal,about,goalCategory,shareProgressAt,role,accountabilityMode})
			const partyId = accountabilityMode.split('joinParty')[1]
			const dataParty = await supabase.from("PartyRooms")
				.select("*,MemberPartyRooms(UserId,project,isLeader,isTrialMember)")
				.eq('id',partyId)
				.single()
			const members = dataParty.body?.MemberPartyRooms
			const totalMember = members.length


			if (totalMember === PartyController.getMaxPartyMember()) {
				await interaction.editReply(PartyMessage.replyCannotJoinPartyFullAfterSetGoal(interaction.user.id))
				return
			}

			const {deadlineGoal} = LocalData.getData()
			supabase.from("MemberPartyRooms")
				.insert({project,partyId,endPartyDate:deadlineGoal,UserId:interaction.user.id})
				.then((data)=>{
					PartyController.updateMessagePartyRoom(interaction.client,dataParty.body.msgId,partyId)
				})
			await interaction.editReply(PartyMessage.replyImmediatelyJoinParty(interaction.user.id,dataParty.body?.msgId))
			const channelParty = ChannelController.getChannel(interaction.client,CHANNEL_PARTY_ROOM)
			const partyThread = await ChannelController.getThread(channelParty,dataParty.body.msgId,partyId)
			partyThread.send(PartyMessage.userJoinedParty(interaction.user.id))
			ChannelController.deleteMessage(interaction.message)
			PartyController.followGoalAccountabilityPartner(interaction.client,partyId,interaction.user.id,msgGoalId)
		}else{
			await interaction.editReply(PartyMessage.askUserWriteHighlight(interaction.user.id))
			ChannelController.deleteMessage(interaction.message)
			
			GoalController.submitGoal(interaction.client,interaction.user,{project,goal,about,goalCategory,shareProgressAt,role,accountabilityMode})
		}
	}

	static async submitGoal(client,user,{project,goal,about,goalCategory,shareProgressAt,role,accountabilityMode}){
		PointController.addPoint(user.id,'goal')

		const deadlineGoal = GoalController.getDeadlineGoal()

		const channelGoals = ChannelController.getChannel(client,CHANNEL_GOALS)
		const msg = await channelGoals.send(GoalMessage.postGoal({
			project,
			goal,
			about,
			shareProgressAt,
			role,
			user:user,
			deadlineGoal,
			value:`${accountabilityMode}-${role}`
		}))

		const updatedData = await supabase.from("Goals")
		.update({deadlineGoal:Time.getDateOnly(Time.getNextDate(-1))})
		.eq("UserId",user.id)
		.gte('deadlineGoal',Time.getTodayDateOnly())
		.single()

		supabase.from('Goals')
		.insert({
			role,
			goalCategory,
			project,
			goal,
			about,
			shareProgressAt,
			id:msg.id,
			deadlineGoal:deadlineGoal.deadlineDate,
			isPartyMode:accountabilityMode === 'solo' ? false : true,
			alreadySetHighlight:false,
			UserId:user.id,
		})
		.then()

		if (updatedData.body) {
			GoalController.updateGoal(client,updatedData.body,0)
		}

		ChannelController.createThread(msg,project,user.username)
		supabase.from('Users')
			.update({
				goalId:msg.id,
				reminderProgress:shareProgressAt
			})
			.eq('id',user.id)
			.then()
		return msg.id
	}

    static showModalEditGoal(interaction){
        if(interaction.customId.includes('editGoal')){
			const project = interaction.message.embeds[0].title
			const [{value:goal},{value:about},{value:descriptionShareProgress}] = interaction.message.embeds[0].fields
			const [commandButton,userId] = interaction.customId.split('_')
			if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't edit someone else goal.`})

			const shareProgressAt = Time.getTimeFromText(descriptionShareProgress)
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent().setCustomId('project').setLabel("Project Name").setDefaultValue(project).setPlaceholder("Short project's name e.g: Design Exploration").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('goal').setLabel("My goal is").setDefaultValue(goal).setPlaceholder("Write specific & measurable goal e.g: read 2 books").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('about').setLabel("About Project").setDefaultValue(about).setPlaceholder("Tell a bit about this project").setStyle("LONG").setRequired(true),
				new TextInputComponent().setCustomId('shareProgressAt').setLabel("I'll share my progress at").setDefaultValue(shareProgressAt).setPlaceholder("e.g 21.00").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
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
			.eq('cohort',PartyController.getNextCohort())
			.not('goal','is',null)
			data.body.forEach(async ({UserId,goal,project,about,goalCategory,shareProgressAt,role})=>{
				const {user} = await MemberController.getMember(client,UserId)
				GoalController.submitGoal(client,user,{project,goal,about,goalCategory,shareProgressAt,role,accountabilityMode:'party'})
			})
		})
	}

	static async getAllUserJoinedPartyForMatchMaking(client){

		const data = await supabase.from("JoinParties")
		.select()
		.eq('cohort',PartyController.getNextCohort())
		.order('role')
		.order('goalCategory')
		.order('shareProgressAt')
		.not('goal','is',null)
		const channelBot = ChannelController.getChannel(client,CHANNEL_BOT)
		const msg = await channelBot.send(`Cohort ${PartyController.getNextCohort()}`)
		const thread = await ChannelController.createThread(msg,`Cohort ${PartyController.getNextCohort()}`)
		const deadlineGoal = GoalController.getDeadlineGoal()
		let roleChannel =''
		data.body.forEach(async ({UserId,goal,project,about,goalCategory,shareProgressAt,role})=>{
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

	static async updateGoal(client,data,dayLeft){
		const channelGoals = ChannelController.getChannel(client,CHANNEL_GOALS)
		const user = await MemberController.getMember(client,data.UserId)
		const existingGoal = await ChannelController.getMessage(channelGoals,data.id)
		const {role,project,goal,about,shareProgressAt,deadlineGoal,isPartyMode} = data
		const value = `${isPartyMode ? 'party':'solo'}-${role}`

		existingGoal.edit(GoalMessage.postGoal({project,goal,about,shareProgressAt,role,deadlineGoal:{deadlineDate:deadlineGoal,dayLeft},user:user,value}))
	}

	static async updateAllActiveGoal(client){
		let ruleUpdateGoal = new schedule.RecurrenceRule();
        ruleUpdateGoal.hour = 17
        ruleUpdateGoal.minute = 1
        schedule.scheduleJob(ruleUpdateGoal,function(){
			GoalController.getAllActiveGoal()
				.then(data=>{
					if (data.body) {
						data.body.forEach(goal=>{
							const dayLeft = Time.getDayLeft(Time.getDate(goal.deadlineGoal))
							GoalController.updateGoal(client,goal,dayLeft)
						})
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
				.eq('cohort',PartyController.getNextCohort())
				.eq('alreadySetGoal',false)
				.then(data=>{
					if(data.body){
						data.body.forEach(async member=>{
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

	static async getAllActiveGoal(){
		const data = await supabase.from("Goals").select().gte('deadlineGoal',Time.getTodayDateOnly())
		return data
	}

	static async alreadyHaveGoal(userId){
		const data = await supabase.from("Goals").select('id').eq("UserId",userId).gte('deadlineGoal',Time.getTodayDateOnly())
		return data.body.length !== 0
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
    
}

module.exports = GoalController