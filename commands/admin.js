const { PermissionFlagsBits,SlashCommandBuilder } = require('discord.js');
const ChannelController = require('../controllers/ChannelController');
const DailyStreakController = require('../controllers/DailyStreakController');
const GuidelineInfoController = require('../controllers/GuidelineInfoController');
const PartyController = require('../controllers/PartyController');
const UserController = require('../controllers/UserController');
const Time = require('../helpers/time');
const DailyStreakMessage = require('../views/DailyStreakMessage');
const supabase = require('../helpers/supabaseClient');
const { CHANNEL_PARTY_ROOM, ROLE_NEW_MEMBER, ROLE_ONBOARDING_WELCOME, ROLE_ONBOARDING_COWORKING, ROLE_ONBOARDING_LATER, ROLE_ONBOARDING_PROGRESS, ROLE_ONBOARDING_PROJECT, MY_ID, ROLE_ACTIVE_MEMBER } = require('../helpers/config');
const PartyMessage = require('../views/PartyMessage');
const ReferralCodeController = require('../controllers/ReferralCodeController');
const MemberController = require('../controllers/MemberController');
const GoalController = require('../controllers/GoalController');
const InfoUser = require('../helpers/InfoUser');
const OnboardingController = require('../controllers/OnboardingController');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('Admin Access')
		.addSubcommand(subcommand =>
			subcommand
				.setName('party__add_user')
				.setDescription('add user to party')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true))
				.addStringOption(option => option.setName('party').setDescription("Party Number").setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('welcome__onboarding')
				.setDescription('onboarding new user')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('thread__remove_user')
				.setDescription('remove user from thread')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true))
				.addStringOption(option => option.setName('link').setDescription("Message Link").setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('party__remove_user')
				.setDescription('remove user from party')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('update__goal')
				.setDescription('update goal')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('reset__onboarding')
				.setDescription('reset onboarding')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('point')
				.setDescription('update total point')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true))
				.addStringOption(option => option.setName('point').setDescription("total point").setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('referral')
				.setDescription('generate new referral')
				.addUserOption(option => option.setName('user').setDescription('user'))
				.addStringOption(option => option.setName('total').setDescription('total referral')))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const command = interaction.options.getSubcommand()
		await interaction.deferReply({ephemeral:true});
		
		if(command === 'welcome__onboarding'){
			const user = interaction.options.getUser('user')
			MemberController.addRole(interaction.client,user.id,ROLE_ACTIVE_MEMBER)
		
			const data = await supabase.from("Users")
				.select('notificationId')
				.eq('id',user.id)
				.single()
			
			if (!data.body) {
				await supabase.from("Users")
					.insert([{
						id:user.id,
						username:UserController.getNameFromUserDiscord(user),
						name:interaction.nickname || user.username,
						avatarURL:InfoUser.getAvatar(user),
						currentStreak:0,
						longestStreak:0,
						totalDay:0,
						totalPoint:0,
						lastActive:Time.getTodayDateOnly(),
					}])
			}
			OnboardingController.welcomeOnboarding(interaction.client,user)
			interaction.editReply('success')
		}else if(command === 'party__add_user'){
			const user = interaction.options.getUser('user')
			const partyNumber = interaction.options.getString('party')
			const {body:{goalId}} = await UserController.getDetail(user.id,'goalId')
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
		}else if(command === 'party__remove_user'){
			const user = interaction.options.getUser('user')
			const memberPartyRooms = await supabase.from("MemberPartyRooms")
				.select("partyId,PartyRooms(msgId),Users(goalId)")
				.limit(1)
				.eq("UserId",user.id)
				.order('endPartyDate',{ascending:false})
				.single()
			if(memberPartyRooms.body){
				const {partyId,PartyRooms:{msgId},Users:{goalId}} = memberPartyRooms.body
				await PartyController.removeMemberPartyRoom(interaction.client,goalId,partyId,user.id)
				const channelParty = ChannelController.getChannel(interaction.client,CHANNEL_PARTY_ROOM)
				const threadPartyRoom = await ChannelController.getThread(channelParty,msgId)
				ChannelController.removeUserFromThread(interaction.client,CHANNEL_PARTY_ROOM,msgId)
				threadPartyRoom.send(PartyMessage.userLeaveParty(user.id))
				ChannelController.removeUserFromThread(interaction.client,CHANNEL_PARTY_ROOM,msgId)
				PartyController.updateMessagePartyRoom(interaction.client,msgId,partyId)
			
				PartyController.unfollowGoalAccountabilityPartner(interaction.client,partyId,user.id,goalId)
		
				interaction.editReply('success remove user from party')
			}else{
				interaction.editReply('failed remove user from party')
			}
		
		}else if(command === 'thread__remove_user'){
			const user = interaction.options.getUser('user')
			const messageLink = interaction.options.getString('link')
			const channelId= messageLink.split('/')[5]
			const threadId= messageLink.split('/')[6]

			if(channelId && threadId){
				ChannelController.removeUserFromThread(interaction.client,channelId,threadId,user.id)
				interaction.editReply('success remove user from thread')
			}else{
				interaction.editReply('failed remove user from thread')
			}
		}else if(command === 'referral'){
			const user = interaction.options.getUser('user')
			const totalReferral = interaction.options.getString('total')
			const targetUserId = user ? user?.id : interaction.user.id
			const values = await ReferralCodeController.addNewReferral(
				targetUserId,
				totalReferral || 1
			)
			GuidelineInfoController.updateMessageGuideline(
				interaction.client,
				targetUserId
			)

			const referralCode = values.map(data=>data.referralCode)
			interaction.editReply(referralCode.join('\n'))
		}else if(command === 'reset__onboarding'){
			const user = interaction.options.getUser('user')
			const targetUser = user ? user : interaction.user
			await Promise.all([
				supabase.from('Users')
					.update({onboardingStep:null,goalId:null,lastDone:null})
					.eq('id',targetUser.id),
				supabase.from("GuidelineInfos")
					.delete()
					.eq("UserId",targetUser.id)
			])
			const inviteLink = await ReferralCodeController.generateInviteLink(
				interaction.client,
				targetUser.id === MY_ID ? '449853586508349440' : MY_ID
			)
			interaction.editReply(inviteLink)
			targetUser.send(inviteLink)
			setTimeout(async() => {
				const user = await MemberController.getMember(interaction.client,targetUser.id)
				user.kick()
			}, 1000 * 5);
			
		}else if(command === 'update__goal'){
			const user = interaction.options.getUser('user')
			const data = await GoalController.getActiveGoal(user.id)

			await GoalController.updateGoal(interaction.client,data.body,data.body.Users.preferredCoworkingTime)
			interaction.editReply('success update goal')
		}else if(command === 'point'){
			const user = interaction.options.getUser('user')
			const point = interaction.options.getString('point')

			await supabase.from("Users")
				.update({totalPoint:+point})
				.eq('id',user.id)
			interaction.editReply('success update total point')
		}
		
	},
};