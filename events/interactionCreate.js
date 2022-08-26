const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const BoostMessage = require("../views/BoostMessage");

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (!interaction.isCommand() && !interaction.isButton()) return;
		if (interaction.isButton()) {
			interaction.reply({ ephemeral: true ,content:"Success Sent"});
			const [commandButton,targetUserId] = interaction.component.customId.split("_")
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const notificationThreadSender = await ChannelController.getNotificationThread(interaction.client,interaction.user.id)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			switch (commandButton) {
				case "boostInactiveMember":
					notificationThreadTargetUser.send(BoostMessage.sendBoostToInactiveMember(targetUser.user,interaction.user))
					notificationThreadSender.send(BoostMessage.successSendBoost(targetUser.user))
					break;
				case "activeAgain":
					notificationThreadSender.send(BoostMessage.IamBack(targetUser.user))
					break;
			
				default:
					break;
			}
		}else{
			const client = interaction.client
			const command = client.commands.get(interaction.commandName);
			if (!command) return;
		
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	},
};

