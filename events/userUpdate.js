const InfoUser = require("../helpers/InfoUser");
const UserController = require("../controllers/UserController");
const DiscordWebhook = require("../helpers/DiscordWebhook");
module.exports = {
	name: 'userUpdate',
	async execute(oldUser,newUser) {
		try {
			if(InfoUser.getAvatar(oldUser) !== InfoUser.getAvatar(newUser)){
				UserController.updateData({
					avatarURL:InfoUser.getAvatar(newUser),
				},newUser.id)
			}
		} catch (error) {
			DiscordWebhook.sendError(error,'userUpdate')			
		}
	},
};