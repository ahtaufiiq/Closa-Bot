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
				.select('notification_id')
				.eq('id',member.user.id)
				.single()
				.then(data => {
					if (!data.body) {
						supabase.from("Users")
							.insert([{
								id:member.user.id,
								username:member.user.username,
								name:member.user.username,
								notification_id:msg.id,
								current_streak:0,
								longest_streak:0,
								total_days:0,
								total_points:0,
								last_active:Time.getTodayDateOnly()
							}])
							.then()
					}else if(!data.body?.notification_id){
						supabase.from("Users")
							.update({notification_id:msg.id})
							.eq('id',member.user.id)
							.then()
					}	
				})
		})

			

	},
};