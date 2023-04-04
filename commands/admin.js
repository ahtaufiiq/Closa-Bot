const { PermissionFlagsBits,SlashCommandBuilder } = require('discord.js');
const ChannelController = require('../controllers/ChannelController');
const DailyStreakController = require('../controllers/DailyStreakController');
const GuidelineInfoController = require('../controllers/GuidelineInfoController');
const PartyController = require('../controllers/PartyController');
const UserController = require('../controllers/UserController');
const Time = require('../helpers/time');
const DailyStreakMessage = require('../views/DailyStreakMessage');
const supabase = require('../helpers/supabaseClient');
const { CHANNEL_PARTY_ROOM } = require('../helpers/config');
const PartyMessage = require('../views/PartyMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('Admin Access')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add_to_party')
				.setDescription('add user to party')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true))
				.addStringOption(option => option.setName('partyId').setDescription('party number').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove_from_party')
				.setDescription('remove user from party')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true))
				.addStringOption(option => option.setName('partyNumber').setDescription('party number').setRequired(true)))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const command = interaction.options.getSubcommand()
		await interaction.deferReply({ephemeral:true});

		if(command === 'add_to_party'){
			const user = interaction.options.getUser('user')
			const partyNumber = interaction.options.getString('partyNumber')
			const {body:{goalId}} = await UserController.getDetail(MY_ID,'goalId')
			await PartyController.addMemberPartyRoom(interaction.client,goalId,partyNumber,user.id)
			const dataPartyRooms = await supabase.from("PartyRooms")
				.select("*,MemberPartyRooms(UserId,project,isLeader,isTrialMember)")
				.eq('id',partyNumber)
				.single()
		
			const channelParty = ChannelController.getChannel(interaction.client,CHANNEL_PARTY_ROOM)
			const threadPartyRoom = await ChannelController.getThread(channelParty,dataPartyRooms.body.msgId)
			threadPartyRoom.send(PartyMessage.userJoinedParty(user.id))
			
			PartyController.updateMessagePartyRoom(interaction.client,dataPartyRooms.body.msgId,partyNumber)
		
			ChannelController.sendToNotification(
				interaction.client,
				PartyMessage.replySuccessJoinParty(user.id,dataPartyRooms.body.msgId),
				user.id
			)
		
			PartyController.followGoalAccountabilityPartner(interaction.client,partyNumber,user.id,goalId)
	
			interaction.editReply('success add user to party')
		}else if(command === 'remove_from_party'){
			const user = interaction.options.getUser('user')
			const partyNumber = interaction.options.getString('partyNumber')
			const {body:{goalId}} = await UserController.getDetail(MY_ID,'goalId')
			await PartyController.removeMemberPartyRoom(interaction.client,goalId,partyNumber,user.id)
			const dataPartyRooms = await supabase.from("PartyRooms")
				.select("*,MemberPartyRooms(UserId,project,isLeader,isTrialMember)")
				.eq('id',partyNumber)
				.single()
		
			const channelParty = ChannelController.getChannel(interaction.client,CHANNEL_PARTY_ROOM)
			const threadPartyRoom = await ChannelController.getThread(channelParty,dataPartyRooms.body.msgId)
			ChannelController.removeUserFromThread(interaction.client,CHANNEL_PARTY_ROOM,dataPartyRooms.body.msgId)
			threadPartyRoom.send(PartyMessage.userLeaveParty(user.id))

			PartyController.updateMessagePartyRoom(interaction.client,dataPartyRooms.body.msgId,partyNumber)
		
			PartyController.unfollowGoalAccountabilityPartner(interaction.client,partyNumber,user.id,goalId)
	
			interaction.editReply('success remove user from party')
		}
		
	},
};