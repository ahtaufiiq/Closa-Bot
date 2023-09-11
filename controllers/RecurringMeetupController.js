const { GUILD_ID, CATEGORY_CHAT, CHANNEL_PARTY_ROOM, CHANNEL_WEEKLY_SCYNC_CATEGORY, CHANNEL_CLOSA_CAFE } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const ChannelController = require("./ChannelController");
const MemberController = require("./MemberController");
const schedule = require('node-schedule');
const Time = require("../helpers/time");
const RecurringMeetupMessage = require("../views/RecurringMeetupMessage");
const LocalData = require("../helpers/LocalData");
const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const GenerateLink = require("../helpers/GenerateLink");
const { PermissionFlagsBits, ChannelType } = require("discord.js");
const MessageFormatting = require("../helpers/MessageFormatting");

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
		
		const voiceChannel = await guild.channels.create({
			name:channelName,
			permissionOverwrites,
			parent:ChannelController.getChannel(client,CHANNEL_WEEKLY_SCYNC_CATEGORY),
			type:ChannelType.GuildVoice,
		})
		setTimeout(() => {
			if(voiceChannel.members.size < 2){
				voiceChannel.delete()
			}
		}, 1000 * 60 * 35);
		return voiceChannel.id
	}

	static async getTotalResponseMemberMeetup(partyId,isAcceptMeetup=true){
		const {count} = await supabase.from("WeeklyMeetups")
			.select('id',{count:'exact'})
			.eq("PartyRoomId",partyId)
			.gte('meetupDate',new Date().toUTCString())
			.eq('isAcceptMeetup',isAcceptMeetup)
		return count
	}

	static async notifyMeetupSchedule(client,threadId,date){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,threadId)
		const meetupDate = Time.getFormattedDate(date,true,'medium',true)

		threadParty.send(RecurringMeetupMessage.meetupSuccessfullyScheduled(meetupDate))
	}

	static async rescheduleMeetup(client,threadId,date,partyId){
		date.setDate(date.getDate()+7)
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,threadId)
		const formattedDate = Time.getFormattedDate(date,true)
		const customDate = Time.getFormattedDate(Time.getNextDate(2),false,'long').split(',')[0]

		if(RecurringMeetupController.isDateBeforeCelebrationDay(date)){
			threadParty.send(RecurringMeetupMessage.showHowToRescheduleMeetup(formattedDate,customDate,partyId))
			this.scheduleMeetup(client,date,threadId,partyId)
		}else{
			threadParty.send(RecurringMeetupMessage.notAutomaticRescheduleMeetupAfterCelebrationDay(customDate))
		}
	}

	static async setReminderTwoDayBeforeMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"twoDayBeforeMeetup")
			.gte('time',new Date().toUTCString())

		if(data.data.length === 0 ) return
		for (let i = 0; i < data.data.length; i++) {
			const {time,message:partyId} = data.data[i];
			RecurringMeetupController.remindTwoDayBeforeMeetup(client,time,partyId)
		}
	}

	static async remindTwoDayBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)

		schedule.scheduleJob(time,async function() {
			const meetupDate = Time.getDate(time)
			meetupDate.setDate(meetupDate.getDate() + 2)
			const meetupTime = Time.getFormattedDate(meetupDate,true,'medium',true)
			const dataParty = await RecurringMeetupController.getDataParty(partyId)
			const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty.data?.msgId)			
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.data && newWeeklyMeetup.data?.id === oldWeeklyMeetup.data?.id ){
				const tagPartyMembers = RecurringMeetupController.formatTagPartyMembers(dataParty.data.MemberPartyRooms)
				const linkAddToCalendar = RecurringMeetupController.linkCalendarWeeklySync(partyId,meetupDate)
				threadParty.send(RecurringMeetupMessage.confirmationTwoDaysBeforeMeetup(partyId,oldWeeklyMeetup.data?.id,meetupTime,linkAddToCalendar,tagPartyMembers))
			}
		})
	}

	static linkCalendarWeeklySync(partyId,startDate){
		startDate.setHours(Time.minus7Hours(startDate.getHours(),false))
		
		const endDate = new Date(startDate.valueOf())
		endDate.setMinutes(endDate.getMinutes()+30)
		const link = GenerateLink.addToCalendar(
			'Closa: Weekly check-in ☕️',
			"Learn more at Closa Weekly Sync (https://closa.notion.site/Weekly-Sync-bb6ea395dc4e4873a182cc3e4ba194fd)",
			`Temporary voice channel Party ${partyId} (discord)`,
			startDate,
			endDate
		  )
		return link
	}

	static showModalRescheduleMeetup(interaction){
        if(interaction.customId.includes('rescheduleMeetup')){
            const modal = new Modal()
                .setCustomId(interaction.customId)
                .setTitle("🗓 Reschedule Meetup")
                .addComponents(
                    new TextInputComponent().setCustomId('date').setLabel("Date").setPlaceholder("e.g. 29 August").setStyle("SHORT").setRequired(true),
                    new TextInputComponent().setCustomId('time').setLabel("Time").setPlaceholder("e.g 21.00 (24-hour format)").setStyle("SHORT").setRequired(true),
                )
			showModal(modal, { client: interaction.client, interaction: interaction});
            return true
        }else{
            return false
        }
    }

	static showModalExtendTime(interaction){
        if(interaction.customId.includes('customExtend')){
            const modal = new Modal()
                .setCustomId(interaction.customId)
                .setTitle("⏲ Add session time in minute")
                .addComponents(
                    new TextInputComponent().setCustomId('time').setLabel("Extend Time").setPlaceholder("e.g. 30 min (in minute only)").setStyle("SHORT").setRequired(true),
                )
			showModal(modal, { client: interaction.client, interaction: interaction});
            return true
        }else{
            return false
        }
    }

	static async setReminderOneDayBeforeMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"oneDayBeforeMeetup")
			.gte('time',new Date().toUTCString())

		if(data.data.length === 0 ) return
		for (let i = 0; i < data.data.length; i++) {
			const {time,message:partyId} = data.data[i];
			RecurringMeetupController.remindOneDayBeforeMeetup(client,time,partyId)
		}
	}

	static async remindOneDayBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)

		schedule.scheduleJob(time,async function() {
			const dataParty = await RecurringMeetupController.getDataParty(partyId)
			const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty.data?.msgId)
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.data && newWeeklyMeetup.data?.id === oldWeeklyMeetup.data?.id ){
				const tagPartyMembers = RecurringMeetupController.formatTagPartyMembers(dataParty.data.MemberPartyRooms)
				const meetupDate = Time.getDate(time)
				meetupDate.setDate(meetupDate.getDate()+1)
				const meetupTime = Time.getFormattedDate(meetupDate,true,'medium',true)
				threadParty.send(RecurringMeetupMessage.reminderOneDayBeforeMeetup(meetupTime,tagPartyMembers))
			}
		})
	}

	static async setReminderOneHourBeforeMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"oneHourBeforeMeetup")
			.gte('time',new Date().toUTCString())

		if(data.data.length === 0 ) return
		for (let i = 0; i < data.data.length; i++) {
			const {time,message:partyId} = data.data[i];
			RecurringMeetupController.remindOneHourBeforeMeetup(client,time,partyId)
		}
	}

	static async updateExtendTime(extendTime,voiceChannelId){
		return await supabase.from("TemporaryVoices")
			.update({extendTime})
			.eq('id',voiceChannelId)
	}

	static async resetExtendTime(voiceChannelId){
		return await supabase.from("TemporaryVoices")
			.update({extendTime:null})
			.eq('id',voiceChannelId)
	}

	static async updateTotalExtendTime(voiceChannelId,totalExtendedTime){
		return await supabase.from("TemporaryVoices")
			.update({totalExtendedTime})
			.eq('id',voiceChannelId)
	}

	static async remindOneHourBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)

		schedule.scheduleJob(time,async function() {
			const dataParty = await RecurringMeetupController.getDataParty(partyId)
			const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty.data?.msgId)
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.data && newWeeklyMeetup.data?.id === oldWeeklyMeetup.data?.id ){
				const tagPartyMembers = RecurringMeetupController.formatTagPartyMembers(dataParty.data.MemberPartyRooms)
				threadParty.send(RecurringMeetupMessage.reminderOneHourBeforeMeetup(tagPartyMembers))
			}
		})
	}

	static async setReminderTenMinuteBeforeMeetup(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"tenMinutesBeforeMeetup")
			.gte('time',new Date().toUTCString())
		if(data.data.length === 0 ) return
		for (let i = 0; i < data.data.length; i++) {
			const {time,message:partyId} = data.data[i];
			RecurringMeetupController.remindTenMinuteBeforeMeetup(client,time,partyId)
		}
	}

	static async remindTenMinuteBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
		schedule.scheduleJob(time,async function() {
			const dataParty = await RecurringMeetupController.getDataParty(partyId)
			const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty.data?.msgId)
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.data && newWeeklyMeetup.data?.id === oldWeeklyMeetup.data?.id ){
				const tagPartyMembers = RecurringMeetupController.formatTagPartyMembers(dataParty.data.MemberPartyRooms)
				threadParty.send(RecurringMeetupMessage.reminderTenMinBeforeMeetup(tagPartyMembers))
			}
		})
	}

	static async setScheduleCreateTemporaryVoiceChannel(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"fiveMinutesBeforeMeetup")
			.gte('time',new Date().toUTCString())

		if(data.data.length === 0 ) return
		for (let i = 0; i < data.data.length; i++) {
			const {time,message:partyId} = data.data[i];
			RecurringMeetupController.scheduleCreateTemporaryVoiceChannel(client,time,partyId)
		}
	}

	static async scheduleCreateTemporaryVoiceChannel(client,time,partyId){
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
		schedule.scheduleJob(time,async function() {
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.data && newWeeklyMeetup.data?.id === oldWeeklyMeetup.data?.id ){
				supabase.from("PartyRooms")
					.select("MemberPartyRooms(UserId)")
					.eq('id',partyId)
					.single()
					.then(async data=>{
						const members = data.data.MemberPartyRooms.map(member=>member.UserId)
						const voiceChannelId = await RecurringMeetupController.createPrivateVoiceChannel(client,`Party ${partyId}`,members)
						supabase.from('TemporaryVoices')
							.insert({
								id:voiceChannelId,
								type:'WeeklyMeetup',
								description:`Party ${partyId}`
							})
							.then()
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
			.gte('time',new Date().toUTCString())

		if(data.data.length === 0 ) return
		for (let i = 0; i < data.data.length; i++) {
			const {time,message:partyId} = data.data[i];
			RecurringMeetupController.remindWeeklyMeetup(client,time,partyId)
		}
	}

	static async remindWeeklyMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const oldWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
		schedule.scheduleJob(time,async function() {
			const dataParty = await RecurringMeetupController.getDataParty(partyId)

			const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty.data?.msgId)
			const newWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
			if(newWeeklyMeetup.data && newWeeklyMeetup.data?.id === oldWeeklyMeetup.data?.id ){
				if(RecurringMeetupController.isDateBeforeCelebrationDay(Time.getNextDate(7))){
					const nextMeetupDate = new Date()
					nextMeetupDate.setDate(nextMeetupDate.getDate() + 7)
					RecurringMeetupController.scheduleMeetup(client,nextMeetupDate,dataParty.data.msgId,partyId)
				}
				const voiceChannelId = dataParty.data.voiceChannelId
				const tagPartyMembers = RecurringMeetupController.formatTagPartyMembers(dataParty.data.MemberPartyRooms)
				threadParty.send(RecurringMeetupMessage.remindUserJoinMeetupSession(voiceChannelId,tagPartyMembers))
			}
		})
	}

	static async scheduleMeetup(client,scheduleMeetupDate,threadId,partyId,isFirstMeetup=false){
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

		const data = [
				{ message:partyId, time:oneDayBefore, type:'oneDayBeforeMeetup'},
				{ message:partyId, time:oneHourBefore, type:'oneHourBeforeMeetup'},
				{ message:partyId, time:tenMinutesBefore, type:'tenMinutesBeforeMeetup'},
				{ message:partyId, time:fiveMinutesBefore, type:'fiveMinutesBeforeMeetup'},
			]
				
		if(!isFirstMeetup) data.push({ message:partyId, time:twoDayBefore, type:'twoDayBeforeMeetup'})
		supabase.from("Reminders")
			.insert(data)
			.then()

		supabase.from("Reminders")
			.insert({
				message:partyId,
				time:scheduleMeetupDate,
				type:'weeklyMeetup'
			})
			.single()
			.then(async ()=>{
				if(!isFirstMeetup) RecurringMeetupController.remindTwoDayBeforeMeetup(client,twoDayBefore,partyId)
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
		const time =  new Date()
		time.setHours(time.getHours()-1)
		const result = {
			data:null
		}
		
		const dataWeeklyMeetup = await supabase.from("Reminders")
			.select()
			.eq('type','weeklyMeetup')
			.eq('message',partyId)
			.gte('time',time.toUTCString())
			.order('createdAt',{ascending:false})

		if(dataWeeklyMeetup.data.length > 0) result.data = dataWeeklyMeetup.data[0]
		return result
	}

	static async getDataParty(partyId){
		return await supabase.from("PartyRooms")
			.select(`*,MemberPartyRooms(UserId)`)
			.eq('id',partyId)
			.single()
	}

	static async deleteOldWeeklyMeetup(partyId){
		const time =  new Date()
		return await supabase.from("Reminders")
			.delete()
			.like('type', '%Meetup')
			.eq('message',partyId)
			.gte('time',time.toUTCString())
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
			.gte('meetupDate',new Date().toUTCString())

		if (data.data.length === 0) {
			await supabase.from("WeeklyMeetups")
			.insert({
				meetupDate,
				isAcceptMeetup,
				UserId:interaction.user.id,
				PartyRoomId:partyId
			})
		}else{
			await supabase.from("WeeklyMeetups")
				.update({isAcceptMeetup})
				.eq("UserId",interaction.user.id)
				.eq("PartyRoomId",partyId)
				.gte('meetupDate',new Date().toUTCString())
		}
		
		if(isAcceptMeetup) interaction.editReply(`${interaction.user} just accepted the meetup invitation ✅`)
		else interaction.editReply(`${interaction.user} just declined the meetup invitation`)
		
		RecurringMeetupController.getTotalResponseMemberMeetup(partyId,isAcceptMeetup)
			.then(async totalUser=>{
				if (totalUser === 2) {
					if(isAcceptMeetup) {
						await RecurringMeetupController.scheduleMeetup(interaction.client,meetupDate,interaction.message.channelId,partyId,true)
						const meetupSchedule = Time.getDate(meetupDateOnly)
						meetupSchedule.setHours(21)
						meetupSchedule.setMinutes(0)
						RecurringMeetupController.notifyMeetupSchedule(interaction.client,interaction.message.channelId,meetupSchedule)
					}else RecurringMeetupController.rescheduleMeetup(interaction.client,interaction.message.channelId,meetupDate,partyId)
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

		if(isAcceptAttendance){
			if(data.data.length > 0){
				await supabase.from("Reminders")
				.delete()
				.eq('message',weeklyMeetupId)
				.eq('UserId',interaction.user.id)
				.eq('type',"cannotAttendMeetup")
			}
		}else{
			if (data.data.length === 0) {
				await supabase.from("Reminders")
				.insert({
					type:'cannotAttendMeetup',
					UserId:interaction.user.id,
					message:weeklyMeetupId
				})
			}
		}
		await interaction.deleteReply()
		
		if(isAcceptAttendance) interaction.channel.send(`**${interaction.user} will attend the virtual meetup ✅**`)
		else interaction.channel.send(`**${interaction.user} can't attend the virtual meetup ❌**`)
		
		RecurringMeetupController.getTotalResponseCannotAttend(weeklyMeetupId)
			.then(async totalUser=>{
				if (totalUser === 2) {
					const dataWeeklyMeetup = await RecurringMeetupController.getWeeklyMeetupParty(partyId)
					if(dataWeeklyMeetup.data){
						const date = new Date(dataWeeklyMeetup.data.time)
						RecurringMeetupController.rescheduleMeetup(interaction.client,interaction.message.channelId,date,partyId)
					}
				}
			})
					
	}

	static formatTagPartyMembers(members){
		if(!members || members?.length === 0) return '@everyone'
		else return members.map(member=>MessageFormatting.tagUser(member.UserId))
	}

	static handleVoiceRoomWeeklySync(newMember,meetup,userId){
		if(newMember?.channel?.name.includes("Party")){
			const channelId = newMember.channel.id
			const partyId = newMember.channel.name.split(' ')[1]
			if(!meetup[channelId]) meetup[channelId] = {}
			if (!meetup[channelId][userId]) {
				meetup[channelId][userId] = "Join"
				supabase.from("WeeklyMeetups")
					.update({isAttendMeetup:true})
					.eq("UserId",userId)
					.eq("PartyRoomId",partyId)
					.gte("meetupDate",new Date().toUTCString())
					.then()
			}
			if(newMember.channel.members.size >= 2 && !meetup[channelId].status){
				meetup[channelId].status = 'start'
				supabase.from("PartyRooms")
					.select('msgId')
					.eq('id',partyId)
					.single()
					.then(async data=>{
						const channelParty = ChannelController.getChannel(newMember.client,CHANNEL_PARTY_ROOM)
						const threadParty = await ChannelController.getThread(channelParty,data.data.msgId)
						const dataParty = await supabase.from("PartyRooms")
							.select()
							.eq('id',partyId)
							.single()
						const voiceChannelId = dataParty.data.voiceChannelId
						const voiceChannel = ChannelController.getChannel(newMember.client,voiceChannelId)
						let totalExtendTime = 0
						let minutes = 30

						Promise.all([
							threadParty.send(RecurringMeetupMessage.countdownMeetup(minutes,voiceChannelId)),
							voiceChannel.send(RecurringMeetupMessage.countdownMeetupVoiceChat(minutes))
						])
						.then(([msgThreadParty,msgVoiceChat])=>{
							const timerMeetup = setInterval(async () => {
								if(minutes <= 5){
									const temporaryVoice = await supabase.from("TemporaryVoices")
										.select()
										.eq('id',voiceChannelId)
										.single()
									const extendTime = temporaryVoice.data?.extendTime
									if(extendTime){
										minutes += extendTime
										totalExtendTime += extendTime
										RecurringMeetupController.resetExtendTime(voiceChannelId)
										msgVoiceChat.reply(RecurringMeetupMessage.successExtendTime(extendTime))
									}
								}
								if (minutes > 0) {
									minutes--
									msgThreadParty.edit(RecurringMeetupMessage.countdownMeetup(minutes,voiceChannelId))
									msgVoiceChat.edit(RecurringMeetupMessage.countdownMeetupVoiceChat(minutes))
								}
								if (minutes === 0) {
									voiceChannel.send(RecurringMeetupMessage.reminderFifteenSecondsBeforeEnded())
									setTimeout(async () => {
										if(voiceChannel?.id !== CHANNEL_CLOSA_CAFE) await voiceChannel.delete()
										delete meetup[channelId]
										RecurringMeetupController.updateTotalExtendTime(voiceChannelId,totalExtendTime)
									}, 1000 * 15);
									clearInterval(timerMeetup)
								}else if(minutes === 2){
									voiceChannel.send(RecurringMeetupMessage.reminderTwoMinutesBeforeEnded())
								}else if(minutes === 5){
									voiceChannel.send(RecurringMeetupMessage.reminderFiveMinutesBeforeEnded(voiceChannelId))
								}
							}, 1000 * 60);
						})
					})
			}
		}
	}
}

module.exports = RecurringMeetupController
