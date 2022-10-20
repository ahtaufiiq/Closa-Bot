const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const RequestAxios = require("../helpers/axios");
const { CHANNEL_NOTIFICATION, ROLE_ACTIVE_MEMBER } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");

module.exports = {
	name: 'guildMemberAdd',
	async execute(member) {
		const channelNotifications = ChannelController.getChannel(member.client,CHANNEL_NOTIFICATION)
		channelNotifications.send(`${member.user}`)
		.then(msg=>{
			ChannelController.createThread(msg,member.user.username)
			MemberController.addRole(member.client,member.user.id,ROLE_ACTIVE_MEMBER)
			supabase.from("Users")
				.select('notificationId')
				.eq('id',member.user.id)
				.single()
				.then(data => {
					if (!data.body) {
						supabase.from("Users")
							.insert([{
								id:member.user.id,
								username:member.user.username,
								name:member.user.username,
								notificationId:msg.id,
								currentStreak:0,
								longestStreak:0,
								totalDay:0,
								totalPoint:0,
								lastActive:Time.getTodayDateOnly()
							}])
							.then()
					}else if(!data.body?.notificationId){
						supabase.from("Users")
							.update({notificationId:msg.id})
							.eq('id',member.user.id)
							.then()
					}	
				})
		})

			

	},
};