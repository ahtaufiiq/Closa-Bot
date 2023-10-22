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
	static async scheduleRecurringCoworking(client,listFocusRoom){
		const ruleOneHourBeforeCoworking = new schedule.RecurrenceRule();
        ruleOneHourBeforeCoworking.hour = Time.minus7Hours(19)
        ruleOneHourBeforeCoworking.minute = 0

		const ruleTenMinuteBeforeCoworking = new schedule.RecurrenceRule();
        ruleTenMinuteBeforeCoworking.hour = Time.minus7Hours(19)
        ruleTenMinuteBeforeCoworking.minute = 50

		const ruleFiveMinuteBeforeCoworking = new schedule.RecurrenceRule();
        ruleFiveMinuteBeforeCoworking.hour = Time.minus7Hours(19)
        ruleFiveMinuteBeforeCoworking.minute = 55
		schedule.scheduleJob(ruleOneHourBeforeCoworking,async() =>{
			RecurringCoworkingController.remindOneHourBeforeMeetup(client)
		})
		schedule.scheduleJob(ruleTenMinuteBeforeCoworking,async() =>{
			RecurringCoworkingController.remindTenMinuteBeforeMeetup(client)
		})
		schedule.scheduleJob(ruleFiveMinuteBeforeCoworking,async() =>{
			RecurringCoworkingController.remindDailyCoworking(client,listFocusRoom)
		})

	}

	static async remindDailyCoworking(client,listFocusRoom){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const allParty = (await RecurringCoworkingController.getAllActiveParty()).data
		for (let i = 0; i < allParty.length; i++) {
			const dataParty = allParty[i];
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
			threadParty.send(RecurringMeetupMessage.remindUserJoinMeetupSession(voiceChannelId,tagPartyMembers))
		}
	}

	static async remindOneHourBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const allParty = (await RecurringCoworkingController.getAllActiveParty()).data
		for (let i = 0; i < allParty.length; i++) {
			const dataParty = allParty[i];
			const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty?.msgId)
			const tagPartyMembers = RecurringCoworkingController.formatTagPartyMembers(dataParty.MemberPartyRooms)
			threadParty.send(RecurringMeetupMessage.reminderOneHourBeforeMeetup(tagPartyMembers))
		}
	}

	static async remindTenMinuteBeforeMeetup(client,time,partyId){
		const channelPartyRoom = ChannelController.getChannel(client,CHANNEL_PARTY_ROOM)
		const allParty = (await RecurringCoworkingController.getAllActiveParty()).data
		for (let i = 0; i < allParty.length; i++) {
			const dataParty = allParty[i];
			const threadParty = await ChannelController.getThread(channelPartyRoom,dataParty?.msgId)
			const tagPartyMembers = RecurringCoworkingController.formatTagPartyMembers(dataParty.MemberPartyRooms)
			threadParty.send(RecurringMeetupMessage.reminderTenMinBeforeMeetup(tagPartyMembers))
		}
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

	static handleQuickPartyRoom(oldMember,listFocusRoom,totalOldMember){
		if(RecurringCoworkingController.isEmptyPartyRoom(oldMember,listFocusRoom,totalOldMember)){
			oldMember.channel.delete()
			setTimeout(() => {
				delete listFocusRoom[oldMember.channelId]
			}, Time.oneMinute() * 5);
		}
	}
}

module.exports = RecurringCoworkingController
