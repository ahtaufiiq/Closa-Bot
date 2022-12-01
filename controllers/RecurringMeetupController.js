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

	static async setReminderTwoDayBeforeMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"twoDayBeforeMeetup")
			.gte('time',new Date().toISOString())

		if(data.body.length === 0 ) return
		for (let i = 0; i < data.body.length; i++) {
			const {time,message:partyId} = data.body[i];
			RecurringMeetupController.remindTwoDayBeforeMeetup(client,time,partyId)
		}
	}

	static async remindTwoDayBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)

		schedule.scheduleJob(time,async function() {
			const dataParty = await RecurringMeetupController.getDataParty(partyId)
			const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty.body?.msgId)			
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.body && newWeeklyMeetup.body?.id === oldWeeklyMeetup.body?.id ){
				threadParty.send(RecurringMeetupMessage.confirmationTwoDaysBeforeMeetup(partyId,oldWeeklyMeetup.body?.id))
			}
		})
	}

	static async setReminderOneDayBeforeMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"oneDayBeforeMeetup")
			.gte('time',new Date().toISOString())

		if(data.body.length === 0 ) return
		for (let i = 0; i < data.body.length; i++) {
			const {time,message:partyId} = data.body[i];
			RecurringMeetupController.remindOneDayBeforeMeetup(client,time,partyId)
		}
	}

	static async remindOneDayBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)

		schedule.scheduleJob(time,async function() {
			const dataParty = await RecurringMeetupController.getDataParty(partyId)
			const threadParty = await ChannelController.getThread(channelPartyRodataParty.body?.msgIdeId)
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.body && newWeeklyMeetup.body?.id === oldWeeklyMeetup.body?.id ){
				threadParty.send(RecurringMeetupMessage.reminderOneDayBeforeMeetup())
			}
		})
	}

	static async setReminderOneHourBeforeMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"oneHourBeforeMeetup")
			.gte('time',new Date().toISOString())

		if(data.body.length === 0 ) return
		for (let i = 0; i < data.body.length; i++) {
			const {time,message:partyId} = data.body[i];
			RecurringMeetupController.remindOneHourBeforeMeetup(client,time,partyId)
		}
	}

	static async remindOneHourBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)

		schedule.scheduleJob(time,async function() {
			const dataParty = await RecurringMeetupController.getDataParty(partyId)
			const threadParty = await ChannelController.getThread(channelPartyRodataParty.body?.msgIdeId)
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.body && newWeeklyMeetup.body?.id === oldWeeklyMeetup.body?.id ){
				threadParty.send(RecurringMeetupMessage.reminderOneHourBeforeMeetup())
			}
		})
	}

	static async setReminderTenMinuteBeforeMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"tenMinutesBeforeMeetup")
			.gte('time',new Date().toISOString())

		if(data.body.length === 0 ) return
		for (let i = 0; i < data.body.length; i++) {
			const {time,message:partyId} = data.body[i];
			RecurringMeetupController.remindTenMinuteBeforeMeetup(client,time,partyId)
		}
	}

	static async remindTenMinuteBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)

		schedule.scheduleJob(time,async function() {
			const dataParty = await RecurringMeetupController.getDataParty(partyId)
			const threadParty = await ChannelController.getThread(channelPartyRodataParty.body?.msgIdeId)
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.body && newWeeklyMeetup.body?.id === oldWeeklyMeetup.body?.id ){
				threadParty.send(RecurringMeetupMessage.reminderTenMinBeforeMeetup())
			}
		})
	}

	static async setScheduleCreateTemporaryVoiceChannel(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"fiveMinutesBeforeMeetup")
			.gte('time',new Date().toISOString())

		if(data.body.length === 0 ) return
		for (let i = 0; i < data.body.length; i++) {
			const {time,message:partyId} = data.body[i];
			RecurringMeetupController.scheduleCreateTemporaryVoiceChannel(client,time,partyId)
		}
	}

	static async scheduleCreateTemporaryVoiceChannel(client,time,partyId){
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)

		schedule.scheduleJob(time,async function() {
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.body && newWeeklyMeetup.body?.id === oldWeeklyMeetup.body?.id ){
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
	}

	static async setReminderWeeklyMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"weeklyMeetup")
			.gte('time',new Date().toISOString())

		if(data.body.length === 0 ) return
		for (let i = 0; i < data.body.length; i++) {
			const {time,message:partyId} = data.body[i];
			RecurringMeetupController.remindWeeklyMeetup(client,time,partyId)
		}
	}

	static async remindWeeklyMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)

		schedule.scheduleJob(time,async function() {
			const dataParty = await RecurringMeetupController.getDataParty(partyId)

			const threadParty = await ChannelController.getThread(channelPartyRodataParty.body?.msgIdeId)
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.body && newWeeklyMeetup.body?.id === oldWeeklyMeetup.body?.id ){
				if(RecurringMeetupController.isDateBeforeCelebrationDay(Time.getDate(newWeeklyMeetup.body?.time))){
					const nextMeetupDate = new Date()
					nextMeetupDate.setDate(nextMeetupDate.getDate() + 7)
					RecurringMeetupController.scheduleMeetup(client,nextMeetupDate,dataParty.body.msgId)
				}
				const voiceChannelId = dataParty.body.voiceChannelId
				threadParty.send(RecurringMeetupMessage.remindUserJoinMeetupSession(voiceChannelId))
			}
		})
	}

	static async scheduleMeetup(client,scheduleMeetupDate,threadId,partyId){
		await RecurringMeetupController.deleteOldWeeklyMeetup(partyId)

		const twoDayBefore = new Date(scheduleMeetupDate.valueOf())
		twoDayBefore.setDate(twoDayBefore.getDate()-2)

		const oneDayBefore = new Date(scheduleMeetupDate.valueOf())
		oneDayBefore.setDate(oneDayBefore.getDate()-1)
		
		const oneHourBefore = new Date(scheduleMeetupDate.valueOf())
		oneHourBefore.setHours(oneHourBefore.getHours()-1)
		
		const tenMinutesBefore = new Date(scheduleMeetupDate.valueOf())
		tenMinutesBefore.setMinutes(tenMinutesBefore.getMinutes()-10)

		const fiveMinutesBefore = new Date(scheduleMeetupDate.valueOf())
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
				RecurringMeetupController.remindTwoDayBeforeMeetup(client,twoDayBefore,partyId)
				RecurringMeetupController.remindOneDayBeforeMeetup(client,oneDayBefore,partyId)
				RecurringMeetupController.remindOneHourBeforeMeetup(client,oneHourBefore,partyId)
				RecurringMeetupController.remindTenMinuteBeforeMeetup(client,tenMinutesBefore,partyId)
				RecurringMeetupController.scheduleCreateTemporaryVoiceChannel(client,fiveMinutesBefore,partyId)
				RecurringMeetupController.remindWeeklyMeetup(client,scheduleMeetupDate,partyId)
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

	static async getDataParty(partyId){
		return await supabase.from("PartyRooms")
			.select()
			.eq('id',partyId)
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