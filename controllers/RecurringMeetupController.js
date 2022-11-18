const { PermissionFlagsBits, ChannelType } = require("discord-api-types/v9");
const { GUILD_ID, CATEGORY_CHAT, CHANNEL_PARTY_ROOM } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const ChannelController = require("./ChannelController");
const MemberController = require("./MemberController");
const schedule = require('node-schedule');
const Time = require("../helpers/time");
const RecurringMeetupMessage = require("../views/RecurringMeetupMessage");

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

	static async rescheduleMeetup(client,threadId,meetupDateOnly,partyId){
		
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,threadId)
		const formattedDate = Time.getFormattedDate(Time.getNextTuesdayDate(),true)
		const customDate = Time.getFormattedDate(Time.getNextDate(2),false,'long').split(',')[0]
		threadParty.send(RecurringMeetupMessage.showHowToRescheduleMeetup(formattedDate,customDate))
		
		const rescheduleMeetupDate = Time.getNextDate(7,meetupDateOnly)
		rescheduleMeetupDate.setHours(Time.minus7Hours(21))
		rescheduleMeetupDate.setMinutes(0)

		this.scheduleMeetup(client,rescheduleMeetupDate,threadId,partyId)
	}

	static async scheduleMeetup(client,scheduleMeetupDate,threadId,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,threadId)

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
				{
					message:partyId,
					time:oneDayBefore,
					type:'oneDayBeforeMeetup'
				},
				{
					message:partyId,
					time:oneHourBefore,
					type:'oneHourBeforeMeetup'
				},
				{
					message:partyId,
					time:tenMinutesBefore,
					type:'tenMinutesBeforeMeetup'
				},
				{
					message:partyId,
					time:fiveMinutesBefore,
					type:'fiveMinutesBeforeMeetup'
				},
				{
					message:partyId,
					time:scheduleMeetupDate,
					type:'weeklyMeetup'
				},
			])
			.then(async ()=>{
				//TODO add this cron to events ready like remind highlight user for this 4 event 
				schedule.scheduleJob(oneDayBefore,async function() {
					threadParty.send(RecurringMeetupMessage.reminderOneDayBeforeMeetup())
				})
				schedule.scheduleJob(oneHourBefore,async function() {
					threadParty.send(RecurringMeetupMessage.reminderOneHourBeforeMeetup())
				})
				schedule.scheduleJob(tenMinutesBefore,async function() {
					threadParty.send(RecurringMeetupMessage.reminderTenMinBeforeMeetup())
				})
				schedule.scheduleJob(fiveMinutesBefore,async function() {
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
				})
				schedule.scheduleJob(scheduleMeetupDate,async function() {
					const dataParty = await supabase.from("PartyRooms")
						.select()
						.eq('id',partyId)
						.single()
					const voiceChannelId = dataParty.body.voiceChannelId
					threadParty.send(RecurringMeetupMessage.remindUserJoinMeetupSession(voiceChannelId))
				})
			})
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
			.then(()=>{})
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
					else RecurringMeetupController.rescheduleMeetup(interaction.client,interaction.message.channelId,meetupDateOnly,partyId)
				}
			})
					
	}
}

module.exports = RecurringMeetupController