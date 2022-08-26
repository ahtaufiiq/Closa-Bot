const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const BoostMessage = require("../views/BoostMessage");

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (!interaction.isCommand() && !interaction.isButton()) return;
		if (interaction.isButton()) {
			await interaction.deferReply({ephemeral:true});
			const [commandButton,targetUserId] = interaction.component.customId.split("_")
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			switch (commandButton) {
				case "boostInactiveMember":
					notificationThreadTargetUser.send(BoostMessage.sendBoostToInactiveMember(targetUser.user,interaction.user))
					await interaction.editReply({ephemeral:true,embeds:[BoostMessage.successSendBoost(targetUser.user)]})
					break;
				case "activeAgain":
					notificationThreadTargetUser.send(BoostMessage.IamBack(targetUser.user))
					await interaction.editReply({ephemeral:true,content:`message sent to ${targetUser.user}`})
					break;
				case "boostBack":
					notificationThreadTargetUser.send(BoostMessage.boostBack(interaction.user))
					await interaction.editReply({ephemeral:true,content:`message sent to ${targetUser.user}`})
					break;
				default:
					await interaction.editReply({ephemeral:true,content:`message sent to ${targetUser.user}`})
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

