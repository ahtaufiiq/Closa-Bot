const BoostController = require("../controllers/BoostController");
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
			let totalBoost 

			switch (commandButton) {
				case "boostInactiveMember":
					totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
					notificationThreadTargetUser.send(BoostMessage.sendBoostToInactiveMember(targetUser.user,interaction.user,totalBoost))
					await interaction.editReply({ephemeral:true,embeds:[BoostMessage.successSendBoost(targetUser.user)]})
					break;
				case "activeAgain":
					notificationThreadTargetUser.send(BoostMessage.IamBack(targetUser.user))
					await interaction.editReply({ephemeral:true,content:`boost sent to ${targetUser.user}`})
					break;
				case "boostBack":
					totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
					notificationThreadTargetUser.send(BoostMessage.boostBack(targetUser.user,interaction.user,totalBoost))
					await interaction.editReply({ephemeral:true,content:`boost sent to ${targetUser.user}`})
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

