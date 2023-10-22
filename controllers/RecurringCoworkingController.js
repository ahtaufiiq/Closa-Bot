const { GUILD_ID, CATEGORY_CHAT, CHANNEL_PARTY_ROOM, CHANNEL_WEEKLY_SCYNC_CATEGORY, CHANNEL_CLOSA_CAFE, CHANNEL_CREATE_YOUR_ROOM } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const ChannelController = require("./ChannelController");
const MemberController = require("./MemberController");
const schedule = require('node-schedule');
const Time = require("../helpers/time");
const RecurringMeetupMessage = require("../views/RecurringMeetupMessage");
const LocalData = require("../helpers/LocalData");
const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { PermissionFlagsBits, ChannelType } = require("discord.js");
const MessageFormatting = require("../helpers/MessageFormatting");

class RecurringCoworkingController {
	static async scheduleAllRecurringCoworking(client,listFocusRoom){

		const allParty = (await RecurringCoworkingController.getAllActiveParty()).data
		for (let i = 0; i < allParty.length; i++) {
			RecurringCoworkingController.scheduleRecurringCoworking(client,listFocusRoom,allParty[i])
		}
	}

	static async scheduleRecurringCoworking(client,listFocusRoom,dataParty){

		const {id:partyId,lastUpdatedCoworkingTime,coworkingTime} = dataParty;
		const [hours,minutes] = coworkingTime.split(/[.:]/)
		const date = new Date()
		date.setHours(Time.minus7Hours(hours),minutes)

		date.setMinutes(date.getMinutes()-5)
		const ruleFiveMinuteBeforeCoworking = new schedule.RecurrenceRule();
		ruleFiveMinuteBeforeCoworking.hour = date.getHours()
		ruleFiveMinuteBeforeCoworking.minute = date.getMinutes()
		const reminderFiveMinutes = schedule.scheduleJob(ruleFiveMinuteBeforeCoworking,async() =>{
			const isRescheduleCoworkingTime = await RecurringCoworkingController.isRescheduleCoworkingTime(lastUpdatedCoworkingTime,partyId)
			if(isRescheduleCoworkingTime) return reminderFiveMinutes.cancel()
			RecurringCoworkingController.remindDailyCoworking(client,dataParty,listFocusRoom)
		})

		date.setMinutes(date.getMinutes()-5)
		const ruleTenMinuteBeforeCoworking = new schedule.RecurrenceRule();
		ruleTenMinuteBeforeCoworking.hour = date.getHours()
		ruleTenMinuteBeforeCoworking.minute = date.getMinutes()
		const reminderTenMinutes = schedule.scheduleJob(ruleTenMinuteBeforeCoworking,async() =>{
			const isRescheduleCoworkingTime = await RecurringCoworkingController.isRescheduleCoworkingTime(lastUpdatedCoworkingTime,partyId)
			if(isRescheduleCoworkingTime) return reminderTenMinutes.cancel()
			RecurringCoworkingController.remindTenMinuteBeforeMeetup(client,dataParty)
		})

		date.setMinutes(date.getMinutes()-50)
		const ruleOneHourBeforeCoworking = new schedule.RecurrenceRule();
		ruleOneHourBeforeCoworking.hour = date.getHours()
		ruleOneHourBeforeCoworking.minute = date.getMinutes()
		const reminderOneHour = schedule.scheduleJob(ruleOneHourBeforeCoworking,async() =>{
			const isRescheduleCoworkingTime = await RecurringCoworkingController.isRescheduleCoworkingTime(lastUpdatedCoworkingTime,partyId)
			if(isRescheduleCoworkingTime) return reminderOneHour.cancel()
			RecurringCoworkingController.remindOneHourBeforeMeetup(client,dataParty)
		})
	}

	static async isRescheduleCoworkingTime(lastUpdatedCoworkingTime,partyId){
		const data = await supabase.from("PartyRooms")
			.select('lastUpdatedCoworkingTime')
			.eq('id',partyId)
			.single()
		if(data.data.lastUpdatedCoworkingTime !== lastUpdatedCoworkingTime) return true
		else return false
	}

