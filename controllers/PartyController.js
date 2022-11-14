const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { CHANNEL_GOALS, CHANNEL_PARTY_MODE, CHANNEL_GENERAL, CHANNEL_CLOSA_CAFE, GUILD_ID, CATEGORY_CHAT, CHANNEL_PARTY_ROOM, ROLE_TRIAL_MEMBER } = require('../helpers/config');
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
class PartyController{
    static showModalWriteGoal(interaction){
        if(interaction.customId.includes('writeGoal')){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent().setCustomId('project').setLabel("Project Name").setPlaceholder("Short project's name e.g: Design Exploration").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('goal').setLabel("My goal is").setPlaceholder("Write specific & measurable goal e.g: read 2 books").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('about').setLabel("About Project").setPlaceholder("Tell a bit about this project").setStyle("LONG").setRequired(true),
				new TextInputComponent().setCustomId('shareProgressAt').setLabel("I'll share my progress at").setPlaceholder("e.g 21.00").setStyle("SHORT").setRequired(true),
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
			const [{value:goal},{value:about},{value:descriptionShareProgress}] = interaction.message.embeds[0].fields
			const shareProgressAt = PartyController.getTimeShareProgress(descriptionShareProgress)
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent().setCustomId('project').setLabel("Project Name").setDefaultValue(project).setPlaceholder("Short project's name e.g: Design Exploration").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('goal').setLabel("My goal is").setDefaultValue(goal).setPlaceholder("Write specific & measurable goal e.g: read 2 books").setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('about').setLabel("About Project").setDefaultValue(about).setPlaceholder("Tell a bit about this project").setStyle("LONG").setRequired(true),
				new TextInputComponent().setCustomId('shareProgressAt').setLabel("I'll share my progress at").setDefaultValue(shareProgressAt).setPlaceholder("e.g 21.00").setStyle("SHORT").setRequired(true),
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

	static getNextCohort(){
		return LocalData.getData().cohort + 1
	}

	static async getUsersJoinedParty(){
		const data = await supabase.from("JoinParties")
			.select()
			.eq('cohort',this.getNextCohort())
			.order('createdAt',{ascending:false})
		return data.body
	}
	static async updateMessageWaitingRoom(client){
		const msg = await PartyController.getMessageWaitingRoom(client)
		const usersJoinedParty = await PartyController.getUsersJoinedParty()
		const totalUserHaveNotSetGoal = await PartyController.getTotalUserHaveNotSetGoal()
		msg.edit(PartyMessage.contentWaitingRoom(totalUserHaveNotSetGoal,PartyController.formatUsersJoinedParty(usersJoinedParty)))
	}

	static async generateAllUserGoalFromWaitingRoom(client){
		const {kickoffDate} = LocalData.getData()
		const ruleKickoff = Time.getDate(kickoffDate)
		ruleKickoff.setHours(Time.minus7Hours(20))
		ruleKickoff.setMinutes(30)
		schedule.scheduleJob(ruleKickoff,async function(){
			const data = await supabase.from("JoinParties")
			.select()
			.eq('cohort',this.getNextCohort())
			.not('goal','is',null)
			const deadlineGoal = PartyController.getDeadlineGoal()
			const channelGoals = ChannelController.getChannel(client,CHANNEL_GOALS)
			data.body.forEach(async ({UserId,goal,project,about,goalCategory,shareProgressAt,role,})=>{
				const {user} = await MemberController.getMember(client,UserId)
				channelGoals.send(PartyMessage.postGoal({
					project,
					goal,
					about,
					shareProgressAt,
					role,
					user:user,
					deadlineGoal:deadlineGoal
				}))
				.then(msg=>{
					supabase.from("Goals")
					.update({deadlineGoal:Time.getDateOnly(Time.getNextDate(-1))})
					.eq("UserId",user.id)
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
							isPartyMode:true,
							alreadySetHighlight:false,
							UserId:user.id,
						}])
						.then()
						if (updatedData.body) {
							PartyController.updateGoal(client,updatedData.body,0)
						}
					})
					ChannelController.createThread(msg,project,user.username)
					supabase.from('Users')
						.update({
							goalId:msg.id,
							reminderProgress:shareProgressAt
						})
						.eq('id',user.id)
						.then()
				})
			})
		})
		
	}

	static async getTotalUserHaveNotSetGoal(){
        const {count} = await supabase
			.from('JoinParties')
			.select('id', { count: 'exact' })
			.eq('cohort',this.getNextCohort())
			.eq('alreadySetGoal',false)

        return count
	}

	static async getMessageWaitingRoom(client){
		const channelParty = ChannelController.getChannel(client,CHANNEL_PARTY_MODE)
		const msg = await ChannelController.getMessage(channelParty,LocalData.getData().msgIdContentWaitingRoom)
		return msg
	}

	static isPartyMode(value){
		const accountabilityMode = value.split('-')[0]
		return accountabilityMode === 'party'
	}

	static formatUsersJoinedParty(users){
		let result = ''
		for (let i = 0; i < users.length; i++) {
			const user = users[i];
			result += `${MessageFormatting.tagUser(user.UserId)} ${user.alreadySetGoal ? "✅" : "⏳"}`
			if(i !== users.length - 1) result += '\n'
		}
		return result
	}

	static getTimeShareProgress(shareProgressAt){
		return shareProgressAt.split(" ")[0]
	}

	static async interactionPostGoal(interaction,value){
		const deadlineGoal = PartyController.getDeadlineGoal()
		const project = interaction.message.embeds[0].title
		const [{value:goal},{value:about},{value:descriptionShareProgress}] = interaction.message.embeds[0].fields
		const shareProgressAt = PartyController.getTimeShareProgress(descriptionShareProgress)
		const [accountabilityMode,role,goalCategory] = value.split('-')
		PartyController.setProgressReminder(interaction,shareProgressAt)
		if(this.isPartyMode(value)){
			const kickoffDate = Time.getFormattedDate(Time.getDate(LocalData.getData().kickoffDate))
			const kickoffEventId = LocalData.getData().kickoffEventId
			const notificationThread = await ChannelController.getNotificationThread(interaction.client,interaction.user.id)
			await interaction.editReply(PartyMessage.remindUserAttendKicoff(interaction.user.id,kickoffDate,kickoffEventId))
			notificationThread.send(MessageFormatting.linkToEvent(kickoffEventId))
			interaction.message.delete()
			await supabase.from("JoinParties")
			.update({
				role,
				goalCategory,
				project,
				goal,
				about,
				shareProgressAt,
				alreadySetGoal:true
			})
			.eq('UserId',interaction.user.id)
			.eq('cohort',PartyController.getNextCohort())
			PartyController.updateMessageWaitingRoom(interaction.client)
		}else if(accountabilityMode.includes('joinParty')){
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
						isPartyMode: true ,
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

			const partyId = accountabilityMode.split('joinParty')[1]

			const dataParty = await supabase.from("PartyRooms")
			.select("*,MemberPartyRooms(UserId,goal,isLeader,isTrialMember)")
			.eq('id',partyId)
			.single()
			const members = dataParty.body?.MemberPartyRooms
			const {
				totalExistingMembers,
				totalTrialMember
			} = PartyController.countTotalMemberParty(members)
			const isTrialMember = await MemberController.hasRole(interaction.client,interaction.user.id,ROLE_TRIAL_MEMBER)

			if ((isTrialMember && totalTrialMember === 1) || (!isTrialMember && totalExistingMembers === 3)) {
				await interaction.editReply(PartyMessage.replyCannotJoinPartyFullAfterSetGoal(interaction.user.id))
			}else{
				const {celebrationDate} = LocalData.getData()
				supabase.from("MemberPartyRooms")
					.insert({
						goal,
						isTrialMember,
						partyId,
						endPartyDate:celebrationDate,
						UserId:interaction.user.id
					})
					.then(()=>{
						PartyController.updateMessagePartyRoom(interaction.client,dataParty.body.msgId,partyId)
					})
				await interaction.editReply(PartyMessage.replyImmediatelyJoinParty(interaction.user.id,dataParty.body?.msgId))
			}
			const channelParty = ChannelController.getChannel(interaction.client,CHANNEL_PARTY_ROOM)
			const partyThread = await ChannelController.getThread(channelParty,dataParty.body.msgId,partyId)
			partyThread.send(PartyMessage.userJoinedParty(interaction.user.id))
			interaction.message.delete()
		}else{
			await interaction.editReply(PartyMessage.askUserWriteHighlight(interaction.user.id))
			interaction.message.delete()
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
	}

	static async alreadyHaveGoal(userId){
		const data = await supabase.from("Goals").select('id').eq("UserId",userId).gt('deadlineGoal',Time.getTodayDateOnly())
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
		const {role,project,goal,about,shareProgressAt,deadlineGoal,isPartyMode} = data
		existingGoal.edit(PartyMessage.postGoal({project,goal,about,shareProgressAt,role,deadlineGoal:{deadlineDate:deadlineGoal,dayLeft},user:user,value:isPartyMode ? 'party':'solo'}))
	}

	static handleOutsideMemberChatInPartyRoom(msg){
		const [label,partyNumber] = msg.channel.name.split(' ')
		if(label === "Party"){
			supabase.from("MemberPartyRooms")
				.select()
				.eq('UserId',msg.author.id)
				.eq('partyId',partyNumber)
				.single()
				.then(async data=>{
					if (!data.body) {
						msg.delete()
						msg.channel.members.remove(msg.author.id)
						const notificationThread = await ChannelController.getNotificationThread(msg.client,msg.author.id)
						notificationThread.send(PartyMessage.replyOutsiderMemberCannotChat())
					}
				})
			
		}
	}
	static async handleMentionOutsideMemberInPartyRoom(msg){
		const [label,partyNumber] = msg.channel.name.split(' ')
		if(label === "Party" && msg.mentions.users.size > 0){
			let isDeleteMessage = false
			for (const [userId] of msg.mentions.users) {
				const data = await supabase.from("MemberPartyRooms")
				.select()
				.eq('UserId',userId)
				.eq('partyId',partyNumber)
				.single()
				
				if (!data.body) {
					isDeleteMessage = true
					msg.channel.members.remove(userId)
				}
			}
			if(isDeleteMessage){
				msg.delete()
				msg.channel.send(PartyMessage.replyCannotMentionNotPartyMember())
			}
		}
	}

	static async updateAllActiveGoal(client){
		let ruleUpdateGoal = new schedule.RecurrenceRule();
        
        ruleUpdateGoal.hour = 17
        ruleUpdateGoal.minute = 1
        schedule.scheduleJob(ruleUpdateGoal,function(){
			PartyController.getAllActiveGoal()
				.then(data=>{
					if (data.body) {
						data.body.forEach(goal=>{
							const dayLeft = Time.getDayLeft(Time.getDate(goal.deadlineGoal))
							PartyController.updateGoal(client,goal,dayLeft)
						})
					}
				})
		})
	}

	static hideChannelPartyMode(client){
		const {kickoffDate} = LocalData.getData()
		const ruleFirstDayCooldown = Time.getDate(kickoffDate)
		ruleFirstDayCooldown.setHours(Time.minus7Hours(21))
		ruleFirstDayCooldown.setMinutes(0)
		schedule.scheduleJob(ruleFirstDayCooldown,async function(){
			ChannelController.setVisibilityChannel(client,CHANNEL_PARTY_MODE,false)
		})
	}
	static showChannelPartyMode(client){
		ChannelController.setVisibilityChannel(client,CHANNEL_PARTY_MODE,true)
	}

	static async announcePartyModeAvailable(client){
		const channelGeneral = ChannelController.getChannel(client,CHANNEL_GENERAL)

		const {kickoffDate} = LocalData.getData()
		const ruleFirstDayCooldown = Time.getNextDate(-6,kickoffDate)
		ruleFirstDayCooldown.setHours(Time.minus7Hours(20))
		ruleFirstDayCooldown.setMinutes(25)
		schedule.scheduleJob(ruleFirstDayCooldown,async function(){
			channelGeneral.send(PartyMessage.announceOpenPartyMode(Time.getFormattedDate(Time.getDate(kickoffDate),true)))
		})
		const ruleLastDayCooldown = Time.getNextDate(-1,kickoffDate)
		ruleLastDayCooldown.setHours(Time.minus7Hours(20))
		ruleLastDayCooldown.setMinutes(25)
		schedule.scheduleJob(ruleLastDayCooldown,async function(){
			channelGeneral.send(PartyMessage.reminderOpenPartyMode())
		})
	}


	static async generateWaitingRoomPartyMode(client){
		const {kickoffDate} = LocalData.getData()
		const ruleFirstDayCooldown = Time.getNextDate(-6,kickoffDate)
		ruleFirstDayCooldown.setHours(Time.minus7Hours(8))
		ruleFirstDayCooldown.setMinutes(30)
		schedule.scheduleJob(ruleFirstDayCooldown,async function(){
			PartyController.showChannelPartyMode(client)
			const channelParty = ChannelController.getChannel(client,CHANNEL_PARTY_MODE)
			const usersJoinedParty = await PartyController.getUsersJoinedParty()
			const totalUserHaveNotSetGoal = await PartyController.getTotalUserHaveNotSetGoal()
			const msg = await channelParty.send(PartyMessage.contentWaitingRoom(totalUserHaveNotSetGoal,PartyController.formatUsersJoinedParty(usersJoinedParty)))
			channelParty.send(PartyMessage.embedMessageWaitingRoom(PartyController.getTimeLeftUntilKickoff()))
				.then(msg=>{
					const countdownWaitingRoomHourly = setInterval(() => {
						if(!PartyController.getTimeLeftUntilKickoff().includes('day')){
							clearInterval(countdownWaitingRoomHourly)
							const countdownWaitingRoomMinutely = setInterval(() => {
								if(PartyController.getTimeLeftUntilKickoff().includes('-')){
									clearInterval(countdownWaitingRoomMinutely)
									msg.edit(PartyMessage.embedMessageWaitingRoom('0 m'))
								}else{
									msg.edit(PartyMessage.embedMessageWaitingRoom(PartyController.getTimeLeftUntilKickoff()))
								}
							}, 1000 * 60);
						}else{
							msg.edit(PartyMessage.embedMessageWaitingRoom(PartyController.getTimeLeftUntilKickoff()))
						}
					}, 1000 * 60 * 60);
				})
			
			const data = LocalData.getData()
			data.msgIdContentWaitingRoom = msg.id
			LocalData.writeData(data)
		})
	}

	static getTimeLeftUntilKickoff(){
		const kickoffDate = Time.getDate(LocalData.getData().kickoffDate)
		kickoffDate.setHours(Time.minus7Hours(20))
		kickoffDate.setMinutes(0)
		const diffTime = Time.getDiffTime(Time.getDate(),kickoffDate)
		return Time.convertTime(diffTime,'short')
	}

	static createKickoffEvent(client){
		const {kickoffDate} = LocalData.getData()
		const ruleFirstDayCooldown = Time.getNextDate(-7,kickoffDate)
        ruleFirstDayCooldown.setHours(22)
        ruleFirstDayCooldown.setMinutes(0)

		schedule.scheduleJob(ruleFirstDayCooldown,function(){
            ChannelController.scheduleEvent(client,{
                name:"Live Kick-off 🚀",
                description:PartyMessage.descriptionKickoffEvent(),
                scheduledStartTime:PartyController.getStartTimeKickoffEvent(),
                scheduledEndTime:PartyController.getEndTimeKickoffEvent(),
                entityType:"VOICE",
                channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
            })
            .then(kickoffEventId=>{
                const data = LocalData.getData()
                data.kickoffEventId = kickoffEventId.id
                LocalData.writeData(data)
            })
        })
	}

	static async updateMessagePartyRoom(client,msgId,partyNumber){
		const channelParty = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const msgParty = await ChannelController.getMessage(channelParty,msgId)
		supabase.from("PartyRooms")
		.select("*,MemberPartyRooms(UserId,goal,isLeader,isTrialMember)")
		.eq('id',partyNumber)
		.single()
		.then(async data=>{
			const members = data?.body?.MemberPartyRooms
			members.sort(member=> {
				return member.isLeader ? -1 : 1 
			})
			const totalMemberParty = PartyController.countTotalMemberParty(members)
			const isFullParty = totalMemberParty.totalExistingMembers === 3 && totalMemberParty.totalTrialMember === 1
			msgParty.edit(PartyMessage.partyRoom(
				partyNumber,
				PartyController.formatMembersPartyRoom(members),
				totalMemberParty,
				members?.[0]?.UserId,
				isFullParty
			))
		})

	}

	static getStartTimeKickoffEvent(){
		const kickoffDate = Time.getDate(LocalData.getData().kickoffDate)
		kickoffDate.setHours(Time.minus7Hours(20))
		kickoffDate.setMinutes(0)
		return kickoffDate
	}

	static getEndTimeKickoffEvent(){
		const kickoffDate = Time.getDate(LocalData.getData().kickoffDate)
		kickoffDate.setHours(Time.minus7Hours(21))
		kickoffDate.setMinutes(0)
		return kickoffDate
	}

	static remind30MinutesBeforeKickoff(client){
		const {kickoffDate} = LocalData.getData()
		const remindBeforeKickoff = Time.getDate(kickoffDate)
        remindBeforeKickoff.setHours(Time.minus7Hours(19))
        remindBeforeKickoff.setMinutes(30)
		const channel = ChannelController.getChannel(client,CHANNEL_GENERAL)

        schedule.scheduleJob(remindBeforeKickoff,function() {
			const kickoffEventId = LocalData.getData().kickoffEventId
			channel.send(PartyMessage.remind30MinutesBeforeKickoff(kickoffEventId))
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
							const notificationThread = await ChannelController.getNotificationThread(client,member.UserId)
							notificationThread.send(PartyMessage.remindToWriteGoal(member.UserId))
							notificationThread.send(PartyMessage.pickYourRole(member.UserId,'party'))
						})
					}
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

	static formatMembersPartyRoom(members=[]){
		let result = ''
		for (let i = 0; i < 4; i++) {
			const member = members[i];
			if (member) {
				result += `**${MessageFormatting.tagUser(member.UserId)} ${member.isLeader ? "👑":""} — ${member.goal}**\n`
			}else{
				result += `*EMPTY SLOT*\n`
			}

		}
		return result
	}

	static countTotalMemberParty(members){
		let totalExistingMembers = 0
		let totalTrialMember = 0
		for (let i = 0; i < members.length; i++) {
			const member = members[i];
			if (member.isTrialMember) totalTrialMember++
			else totalExistingMembers++
		}
		return {
			totalExistingMembers,
			totalTrialMember
		}
	}

	static generatePartyRoom(client,cohort){
		const channelParty = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const formattedDate = Time.getFormattedDate(Time.getNextDate(7),true)
		const meetupDate = Time.getDateOnly(Time.getNextDate(7))
		supabase.from("PartyRooms")
		.select("*,MemberPartyRooms(UserId,goal,isLeader,isTrialMember)")
		.eq('cohort',cohort)
		.then(data=>{
			for (let i = 0; i < data.body.length; i++) {
				const party = data.body[i]
				const members = party.MemberPartyRooms
				members.sort(member=> {
					return member.isLeader ? -1 : 1 
				})

				setTimeout(() => {
					members.forEach(async member=>{
						const notificationThread = await ChannelController.getNotificationThread(client,member.id)
						notificationThread.send(PartyMessage.reminderSetHighlightAfterJoinParty(member.id))
					})
				}, 1000 * 60 * 15);
				const totalMemberParty = PartyController.countTotalMemberParty(members)
				const isFullParty = totalMemberParty.totalExistingMembers === 3 && totalMemberParty.totalTrialMember === 1
				channelParty.send(PartyMessage.partyRoom(
					party.id,
					PartyController.formatMembersPartyRoom(members),
					totalMemberParty,
					members[0].UserId,
					isFullParty
				))
				.then(async msg=>{
					supabase.from("PartyRooms")
						.update({msgId:msg.id})
						.eq('id',party.id)
						.then()
					const thread = await ChannelController.createThread(msg,`Party ${party.id}`)
					thread.send(PartyMessage.shareLinkPartyRoom(msg.id))
					for (let i = 0; i < members.length; i++) {
						const member = members[i];
						await thread.send(PartyMessage.userJoinedParty(member.UserId))	
					}
					setTimeout(() => {
						thread.send(PartyMessage.welcomingPartyRoom(party.id))
					}, 1000 * 60 * 5);
					setTimeout(async () => {
						thread.send(RecurringMeetupMessage.askToScheduleRecurringMeetup(formattedDate,meetupDate,party.id))
							.then(msg=>{
								supabase.from("PartyRooms")
									.update({meetupMessageId:msg.id})
									.eq('id',party.id)
									.then()
							})
						const time = Time.getNextDate(1)
						await supabase.from("Reminders")
							.insert({
								time,
								message:party.id,
								type:'reminderScheduleMeetup'
							})
						schedule.scheduleJob(time,async function() {
							const dataReminder = await supabase.from("Reminders")
								.select()
								.eq('type','weeklyMeetup')
								.eq('message',party.id)
								.gte('time',new Date().toISOString())

							if (dataReminder.body?.length === 0) {
								const dataMembersParty = await supabase.from("MemberPartyRooms")
									.select("UserId")
									.eq('partyId',party.id)

								if(dataMembersParty.body.length > 0){
									const queryOr = dataMembersParty.body.map(member=>`UserId.eq.${member.UserId}`)
									const dataWeeklyMeetup = await supabase.from("WeeklyMeetups")
										.select("UserId")
										.or(queryOr.join(','))
										.eq('PartyRoomId',party.id)
									const memberList = {}
									dataMembersParty.body.forEach(member=>memberList[member.UserId]=false)
									dataWeeklyMeetup.body.forEach(member=>memberList[member.UserId]=true)
									const tagMembers = []
									for (const userId in memberList) {
										if(!memberList[userId]) tagMembers.push(MessageFormatting.tagUser(userId))
									}
									const dataParty = await supabase.from("PartyRooms")
									.select('msgId,meetupMessageId')
									.eq('id',party.id)
									.single()
									const msgMeetup = await ChannelController.getMessage(thread,dataParty.body?.meetupMessageId)
									msgMeetup.reply(RecurringMeetupMessage.remindSomeoneToAcceptMeetup(tagMembers.join(' ')))
									
									const time = Time.getNextDate(1)
									await supabase.from("Reminders")
										.insert({
											time,
											message:party.id,
											type:'autoRescheduleMeetup'
										})
									schedule.scheduleJob(time,async function() {
										const dataReminder = await supabase.from("Reminders")
											.select()
											.eq('type','weeklyMeetup')
											.eq('message',party.id)
											.gte('time',new Date().toISOString())
			
										if (dataReminder.body?.length === 0) {
											RecurringMeetupController.rescheduleMeetup(client,dataParty.body?.msgId,Time.getNextTuesdayDate(),party.id)
										}
									})
								}

							}
						})
					}, 1000 * 60 * 10);
				})
			}
		})

		
	}

	static async disbandParty(client){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)

		const {celebrationDate} = LocalData.getData()
		const disbandPartyDate = Time.getDate(celebrationDate)
		disbandPartyDate.setHours(22)
		disbandPartyDate.setMinutes(0)

		const twoDaysBeforeDisbandParty = Time.getDate(disbandPartyDate.valueOf())
		twoDaysBeforeDisbandParty.setDate(twoDaysBeforeDisbandParty.getDate()-2)

		const oneDayBeforeDisbandParty = Time.getDate(disbandPartyDate.valueOf())
		oneDayBeforeDisbandParty.setDate(oneDayBeforeDisbandParty.getDate()-1)

		const disbandPartyIn30Minutes = Time.getDate(disbandPartyDate.valueOf())
		disbandPartyIn30Minutes.setMinutes(disbandPartyIn30Minutes.getMinutes()-30)

		const disbandPartyIn5Minutes = Time.getDate(disbandPartyDate.valueOf())
		disbandPartyIn5Minutes.setMinutes(disbandPartyIn5Minutes.getMinutes()-5)
		
		const dataParty = await supabase.from("PartyRooms")
		.select()
		.gte('disbandDate',Time.getTodayDateOnly())

		const partyRooms = []
		for (let i = 0; i < dataParty.body.length; i++) {
			const party = dataParty.body[i];
			const partyRoom = {}
			partyRoom.msg = await ChannelController.getMessage(channelPartyRoom,party.msgId)
			partyRoom.thread = await ChannelController.getThread(channelPartyRoom,party.msgId)
			partyRooms.push(partyRoom)
		}

		if (dataParty.body.length > 0) {
			schedule.scheduleJob(twoDaysBeforeDisbandParty,async ()=>{
				for (let i = 0; i < partyRooms.length; i++) {
					const party = partyRooms[i];
					party.thread.send(PartyMessage.remindPartyWillEnded2Days())
				}
			})
	
			schedule.scheduleJob(oneDayBeforeDisbandParty,async ()=>{
				for (let i = 0; i < partyRooms.length; i++) {
					const party = partyRooms[i];
					party.thread.send(PartyMessage.remindPartyWillEndedToday())
				}
			})
	
			schedule.scheduleJob(disbandPartyIn30Minutes,async ()=>{
				for (let i = 0; i < partyRooms.length; i++) {
					const party = partyRooms[i];
					party.thread.send(PartyMessage.remindPartyWillEnded30Minutes())
				}
			})
	
			schedule.scheduleJob(disbandPartyIn5Minutes,async ()=>{
				for (let i = 0; i < partyRooms.length; i++) {
					const party = partyRooms[i];
					party.thread.send(PartyMessage.remindPartyWillEnded5Minutes())
				}
			})
	
			schedule.scheduleJob(disbandPartyDate,async ()=>{
				for (let i = 0; i < partyRooms.length; i++) {
					const party = partyRooms[i];
					party.thread.send(PartyMessage.remindPartyWillEndedNow())
					setTimeout(() => {
						party.thread.delete()
						party.msg.delete()
					}, 1000 * 15);
				}
			})
		}

	}


}

module.exports = PartyController