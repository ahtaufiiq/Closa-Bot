const ChannelController = require("../controllers/ChannelController");
const GuidelineInfoController = require("../controllers/GuidelineInfoController");
const MemberController = require("../controllers/MemberController");
const OnboardingController = require("../controllers/OnboardingController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const InfoUser = require("../helpers/InfoUser");
const { CHANNEL_NOTIFICATION, ROLE_ACTIVE_MEMBER, CHANNEL_WELCOME, MY_ID } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const OnboardingMessage = require("../views/OnboardingMessage");
const fs = require('fs');
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
module.exports = {
	name: 'guildMemberAdd',
	async execute(member,invites) {
		MemberController.addRole(member.client,member.user.id,ROLE_ACTIVE_MEMBER)
		
		const data = await supabase.from("Users")
			.select('notificationId')
			.eq('id',member.user.id)
			.single()
		
		if (!data.body) {
			await supabase.from("Users")
				.insert([{
					id:member.user.id,
					username:member.user.username,
					name:member.nickname || member.user.username,
					avatarURL:InfoUser.getAvatar(member.user),
					currentStreak:0,
					longestStreak:0,
					totalDay:0,
					totalPoint:0,
					lastActive:Time.getTodayDateOnly(),
				}])
		}
		const newInvites = await member.guild.invites.fetch()
		const oldInvites = invites;
		const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));
		invites.set(invite.code,invite.uses)

		const [totalMember,totalInvite] = await Promise.all([
			MemberController.getTotalMember(),
			ReferralCodeController.incrementTotalInvite(invite.code)
		])
		OnboardingController.welcomeOnboarding(member.client,member.user)
		const dataUser = await supabase.from("Users")
			.select('id')
			.eq('inviteCode',invite.code)
			.single()
			
		const UserId = dataUser.body?.id || (member.user.id === '449853586508349440' ? MY_ID : '449853586508349440') 
		GuidelineInfoController.updateMessageGuideline(member.client,UserId)
		const channelConfirmation = ChannelController.getChannel(member.client,CHANNEL_WELCOME)
		const referrer = await MemberController.getMember(member.client,UserId)
		setTimeout(async () => {
			const msg = await channelConfirmation.send(ReferralCodeMessage.notifSuccessRedeem(member.user,referrer.user,totalMember,totalInvite))
			ChannelController.createThread(msg,`Welcome to closa ${member.user.username}!`)
		}, 1000 * 15);
	},
};