	static async remindDailyCoworking(client,dataParty,listFocusRoom){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const partyId = dataParty.id
		const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty?.msgId)
		const tagPartyMembers = RecurringCoworkingController.formatTagPartyMembers(dataParty.MemberPartyRooms)
		const members = dataParty.MemberPartyRooms.map(member=>member.UserId)
		const voiceChannelId = await RecurringCoworkingController.createPrivateVoiceChannel(client,`Party ${partyId}`,members,listFocusRoom)
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
		threadParty.send(RecurringMeetupMessage.remindUserJoinMeetupSession(voiceChannelId,tagPartyMembers,dataParty?.coworkingTime))
	}

	static async remindOneHourBeforeMeetup(client,dataParty){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty?.msgId)
		const tagPartyMembers = RecurringCoworkingController.formatTagPartyMembers(dataParty.MemberPartyRooms)
		threadParty.send(RecurringMeetupMessage.reminderOneHourBeforeMeetup(tagPartyMembers,dataParty.id,dataParty.coworkingTime))
	}

	static async remindTenMinuteBeforeMeetup(client,dataParty){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty?.msgId)
		const tagPartyMembers = RecurringCoworkingController.formatTagPartyMembers(dataParty.MemberPartyRooms)
		threadParty.send(RecurringMeetupMessage.reminderTenMinBeforeMeetup(tagPartyMembers))
	}

	static async createPrivateVoiceChannel(client,channelName,allowedUsers=[],listFocusRoom){
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
		listFocusRoom[voiceChannel.id] = {
			type:'partyRoom',
			PartyId:Number(channelName.split(' ')[1])
		}
		setTimeout(() => {
			if(voiceChannel.members.size < 1){
				voiceChannel.delete()
			}
		}, 1000 * 60 * 20);
		return voiceChannel.id
	}

	static async notifyMeetupSchedule(client,threadId,date){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const threadParty = await ChannelController.getThread(channelPartyRoom,threadId)
		const meetupDate = Time.getFormattedDate(date,true,'medium',true)

		threadParty.send(RecurringMeetupMessage.meetupSuccessfullyScheduled(meetupDate))
	}

	static showModalRescheduleMeetup(interaction){
        if(interaction.customId.includes('rescheduleMeetup')){
            const modal = new Modal()
                .setCustomId(interaction.customId)
                .setTitle("🕗 Change coworking time")
                .addComponents(
                    new TextInputComponent().setCustomId('time').setLabel("Time (every day).").setPlaceholder("e.g. 06.30 (24h format)").setStyle("SHORT").setRequired(true),
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

	static async getAllActiveParty(){
		return await supabase.from("PartyRooms")
			.select(`*,MemberPartyRooms(UserId)`)
			.gte('disbandDate',Time.getTodayDateOnly())
	}

	static async interactionConfirmationMeetup(interaction,isAcceptMeetup,value){
		if(isAcceptMeetup) interaction.editReply(`✅ **${interaction.user} will attend the coworking session.**`)
		else interaction.editReply(`❌ **${interaction.user} can't attend the coworking session.**`)
	}

	static formatTagPartyMembers(members){
		if(!members || members?.length === 0) return '@everyone'
		else return members.map(member=>MessageFormatting.tagUser(member.UserId))
	}

	static isEmptyPartyRoom(oldMember,listFocusRoom,totalOldMember,){
        return oldMember.channelId !== CHANNEL_CREATE_YOUR_ROOM && listFocusRoom[oldMember.channelId]?.type === 'partyRoom' && totalOldMember === 0 && oldMember?.channel?.parentId === CHANNEL_WEEKLY_SCYNC_CATEGORY
    }

	static isFirstJoinedPartyRoom(newMember,totalNewMember,){
        return totalNewMember === 1 && newMember?.channel?.parentId === CHANNEL_WEEKLY_SCYNC_CATEGORY
    }

	static handleLeavePartyRoom(oldMember,listFocusRoom,totalOldMember){
		if(RecurringCoworkingController.isEmptyPartyRoom(oldMember,listFocusRoom,totalOldMember)){
			oldMember.channel.delete()
			setTimeout(() => {
				delete listFocusRoom[oldMember.channelId]
			}, Time.oneMinute() * 5);
		}
	}
	static handleJoinPartyRoom(newMember,totalNewMember,totalOldMember,listFocusRoom){
		const isPartyRoom = listFocusRoom[newMember.channelId]?.type === 'partyRoom'
		if(isPartyRoom && totalOldMember !== totalNewMember){
			if(RecurringCoworkingController.isFirstJoinedPartyRoom(newMember,totalNewMember)){
				newMember.channel.send(RecurringMeetupMessage.guidelineForFirstJoinedVoiceChannel(newMember.member.id))
			}else{
				newMember.channel.send(`${MessageFormatting.tagUser(newMember.member.id)} joined the coworking room`)
			}
		}
	}
}

module.exports = RecurringCoworkingController
