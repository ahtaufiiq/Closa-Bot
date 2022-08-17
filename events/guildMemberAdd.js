const ChannelController = require("../controllers/ChannelController");
const RequestAxios = require("../helpers/axios");
const { CHANNEL_NOTIFICATION } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");

module.exports = {
	name: 'guildMemberAdd',
	async execute(member) {
		const channelNotifications = ChannelController.getChannel(member.client,CHANNEL_NOTIFICATION)
		channelNotifications.send(`${member.user}`)
		.then(msg=>{
			
			ChannelController.createThread(msg,member.user.username)
		})
		RequestAxios.get('users/'+member.user.id)
			.then(data=>{
				if (!data) {
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
				}
			})
			

	},
};