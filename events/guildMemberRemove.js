const ChannelController = require("../controllers/ChannelController");
const RequestAxios = require("../helpers/axios");
const { CHANNEL_NOTIFICATION } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");

module.exports = {
	name: 'guildMemberRemove',
	async execute(member) {
		const channelNotifications = ChannelController.getChannel(member.client,CHANNEL_NOTIFICATION)
		supabase.from("Users")
			.select('notification_id')
			.eq("id",member.user.id)
			.single()
			.then(async data=>{
				const message = await ChannelController.getMessage(channelNotifications,data.body.notification_id)
				message.delete()
				const thread = await ChannelController.getNotificationThread(member.client,member.user.id,data.body.notification_id)
				thread.delete()
			})
	},
};