const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { CHANNEL_GOALS, CHANNEL_PARTY_ROOM, CHANNEL_GENERAL, CHANNEL_CLOSA_CAFE} = require('../helpers/config');
const LocalData = require('../helpers/LocalData.js');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const PartyMessage = require('../views/PartyMessage');
const ChannelController = require('./ChannelController');
const schedule = require('node-schedule');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const MessageFormatting = require('../helpers/MessageFormatting');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');
const RecurringMeetupController = require('./RecurringMeetupController');
const MessageComponent = require('../helpers/MessageComponent');
const { EmbedBuilder, GuildScheduledEventEntityType } = require('discord.js');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
class PartyController{

	static showModalCustomReminder(interaction){
		const [commandButton,userId] = interaction.customId.split('_')
        if(commandButton === 'customReminder'){
			if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't edit someone else reminder.`})

			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set highlight reminder")
			.addComponents(
				new TextInputComponent().setCustomId('time').setLabel("Set time").setPlaceholder("e.g: 10.00 ").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
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

	static async generateWaitingRoomPartyMode(client){
		const {kickoffDate} = LocalData.getData()
		const ruleFirstDayCooldown = Time.getNextDate(-13,kickoffDate)
		ruleFirstDayCooldown.setHours(Time.minus7Hours(8))
		ruleFirstDayCooldown.setMinutes(30)
		schedule.scheduleJob(ruleFirstDayCooldown,async function(){
			const channelParty = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
			const [usersJoinedParty,totalUserHaveNotSetGoal] = await Promise.all([PartyController.getUsersJoinedParty(),await PartyController.getTotalUserHaveNotSetGoal()])
			
			const data = LocalData.getData()
			if(data.msgIdContentWaitingRoom){
				ChannelController.getMessage(channelParty,data.msgIdContentWaitingRoom)
					.then(msg=>msg.delete())
			}
			
			const msgContentWaitingRoom = await channelParty.send(PartyMessage.contentWaitingRoom(totalUserHaveNotSetGoal,PartyController.formatUsersJoinedParty(usersJoinedParty)))
			const msgCountdownWaitingRoom = await channelParty.send(PartyMessage.embedMessageWaitingRoom(PartyController.getFormattedTimeLeftUntilKickoff()))

			PartyController.countdownWaitingRoom(msgCountdownWaitingRoom)
			data.msgIdContentWaitingRoom = msgContentWaitingRoom.id
			data.msgIdCountdownWaitingRoom = msgCountdownWaitingRoom.id
			LocalData.writeData(data)
		})
	}

	static isRangePartyMode(){
		const waitingRoomDate = Time.getNextDate(-1,LocalData.getData().kickoffDate)
		waitingRoomDate.setHours(23)
		waitingRoomDate.setMinutes(59)
		const diffTime = Time.getDiffTime(Time.getDate(),waitingRoomDate)

		return diffTime >= 0 && diffTime <= (60 * 24 * 7)
	}

	static getFormattedTimeLeftUntilKickoff(){
		const kickoffDate = Time.getNextDate(-1,LocalData.getData().kickoffDate)
		kickoffDate.setHours(23)
		kickoffDate.setMinutes(59)
		const diffTime = Time.getDiffTime(Time.getDate(),kickoffDate)
		return Time.convertTime(diffTime,'short')
	}

	static async updateMessageWaitingRoom(client){
		const data = LocalData.getData()
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		
		if(data.msgIdCountdownWaitingRoom && PartyController.isRangePartyMode()){
			const [usersJoinedParty,totalUserHaveNotSetGoal] = await Promise.all([PartyController.getUsersJoinedParty(),await PartyController.getTotalUserHaveNotSetGoal()])
			const msgContentWaitingRoom = await ChannelController.getMessage(channelPartyRoom,data.msgIdContentWaitingRoom)
			msgContentWaitingRoom.edit(PartyMessage.contentWaitingRoom(totalUserHaveNotSetGoal,PartyController.formatUsersJoinedParty(usersJoinedParty)))

			const msgCountdownWaitingRoom = await ChannelController.getMessage(channelPartyRoom,data.msgIdCountdownWaitingRoom)
			PartyController.countdownWaitingRoom(msgCountdownWaitingRoom)
		}
	}

	static countdownWaitingRoom(msg){
		msg.edit(PartyMessage.embedMessageWaitingRoom(PartyController.getFormattedTimeLeftUntilKickoff()))
		const isStartUpdateHourly = PartyController.getFormattedTimeLeftUntilKickoff().includes('d')
		const countdownWaitingRoomHourly = setInterval(() => {
			if(!PartyController.getFormattedTimeLeftUntilKickoff().includes('d')){
				clearInterval(countdownWaitingRoomHourly)
				const countdownWaitingRoomMinutely = setInterval(() => {
					if(PartyController.getFormattedTimeLeftUntilKickoff().includes('-')){
						clearInterval(countdownWaitingRoomMinutely)
						msg.edit(PartyMessage.embedMessageWaitingRoom('0 m'))
					}else{
						msg.edit(PartyMessage.embedMessageWaitingRoom(PartyController.getFormattedTimeLeftUntilKickoff()))
					}
				}, 1000 * 60);
			}else{
				msg.edit(PartyMessage.embedMessageWaitingRoom(PartyController.getFormattedTimeLeftUntilKickoff()))
			}
		}, 1000 * 60 * (isStartUpdateHourly ? 60 : 1));
	}

	static sendReminderSetHighlightAfterJoinParty(client,members){
		setTimeout(() => {
			members.forEach(async member=>{
				const {UserId} =  member
				ChannelController.sendToNotification(
					client,
					PartyMessage.reminderSetHighlightAfterJoinParty(UserId),
					UserId
				)
			})
		}, 1000 * 60 * 15);
	}

	static async createPartyRoom(channelParty,members,partyId){
		const totalMemberParty = members.length
		const isFullParty = totalMemberParty === PartyController.getMaxPartyMember()
		const msgPartyRoom = await channelParty.send(PartyMessage.partyRoom(
			partyId,
			PartyController.formatMembersPartyRoom(members),
			totalMemberParty,
			isFullParty
		))

		return msgPartyRoom
	}

	static saveMessagePartyRoomId(msgId,partyId){
		supabase.from("PartyRooms").update({msgId}).eq('id',partyId).then()
	}

	static async getListMemberNotResponseScheduleMeetup(dataMembersParty,partyId){
		const queryOr = dataMembersParty.body.map(member=>`UserId.eq.${member.UserId}`)
		const dataWeeklyMeetup = await supabase.from("WeeklyMeetups")
			.select("UserId")
			.or(queryOr.join(','))
			.eq('PartyRoomId',partyId)

		const memberList = {}
		dataMembersParty.body.forEach(member=>memberList[member.UserId]=false)
		dataWeeklyMeetup.body.forEach(member=>memberList[member.UserId]=true)
		const tagMembers = []
		for (const userId in memberList) {
			if(!memberList[userId]) tagMembers.push(MessageFormatting.tagUser(userId))
		}
		return tagMembers
	}

	static async setReminderScheduleMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"reminderScheduleMeetup")
			.gte('time',new Date().toUTCString())
		if(data.data.length === 0 ) return

		for (let i = 0; i < data.data.length; i++) {
			const {time,message:partyId} = data.data[i];
			PartyController.remindUserToResponseScheduleMeetup(client,time,partyId)
		}
	}

	static async remindUserToResponseScheduleMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		schedule.scheduleJob(time,async function() {
			const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			const dataParty = await supabase.from("PartyRooms")
						.select('msgId,meetupMessageId')
						.eq('id',partyId)
						.single()
			const thread = await ChannelController.getThread(channelPartyRoom,dataParty.body?.msgId)
			
			if (!dataWeeklyMeetup.body) {
				const dataMembersParty = await supabase.from("MemberPartyRooms")
					.select("UserId")
					.eq('partyId',partyId)

				if(dataMembersParty.body.length > 0){
					const time = new Date()
					time.setDate(time.getDate()+1)
					await supabase.from("Reminders")
						.insert({
							time,
							message:partyId,
							type:'autoRescheduleMeetup'
						})
					PartyController.autoRescheduleMeetup(client,time,partyId)

					const tagMembers = await PartyController.getListMemberNotResponseScheduleMeetup(dataMembersParty,partyId)

					const msgMeetup = await ChannelController.getMessage(thread,dataParty.body?.meetupMessageId)
					msgMeetup.reply(RecurringMeetupMessage.remindSomeoneToAcceptMeetup(tagMembers.join(' ')))
				}

			}
		})	
	}


	static async setReminderAutoRescheduleMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"autoRescheduleMeetup")
			.gte('time',new Date().toUTCString())
		
		if(data.data.length === 0 ) return
		for (let i = 0; i < data.data.length; i++) {
			const {time,message:partyId} = data.data[i];
			PartyController.autoRescheduleMeetup(client,time,partyId)
		}
	}

	static async autoRescheduleMeetup(client,time,partyId){
		schedule.scheduleJob(time,async function() {
			const dataParty = await supabase.from("PartyRooms")
						.select('msgId,meetupMessageId')
						.eq('id',partyId)
						.single()
			const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			const meetupDate = new Date(time)
			meetupDate.setDate(meetupDate.getDate()+6)

			if (!dataWeeklyMeetup.body) {
				RecurringMeetupController.rescheduleMeetup(client,dataParty.body?.msgId,meetupDate,partyId)
			}
		})
	}

	static async generatePartyRoom(client,cohort){
		const channelParty = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const formattedDate = Time.getFormattedDate(Time.getNextDate(7),true)
		const meetupDate = Time.getDateOnly(Time.getNextDate(7))
		const data = await supabase.from("PartyRooms")
			.select("*,MemberPartyRooms(Users(goalId),UserId,project,isLeader,isTrialMember)")
			.eq('cohort',cohort)
		
		for (let i = 0; i < data.data.length; i++) {
			const party = data.data[i]
			const members = PartyController.sortMemberByLeader(party?.MemberPartyRooms)
			
			const msgPartyRoom = await PartyController.createPartyRoom(channelParty,members,party.id)
			PartyController.saveMessagePartyRoomId(msgPartyRoom.id,party.id)

			const thread = await ChannelController.createThread(msgPartyRoom,`Party ${party.id}`)
			thread.send(PartyMessage.shareLinkPartyRoom(msgPartyRoom.id))
			for (let i = 0; i < members.length; i++) {
				const member = members[i];
				const goalId = member.Users.goalId
				for (let j = 0; j < members.length; j++) {
					const userId = members[j].UserId;
					if(member.UserId === userId) continue
					ChannelController.addUserToThread(client,CHANNEL_GOALS,goalId,userId)
				}
				await thread.send(PartyMessage.userJoinedParty(member.UserId))	
			}
			
			let tagPartyMembers = PartyController.formatTagPartyMembers(members)
			setTimeout(async () => {
				await thread.send(PartyMessage.welcomingPartyRoom(party.id,tagPartyMembers))
				thread.send('————————')
			}, 1000 * 60 * 5);

			setTimeout(async () => {
				const time = new Date()
				time.setDate(time.getDate() + 1)
				await supabase.from("Reminders")
					.insert({
						time,
						message:party.id,
						type:'reminderScheduleMeetup'
					})
				PartyController.remindUserToResponseScheduleMeetup(client,time,party.id)

				const msgPartyRoom = await thread.send(RecurringMeetupMessage.askToScheduleRecurringMeetup(formattedDate,meetupDate,party.id,tagPartyMembers))
				
				supabase.from("PartyRooms")
					.update({meetupMessageId:msgPartyRoom.id})
					.eq('id',party.id)
					.then()
			}, 1000 * 60 * 10);

			PartyController.sendReminderSetHighlightAfterJoinParty(client,members)

		}
	}

	static async followGoalAccountabilityPartner(client,partyId,userId,msgGoalId){
		const {body:members} = await supabase.from("MemberPartyRooms")
			.select("UserId,Users(goalId)")
			.eq('partyId',partyId)
			.neq('UserId',userId)
		for (let i = 0; i < members.length; i++) {
			const member = members[i];
			const goalId = member.Users.goalId
			ChannelController.addUserToThread(client,CHANNEL_GOALS,goalId,userId)
			ChannelController.addUserToThread(client,CHANNEL_GOALS,msgGoalId,member.UserId)
		}

	}

	static async unfollowGoalAccountabilityPartner(client,partyId,userId,msgGoalId){
		if(!msgGoalId){
			const dataUser = await supabase.from("Users")
				.select('goalId')
				.eq('id',userId)
				.single()
			msgGoalId = dataUser.body.goalId
		}
		const {body:members} = await supabase.from("MemberPartyRooms")
			.select("UserId,Users(goalId)")
			.eq('partyId',partyId)
			.neq('UserId',userId)
		for (let i = 0; i < members.length; i++) {
			const member = members[i];
			const goalId = member.Users.goalId
			ChannelController.removeUserFromThread(client,CHANNEL_GOALS,goalId,userId)
			ChannelController.removeUserFromThread(client,CHANNEL_GOALS,msgGoalId,member.UserId)
		}

	}

	static async removeWaitingRoom(client){
		const {kickoffDate} = LocalData.getData()
		const ruleFirstDayCooldown = Time.getNextDate(-1,kickoffDate)
		ruleFirstDayCooldown.setHours(Time.minus7Hours(23))
		ruleFirstDayCooldown.setMinutes(59)
		schedule.scheduleJob(ruleFirstDayCooldown,async function(){
			const {msgIdContentWaitingRoom,msgIdCountdownWaitingRoom} = LocalData.getData()
			const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
			const msgContent = await ChannelController.getMessage(channelPartyRoom,msgIdContentWaitingRoom)
			msgContent.edit(`**Find accountability partner by joining available party room** → ${MessageFormatting.tagChannel(CHANNEL_PARTY_ROOM)}`)
			ChannelController.getMessage(channelPartyRoom,msgIdCountdownWaitingRoom)
				.then(msg=>{
					msg.delete()
				})
		})
	}

	static async announcePartyModeAvailable(client){
		const channelGeneral = ChannelController.getChannel(client,CHANNEL_GENERAL)

		const {kickoffDate} = LocalData.getData()
		const ruleFirstDayCooldown = Time.getNextDate(-13,kickoffDate)
		ruleFirstDayCooldown.setHours(Time.minus7Hours(20))
		ruleFirstDayCooldown.setMinutes(25)
		schedule.scheduleJob(ruleFirstDayCooldown,async function(){
			channelGeneral.send(PartyMessage.announceOpenPartyMode(Time.getFormattedDate(Time.getNextDate(-1,kickoffDate),true)))
		})
		const ruleLastDayCooldown = Time.getNextDate(-2,kickoffDate)
		ruleLastDayCooldown.setHours(Time.minus7Hours(20))
		ruleLastDayCooldown.setMinutes(25)
		schedule.scheduleJob(ruleLastDayCooldown,async function(){
			channelGeneral.send(PartyMessage.reminderOpenPartyMode())
		})
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
                entityType:GuildScheduledEventEntityType.Voice,
                channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
            })
            .then(kickoffEventId=>{
                const data = LocalData.getData()
                data.kickoffEventId = kickoffEventId.id
                LocalData.writeData(data)
            })
        })
	}

	static async addMemberPartyRoom(client,goalId,partyId,UserId){
		const thread = await ChannelController.getGoalThread(client,goalId)
		let project = thread.name.split('by')[0]
		const endPartyDate = LocalData.getData().deadlineGoal
		return await supabase.from("MemberPartyRooms").insert({project,partyId,endPartyDate,UserId})
	}

	static async removeMemberPartyRoom(client,goalId,partyId,UserId){
		const channelGoals = ChannelController.getChannel(client,CHANNEL_GOALS)
		const thread = await ChannelController.getThread(channelGoals,goalId)
		return await PartyController.deleteUserFromParty(UserId,partyId)
	}

	static async updateMessagePartyRoom(client,msgId,partyNumber){
		const channelParty = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const msgParty = await ChannelController.getMessage(channelParty,msgId)
		supabase.from("PartyRooms")
		.select("*,MemberPartyRooms(UserId,project,isLeader,isTrialMember)")
		.eq('id',partyNumber)
		.single()
		.then(async data=>{
			const members = PartyController.sortMemberByLeader(data?.body?.MemberPartyRooms)
			const totalMember = members.length
			const isFullParty = totalMember === PartyController.getMaxPartyMember()
			msgParty.edit(PartyMessage.partyRoom(
				partyNumber,
				PartyController.formatMembersPartyRoom(members),
				totalMember,
				isFullParty
			))
		})

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

	static async sendNotifToSetHighlight(client,userId,task) {
		supabase.from("Goals")
			.select('id,alreadySetHighlight,Users(notificationId,reminderHighlight)')
			.eq("UserId",userId)
			.gt('deadlineGoal',Time.getTodayDateOnly())
			.eq('alreadySetHighlight',false)
			.single()
			.then(async data => {
				 if(data.data){
						supabase.from("Goals")
							.update({alreadySetHighlight:true})
							.eq('id',data.data.id)
							.then()
						const {reminderHighlight,notificationId}= data.data.Users
						ChannelController.sendToNotification(
							client,
							reminderHighlight ? PartyMessage.settingReminderHighlightExistingUser(userId,reminderHighlight,task) : PartyMessage.settingReminderHighlight(userId,task),
							userId,
							notificationId
						)
				}else{
					ChannelController.sendToNotification(
						client,
						HighlightReminderMessage.remindHighlightUser(userId,task),
						userId
					)
				}
			})
	}

	//TODO make it efficient
	static setProgressReminder(interaction,shareProgressAt){
		supabase.from("Users")
		.select('reminderProgress')
		.eq('id',interaction.user.id)
		.single()
		.then(data => {
			if (data.data.reminderProgress !== shareProgressAt) {
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
									const {id:userId,notificationId} = data;
									ChannelController.sendToNotification(
										interaction.client,
										TodoReminderMessage.progressReminder(userId),
										userId,
										notificationId
									)
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

	static formatMembersPartyRoom(members=[]){
		let result = ''
		const maxMember = PartyController.getMaxPartyMember()
		for (let i = 0; i < maxMember; i++) {
			const member = members[i];
			if (member) {
				result += `**${MessageFormatting.tagUser(member.UserId)} ${member.isLeader ? "👑":""} — ${member.project}**\n`
			}else{
				result += `*EMPTY SLOT*\n`
			}

		}
		return result
	}

	static async disbandParty(client){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)

		const {celebrationDate} = LocalData.getData()
		const disbandPartyDate = Time.getDate(celebrationDate)
		disbandPartyDate.setHours(Time.minus7Hours(22))
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
						party.msg.delete()
					}, 1000 * 15);
				}
			})
		}
	}

	static async getMessageWaitingRoom(client){
		const channelParty = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const msg = await ChannelController.getMessage(channelParty,LocalData.getData().msgIdContentWaitingRoom)
		return msg
	}

	static formatUsersJoinedParty(users){
		let result = ''
		for (let i = 0; i < users.length; i++) {
			const user = users[i];
			result += `${user.alreadySetGoal ? "✅" : "⏳"} ${MessageFormatting.tagUser(user.UserId)}`
			if(i !== users.length - 1) result += '\n'
		}
		return result
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

	static async getUsersJoinedParty(){
		const data = await supabase.from("JoinParties")
			.select()
			.eq('cohort',this.getNextCohort())
			.order('createdAt',{ascending:false})
		return data.data
	}

	static sortMemberByLeader(members){
		members.sort(member=> {
			return member.isLeader ? -1 : 1 
		})
		return members
	}

	static async checkSlotParty(partyNumber){
		const dataParty = await supabase.from("PartyRooms")
		.select("*,MemberPartyRooms(UserId,project,isLeader,isTrialMember)")
		.eq('id',partyNumber)
		.single()
		const members = dataParty.body?.MemberPartyRooms
		const totalMember = members.length
		const result = {
			isFull:false,
			forMember:null
		}
		if (totalMember === PartyController.getMaxPartyMember()) {
			result.isFull = true
			result.forMember = "existing"
		}

		return result
	}

	static getMaxPartyMember(){
		return 4
	}

	static async dataJoinedParty(userId){
		const dataJoinedParty = await supabase.from("MemberPartyRooms")
			.select('PartyRooms(msgId),Users(notificationId)')
			.eq("UserId",userId)
			.gte("endPartyDate",Time.getTodayDateOnly())
			.single()
		return dataJoinedParty.body
	}

	static async deleteUserFromParty(userId,partyNumber){
		return await supabase.from("MemberPartyRooms")
			.delete()		
			.eq("UserId",userId)
			.eq('partyId',partyNumber)
	}

	static async getRecentActiveUserInParty(members,userId){
		const filteredMembers = members.filter(member=>member.UserId != userId)
		const queryOr = filteredMembers.map(member=>`UserId.eq.${member.UserId}`)
		const dataRecentUser = await supabase.from('Points')
			.select()
			.or(queryOr.join(','))
			.neq('UserId',userId)
			.limit(1)
			.order('updatedAt',{ascending:false})
			.single()
		return dataRecentUser
	}

	static async getTotalUserHaveNotSetGoal(){
        const {count} = await supabase
			.from('JoinParties')
			.select('id', { count: 'exact' })
			.eq('cohort',this.getNextCohort())
			.eq('alreadySetGoal',false)

        return count
	}

	static getNextCohort(){
		return LocalData.getData().cohort + 1
	}

	static getThisCohort(){
		return LocalData.getData().cohort 
	}

	static isPartyMode(value){
		const accountabilityMode = value.split('-')[0]
		return accountabilityMode === 'party'
	}

	static async isMemberParty(userId,partyNumber){
		const data = await supabase.from("MemberPartyRooms")
			.select()
			.eq('UserId',userId)
			.eq('partyId',partyNumber)
			.single()
		return !!data.data
	}

	static async saveDataJoinPartyToMemberPartyRoom(){
		const data = await supabase.from("JoinParties")
		.select("id,UserId,project")
		.eq('cohort',PartyController.getThisCohort())

		if(data.data){
			const endPartyDate = LocalData.getData().deadlineGoal
			const memberPartyRooms = data.data.map(({id,UserId,project})=>{
				return {
					UserId,
					project,
					endPartyDate,
					JoinPartyId:id,
				}
			})
			await supabase.from("MemberPartyRooms")
				.insert(memberPartyRooms)
		}
	}

	static async partyReminder(client){
        let ruleReminderSkipTwoDays = new schedule.RecurrenceRule();
		ruleReminderSkipTwoDays.hour = Time.minus7Hours(21)
		ruleReminderSkipTwoDays.minute = 0

		schedule.scheduleJob(ruleReminderSkipTwoDays,function(){
			if (!Time.isCooldownPeriod()) {
				supabase.from("Users")
					.select('id,name')
					.eq('lastDone',Time.getDateOnly(Time.getNextDate(-3)))
					.then(dataUsers =>{
						if (dataUsers.body) {
							dataUsers.body.forEach(async user=>{
								const data = await supabase.from("MemberPartyRooms")
									.select("PartyRooms(MemberPartyRooms(UserId),msgId)")
									.eq("UserId",user.id)
									.gte('endPartyDate',Time.getTodayDateOnly())
									.single()
								if(data.data){
									const dataActiveUser = await PartyController.getRecentActiveUserInParty(data.data.PartyRooms.MemberPartyRooms,user.id)
									const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
									const threadParty = await ChannelController.getThread(channelPartyRoom,data.data.PartyRooms.msgId)
									threadParty.send(PartyMessage.partyReminder(user.id,dataActiveUser.body.UserId))
								}
							})
						}
					})
			}
		})
	}

	static async handleOutsideMemberChatInPartyRoom(msg){
		const [label,partyNumber] = msg?.channel?.name?.split(' ')
		if(label === "Party"){
			const isMemberParty = await PartyController.isMemberParty(msg.author.id,partyNumber)
			if (!isMemberParty) {
				msg.delete()
				msg.channel.members.remove(msg.author.id)
				ChannelController.sendToNotification(
					msg.client,
					PartyMessage.replyOutsiderMemberCannotChat(),
					msg.author.id
				)
			}
		}
	}

	static async handleMentionOutsideMemberInPartyRoom(msg){
		const [label,partyNumber] = msg?.channel?.name?.split(' ')
		if(label === "Party" && msg.mentions.users.size > 0){
			let isDeleteMessage = false
			for (const [userId,user] of msg.mentions.users) {
				if(user.bot) continue
				const isMemberParty = await PartyController.isMemberParty(userId,partyNumber)
				if (!isMemberParty) {
					isDeleteMessage = true
					msg.channel.members.remove(userId)
					break
				}
			}
			if(isDeleteMessage){
				msg.delete()
				msg.channel.send(PartyMessage.replyCannotMentionNotPartyMember())
			}
		}
	}

	static async shareToPartyRoom(client,userId,message){
        const dataUser = await PartyController.getDataMember(userId)
		
        if(!dataUser.body) return 
        
        const msgId = dataUser.body.PartyRooms.msgId
        
        const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,msgId)
		threadParty.send(message)
    }

	static async notifyMemberPartyShareReflection(client,userId,msgIdReflection){
        const dataUser = await PartyController.getDataMember(userId)
        if(!dataUser.body) return 
        
        const msgId = dataUser.body.PartyRooms.msgId
        const project = dataUser.body.project
        const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,msgId)
		threadParty.send(PartyMessage.notifyMemberShareReflection(userId,msgIdReflection,project))
    }

	static async notifyMemberPartyShareCelebration(client,userId,msgIdCelebration){
        const dataUser = await PartyController.getDataMember(userId)
        if(!dataUser.body) return 
        
        const msgId = dataUser.body.PartyRooms.msgId
        const project = dataUser.body.project
        const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,msgId)
		threadParty.send(PartyMessage.notifyMemberShareCelebration(userId,msgIdCelebration,project))
    }

	static async getPartyUser(userId){
		return await supabase.from("MemberPartyRooms")
			.select('PartyRooms(msgId)')
            .eq('UserId',userId)
            .gte("endPartyDate",Time.getTodayDateOnly())
            .single()
	}

	static async getDataMember(userId){
		return await supabase.from("MemberPartyRooms")
		.select("project,PartyRooms(msgId)")
		.gte("endPartyDate",Time.getTodayDateOnly())
		.eq('UserId',userId)
		.not('project','is',null)
		.single()
	}

	static formatTagPartyMembers(members){
		if(!members || members?.length === 0) return '@everyone'
		else return members.map(member=>MessageFormatting.tagUser(member.UserId))
	}

	static async generateTemplateProgressRecap(){
		const ruleGenerateProgressRecap = new schedule.RecurrenceRule();
        ruleGenerateProgressRecap.hour = Time.minus7Hours(23)
        ruleGenerateProgressRecap.minute = 55
		schedule.scheduleJob(ruleGenerateProgressRecap,async function(){
			const {celebrationDate} = LocalData.getData()
			const startCohortDate = Time.getDateOnly(Time.getNextDate(-28,celebrationDate))

			const tomorrowDate = Time.getDateOnly(Time.getNextDate(1))

			const data = await supabase.from('PartyRooms')
				.select("id,msgId,MemberPartyRooms(UserId,Users(name,lastDone,lastSafety))")
				.gte('disbandDate',tomorrowDate)

			if(data.data.length === 0) return

			const insertData = []
			data.data.forEach(party=>{
				const {id,msgId,MemberPartyRooms} = party
				const partyMember = {}
				MemberPartyRooms.forEach((member)=>{
					const UserId = member.UserId
					let lastDone = member.Users.lastDone
					const username = member.Users.name
					if(member.Users.lastSafety > lastDone) lastDone = member.Users.lastSafety
					if(!lastDone || lastDone < startCohortDate){
						lastDone = startCohortDate
					}
					partyMember[UserId] = {type:'skip',username,lastDone}
				})
				insertData.push({
					PartyRoomId:id,
					msgIdParty:msgId,
					progressMember:partyMember,
					date:tomorrowDate
				})
			})
			supabase.from("PartyProgressRecaps")
				.insert(insertData)
				.then()
		})
	}

	static async updateDataProgressRecap(userId,type,data){
		const dataUser = await supabase.from("MemberPartyRooms")
			.select()
			.gte("endPartyDate",Time.getTodayDateOnly())
			.eq('UserId',userId)
			.single()

		if(!dataUser.body) return

		const date = Time.getDate()
		if(date.getHours() === 23){
			if(date.getMinutes() >= 55){
				supabase.from("PartyProgressRecaps")
					.select()
					.eq("PartyRoomId",dataUser.body.partyId)
					.eq('date',Time.getTomorrowDateOnly())
					.single()
					.then(data=>{
						if(data.data){
							const {progressMember} = data.data
							progressMember[userId].lastDone = Time.getTodayDateOnly()
							supabase.from("PartyProgressRecaps")
							.update({progressMember})
							.eq("PartyRoomId",dataUser.body.partyId)
							.eq('date',Time.getTomorrowDateOnly())
							.then()
						}
					})
			}
		}

		const dataPartyRecap = await supabase.from("PartyProgressRecaps")
			.select()
			.eq("PartyRoomId",dataUser.body.partyId)
			.eq('date',Time.getTodayDateOnly())
			.single()
		if(!dataPartyRecap.body) return

		const {progressMember} = dataPartyRecap.body
		if(type === 'progress'){
			progressMember[userId] = data
		}else{
			progressMember[userId].type = type
		}

		supabase.from("PartyProgressRecaps")
			.update({progressMember})
			.eq("PartyRoomId",dataUser.body.partyId)
			.eq('date',Time.getTodayDateOnly())
			.then()
	}
	static async updateRecapAfterRepairStreak(userId){
		const dataUser = await supabase.from("MemberPartyRooms")
			.select()
			.gte("endPartyDate",Time.getTodayDateOnly())
			.eq('UserId',userId)
			.single()

		if(!dataUser.body) return

		const dataPartyRecap = await supabase.from("PartyProgressRecaps")
			.select()
			.eq("PartyRoomId",dataUser.body.partyId)
			.eq('date',Time.getTodayDateOnly())
			.single()
		if(!dataPartyRecap.body) return

		const {progressMember} = dataPartyRecap.body
		progressMember[userId].type = 'skip'
		progressMember[userId].lastDone = Time.getDateOnly(Time.getNextDate(-2))

		supabase.from("PartyProgressRecaps")
			.update({progressMember})
			.eq("PartyRoomId",dataUser.body.partyId)
			.eq('date',Time.getDateOnly(Time.getNextDate(-1)))
			.then()
	}

	static async sendProgressRecap(client){
		const ruleSendProgressRecap = new schedule.RecurrenceRule();
        ruleSendProgressRecap.hour = 2
        ruleSendProgressRecap.minute = 0
		schedule.scheduleJob(ruleSendProgressRecap,async function(){
			const dataPartyRecap = await supabase.from("PartyProgressRecaps")
				.select()
				.eq('date',Time.getDateOnly(Time.getNextDate(-1)))
			if(dataPartyRecap.body.length === 0) return
	
			const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
	
			dataPartyRecap.body.forEach(async party=>{
				const {id,date,progressMember,PartyRoomId,msgIdParty} = party
				const progressMembers = []
				const noProgressMembers = []
				const selectMenu = []
				for (const UserId in progressMember) {
					const {
						type,lastDone,avatarURL,username,time,msgId,msgContent
					} = progressMember[UserId]
					if(type === 'progress') {
						progressMembers.push(PartyMessage.shareProgress(
							username,avatarURL,time,msgContent,msgId
						))
					}else{
						let message = ''
						switch (type) {
							case 'skip':
								const totalSkipDay = PartyController.getTotalSkipDay(lastDone,date)
								if(totalSkipDay === 1) {
									message = `🫡${MessageFormatting.tagUser(UserId)} miss once`
									selectMenu.push({
										label:`${username} no progress (${totalSkipDay}x)`,
										value:UserId
									})
								}else {
									message = `🫥${MessageFormatting.tagUser(UserId)} no progress (${totalSkipDay}x)`
									selectMenu.push({
										label:`${username} no progress (${totalSkipDay}x)`,
										value:UserId
									})
								}
								break;
							case 'vacation':
								message = `🏖️${MessageFormatting.tagUser(UserId)} on vacation`
								break;
							case 'sick':
								message = `🤢${MessageFormatting.tagUser(UserId)} on sick leave`
							break;
						}
						noProgressMembers.push(message)
					}
				}
				const threadParty = await ChannelController.getThread(channelPartyRoom,msgIdParty)
				await threadParty.send(PartyMessage.headlineProgressRecap(PartyRoomId))
				
				if(progressMembers.length > 0){
					await threadParty.send({
						embeds:progressMembers
					})
				}
				if(noProgressMembers.length > 0){
					const components = []
					if(selectMenu.length > 0){
						components.push(
							MessageComponent.createComponent(
								MessageComponent.addMenu( 
									`boostPartyMember`,
									"-Select friends to boost-",
									selectMenu
								)
							)
						)
					}
					await threadParty.send({
						content:`\`\`\`friends that need your support\n...\`\`\``,
						embeds:[
							new EmbedBuilder()
								.setColor('#ffffff')
								.setDescription(noProgressMembers.join('\n\n'))
						],
						components
					})
	
				}
			})
		})
	}

	static getTotalSkipDay(lastDone,date){
		return Time.getDiffDay(Time.getDate(lastDone),Time.getDate(date))
	}

}

module.exports = PartyController