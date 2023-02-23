const ChannelController = require("../controllers/ChannelController");
const GuidelineInfoController = require("../controllers/GuidelineInfoController");
const { CHANNEL_NOTIFICATION } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");

module.exports = {
	name: 'guildMemberRemove',
	async execute(member) {
		const channelNotifications = ChannelController.getChannel(member.client,CHANNEL_NOTIFICATION)
		const data = await supabase.from("Users")
			.select('notificationId')
			.eq("id",member.user.id)
			.single()

		if(!data.body) return
		supabase.from("Users")
			.update({notificationId:null})
			.eq('id',member.user.id)
			.then()
		const message = await ChannelController.getMessage(channelNotifications,data.body.notificationId)
		message.delete()
		const thread = await ChannelController.getNotificationThread(member.client,member.user.id,data.body.notificationId)
		thread.delete()

		GuidelineInfoController.deleteData()
	},
};