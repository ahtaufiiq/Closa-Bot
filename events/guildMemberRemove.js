const ChannelController = require("../controllers/ChannelController");
const GuidelineInfoController = require("../controllers/GuidelineInfoController");
const DiscordWebhook = require("../helpers/DiscordWebhook");
const { CHANNEL_NOTIFICATION } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");

module.exports = {
	name: 'guildMemberRemove',
	async execute(member) {
		try {
		const data = await supabase.from("Users")
			.select('notificationId')
			.eq("id",member.user.id)
			.single()

		if(!data.data) return
		supabase.from("Users")
			.update({notificationId:null})
			.eq('id',member.user.id)
			.then()
		if(data.data.notificationId){
			const thread = await ChannelController.getNotificationThread(member.client,member.user.id,data.data.notificationId)
			thread.delete()
			GuidelineInfoController.deleteData(member.user.id)
		}
		} catch (error) {
			DiscordWebhook.sendError(error)
		}

	},
};