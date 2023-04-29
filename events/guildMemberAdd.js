const ChannelController = require("../controllers/ChannelController");
const GuidelineInfoController = require("../controllers/GuidelineInfoController");
const MemberController = require("../controllers/MemberController");
const { CHANNEL_NOTIFICATION, ROLE_ACTIVE_MEMBER } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");

module.exports = {
	name: 'guildMemberAdd',
	async execute(member) {
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
					currentStreak:0,
					longestStreak:0,
					totalDay:0,
					totalPoint:0,
					lastActive:Time.getTodayDateOnly()
				}])
		}else {
			await supabase.from("Users")
			.update({notificationId:msg.id})
			.eq('id',member.user.id)
		}

	},
};