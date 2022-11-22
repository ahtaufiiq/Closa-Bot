const { PermissionFlagsBits, ChannelType } = require("discord-api-types/v9");
const { GUILD_ID, CATEGORY_CHAT, CHANNEL_PARTY_ROOM } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const ChannelController = require("./ChannelController");
const MemberController = require("./MemberController");
const schedule = require('node-schedule');
const Time = require("../helpers/time");
const RecurringMeetupMessage = require("../views/RecurringMeetupMessage");
const LocalData = require("../helpers/LocalData");

class RecurringMeetupController {
	static async createPrivateVoiceChannel(client,channelName,allowedUsers=[]){
		const guild = client.guilds.cache.get(GUILD_ID)
        
		const permissionOverwrites = [
			{
				id:guild.roles.everyone.id,
				deny:[
					PermissionFlagsBits.Connect
				]
			}
		]

		for (let i = 0; i < allowedUsers.length; i++) {
			const userId = allowedUsers[i];
			const {user} = await MemberController.getMember(client,userId)
			permissionOverwrites.push({
				id:user.id,
				allow:[
					PermissionFlagsBits.Connect
				]
			})
		}
		
		const voiceChannel = await guild.channels.create(channelName,{
			permissionOverwrites,
			parent:ChannelController.getChannel(client,CATEGORY_CHAT),
			type:ChannelType.GuildVoice,
		})
		setTimeout(() => {
			if(voiceChannel.members.size < 2){
				voiceChannel.delete()
			}
		}, 1000 * 60 * 35);
		return voiceChannel.id
	}

	static async getTotalResponseMemberMeetup(partyId,acceptMeetup=true){
		const {count} = await supabase.from("WeeklyMeetups")
			.select('id',{count:'exact'})
			.eq("PartyRoomId",partyId)
			.gte('meetupDate',new Date().toISOString())
			.eq('isAcceptMeetup',acceptMeetup)
		return count
	}

	static async createChannel5MinutesBeforeSchedule(){
		schedule.scheduleJob(reminder.time,async function() {
			const notificationThread = await ChannelController.getNotificationThread(client,reminder.UserId,reminder.Users.notificationId)
			notificationThread.send(`Hi <@${reminder.UserId}> reminder: ${reminder.message} `)
		})
	}

	static async rescheduleMeetup(client,threadId,date,partyId){
		date.setDate(date.getDate()+7)
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,threadId)
		const formattedDate = Time.getFormattedDate(date,true)
		const customDate = Time.getFormattedDate(Time.getNextDate(2),false,'long').split(',')[0]

