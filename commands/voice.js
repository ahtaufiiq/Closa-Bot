const { SlashCommandBuilder } = require('@discordjs/builders');
const { CHANNEL_TODO, CHANNEL_HIGHLIGHT, CHANNEL_PARTY_ROOM } = require('../helpers/config');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const supabase = require('../helpers/supabaseClient');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const ChannelController = require('../controllers/ChannelController');
const LocalData = require('../helpers/LocalData');
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('voice')
		.setDescription('create voice channel')
		.addSubcommand(subcommand =>
			subcommand
				.setName('all')
				.setDescription('create voice channel for all party'))
				.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addSubcommand(subcommand =>
			subcommand
				.setName('party')
				.setDescription('create voice channel for spesific party'))
				.addStringOption(option => option.setName('party').setDescription('13').setRequired(true))
				.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const command = interaction.options.getSubcommand()
		
		const {cohort} = LocalData.getData()
		if(command === 'all'){
			supabase.from("PartyRooms")
				.select("id,msgId,MemberPartyRooms(UserId)")
				.eq('cohort',cohort)
				.then(async data=>{
					const channelPartyRoom = ChannelController.getChannel(interaction.client,CHANNEL_PARTY_ROOM)
					for (let i = 0; i < data.body.length; i++) {
						const partyId = data.body[i].id
						const members = data.body[i].MemberPartyRooms.map(member=>member.UserId)
						const threadId = data.body[i].msgId
						const voiceChannelId = await RecurringMeetupController.createPrivateVoiceChannel(interaction.client,`Party ${partyId}`,members)
						supabase.from('PartyRooms')
							.update({voiceChannelId})
							.eq('id',partyId)
							.then()
						
						const threadParty = await ChannelController.getThread(channelPartyRoom,threadId)
						threadParty.send(RecurringMeetupMessage.remindUserJoinMeetupSession(voiceChannelId))
					}
				})
			await interaction.reply(`All voice channels have been created`)			
		}else if(command === 'party'){
			const partyId = Number(interaction.options.getString('party'))
			
			supabase.from("PartyRooms")
				.select("msgId,MemberPartyRooms(UserId)")
				.eq('id',partyId)
				.single()
				.then(async data=>{
					if(!data.body) return

					const channelPartyRoom = ChannelController.getChannel(interaction.client,CHANNEL_PARTY_ROOM)
					const members = data.body.MemberPartyRooms.map(member=>member.UserId)
					const threadId = data.body.msgId
					const voiceChannelId = await RecurringMeetupController.createPrivateVoiceChannel(interaction.client,`Party ${partyId}`,members)
					supabase.from('PartyRooms')
						.update({voiceChannelId})
						.eq('id',partyId)
						.then()
					
					const threadParty = await ChannelController.getThread(channelPartyRoom,threadId)
					threadParty.send(RecurringMeetupMessage.remindUserJoinMeetupSession(voiceChannelId))
				})
			await interaction.reply(`Voice channels Party ${partyId} have been created`)	
		}
	},
};