		if(RecurringMeetupController.isDateBeforeCelebrationDay(date)){
			threadParty.send(RecurringMeetupMessage.showHowToRescheduleMeetup(formattedDate,customDate))
			this.scheduleMeetup(client,date,threadId,partyId)
		}else{
			threadParty.send(RecurringMeetupMessage.notAutomaticRescheduleMeetupAfterCelebrationDay(customDate))
		}
	}

	static async scheduleMeetup(client,scheduleMeetupDate,threadId,partyId){
		await RecurringMeetupController.deleteOldWeeklyMeetup(partyId)

		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,threadId)

		const twoDayBefore = Time.getDate(scheduleMeetupDate.valueOf())
		twoDayBefore.setDate(twoDayBefore.getDate()-2)

		const oneDayBefore = Time.getDate(scheduleMeetupDate.valueOf())
		oneDayBefore.setDate(oneDayBefore.getDate()-1)
		
		const oneHourBefore = Time.getDate(scheduleMeetupDate.valueOf())
		oneHourBefore.setHours(oneHourBefore.getHours()-1)
		
		const tenMinutesBefore = Time.getDate(scheduleMeetupDate.valueOf())
		tenMinutesBefore.setMinutes(tenMinutesBefore.getMinutes()-10)

		const fiveMinutesBefore = Time.getDate(scheduleMeetupDate.valueOf())
		fiveMinutesBefore.setMinutes(fiveMinutesBefore.getMinutes()-5)
		supabase.from("Reminders")
			.insert([
				{ message:partyId, time:twoDayBefore, type:'twoDayBeforeMeetup'},
				{ message:partyId, time:oneDayBefore, type:'oneDayBeforeMeetup'},
				{ message:partyId, time:oneHourBefore, type:'oneHourBeforeMeetup'},
				{ message:partyId, time:tenMinutesBefore, type:'tenMinutesBeforeMeetup'},
				{ message:partyId, time:fiveMinutesBefore, type:'fiveMinutesBeforeMeetup'},
			])
			.then()

		supabase.from("Reminders")
			.insert({
				message:partyId,
				time:scheduleMeetupDate,
				type:'weeklyMeetup'
			})
			.single()
			.then(async scheduleWeeklyMeetup=>{
				//TODO add this cron to events ready like remind highlight user for this 4 event 
				schedule.scheduleJob(twoDayBefore,async function() {
					const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
					if(dataWeeklyMeetup.body && dataWeeklyMeetup.body.id === scheduleWeeklyMeetup.body.id ){
						threadParty.send(RecurringMeetupMessage.confirmationTwoDaysBeforeMeetup(partyId,scheduleWeeklyMeetup.body.id))
					}
				})
				schedule.scheduleJob(oneDayBefore,async function() {
					const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
					if(dataWeeklyMeetup.body && dataWeeklyMeetup.body.id === scheduleWeeklyMeetup.body.id ){
						threadParty.send(RecurringMeetupMessage.reminderOneDayBeforeMeetup())
					}
				})
				schedule.scheduleJob(oneHourBefore,async function() {
					const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
					if(dataWeeklyMeetup.body && dataWeeklyMeetup.body.id === scheduleWeeklyMeetup.body.id ){
						threadParty.send(RecurringMeetupMessage.reminderOneHourBeforeMeetup())
					}
				})
				schedule.scheduleJob(tenMinutesBefore,async function() {
					const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
					if(dataWeeklyMeetup.body && dataWeeklyMeetup.body.id === scheduleWeeklyMeetup.body.id ){
						threadParty.send(RecurringMeetupMessage.reminderTenMinBeforeMeetup())
					}
				})
				schedule.scheduleJob(fiveMinutesBefore,async function() {
					const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
					if(dataWeeklyMeetup.body && dataWeeklyMeetup.body.id === scheduleWeeklyMeetup.body.id ){
						supabase.from("PartyRooms")
						.select("MemberPartyRooms(UserId)")
						.eq('id',partyId)
						.single()
						.then(async data=>{
							const members = data.body.MemberPartyRooms.map(member=>member.UserId)
							const voiceChannelId = await RecurringMeetupController.createPrivateVoiceChannel(client,`Party ${partyId}`,members)
							supabase.from('PartyRooms')
								.update({voiceChannelId})
								.eq('id',partyId)
								.then()
						})
					}
				})
				schedule.scheduleJob(scheduleMeetupDate,async function() {
					const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
					if(dataWeeklyMeetup.body && dataWeeklyMeetup.body.id === scheduleWeeklyMeetup.body.id ){
						if(RecurringMeetupController.isDateBeforeCelebrationDay(Time.getDate(dataWeeklyMeetup.body.time))){
							const nextMeetupDate = Time.getDate(scheduleMeetupDate.valueOf())
							nextMeetupDate.setDate(nextMeetupDate.getDate() + 7)
							RecurringMeetupController.scheduleMeetup(client,nextMeetupDate,threadId)
						}
						const dataParty = await supabase.from("PartyRooms")
							.select()
							.eq('id',partyId)
							.single()
						const voiceChannelId = dataParty.body.voiceChannelId
						threadParty.send(RecurringMeetupMessage.remindUserJoinMeetupSession(voiceChannelId))
					}
				})
			})
	}

	static isDateBeforeCelebrationDay(date){
		const {celebrationDate} = LocalData.getData()
		return Time.getDateOnly(date) < celebrationDate
	}

	static async getWeeklyMeetupParty(partyId){
		return await supabase.from("Reminders")
			.select()
			.eq('type','weeklyMeetup')
			.eq('message',partyId)
			.gte('time',new Date().toISOString())
			.single()
	}

	static async deleteOldWeeklyMeetup(partyId){
		return await supabase.from("Reminders")
			.delete()
			.eq('type','weeklyMeetup')
			.eq('message',partyId)
			.gte('time',new Date().toISOString())
			.single()
	}

	static async interactionConfirmationMeetup(interaction,isAcceptMeetup,value){
		const [partyId,meetupDateOnly] = value.split('|')
		const meetupDate = Time.getDate(meetupDateOnly)
		meetupDate.setHours(Time.minus7Hours(21))
		meetupDate.setMinutes(0)
		const data = await supabase.from("WeeklyMeetups")
			.select()
			.eq('PartyRoomId',partyId)
			.eq('UserId',interaction.user.id)
			.gte('meetupDate',new Date().toISOString())
			.single()

		if (!data.body) {
			await supabase.from("WeeklyMeetups")
			.insert({
				meetupDate,
				isAcceptMeetup,
				UserId:interaction.user.id,
				PartyRoomId:partyId
			})
			.then()
		}else{
			await supabase.from("WeeklyMeetups")
				.update({isAcceptMeetup})
				.eq("UserId",interaction.user.id)
				.eq("PartyRoomId",partyId)
				.gte('meetupDate',new Date().toISOString())
				.then()
		}
		
		if(isAcceptMeetup) interaction.editReply(`${interaction.user} just accepted the meetup invitation ✅`)
		else interaction.editReply(`${interaction.user} just declined the meetup invitation`)
		
		RecurringMeetupController.getTotalResponseMemberMeetup(partyId,isAcceptMeetup)
			.then(async totalUser=>{
				if (totalUser === 2) {
					if(isAcceptMeetup) RecurringMeetupController.scheduleMeetup(interaction.client,meetupDate,interaction.message.channelId,partyId)
					else RecurringMeetupController.rescheduleMeetup(interaction.client,interaction.message.channelId,meetupDate,partyId)
				}
			})
					
	}

	static async getTotalResponseCannotAttend(weeklyMeetupId){
		const {count} = await supabase.from("Reminders")
			.select('id',{count:'exact'})
			.eq('message',weeklyMeetupId)
			.eq('type',"cannotAttendMeetup")
		return count
	}

	static async interactionConfirmationAttendance(interaction,isAcceptAttendance,value){
		const [partyId,weeklyMeetupId] = value.split('|')
		const data = await supabase.from("Reminders")
			.select()
			.eq('message',weeklyMeetupId)
			.eq('UserId',interaction.user.id)
			.eq('type',"cannotAttendMeetup")
			.single()

		if(isAcceptAttendance){
			if(data.body){
				await supabase.from("Reminders")
				.delete()
				.eq('message',weeklyMeetupId)
				.eq('UserId',interaction.user.id)
				.eq('type',"cannotAttendMeetup")
			}
		}else{
			if (!data.body) {
				await supabase.from("Reminders")
				.insert({
					type:'cannotAttendMeetup',
					UserId:interaction.user.id,
					message:weeklyMeetupId
				})
			}
		}
		
		if(isAcceptAttendance) interaction.editReply(`${interaction.user} will attend the virtual meetup`)
		else interaction.editReply(`${interaction.user} can't attend the virtual meetup`)
		
		RecurringMeetupController.getTotalResponseCannotAttend(weeklyMeetupId)
			.then(async totalUser=>{
				if (totalUser === 2) {
					const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
					if(dataWeeklyMeetup.body){
						const date = new Date(dataWeeklyMeetup.body.time)
						RecurringMeetupController.rescheduleMeetup(interaction.client,interaction.message.channelId,date,partyId)
					}
				}
			})
					
	}
}

module.exports = RecurringMeetupController