const BoostController = require("../controllers/BoostController");
const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const PointController = require("../controllers/PointController");
const BoostMessage = require("../views/BoostMessage");

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (!interaction.isCommand() && !interaction.isButton() && !interaction.isSelectMenu()) return;
		if (interaction.isButton()) {
			await interaction.deferReply({ephemeral:true});
			const [commandButton,targetUserId] = interaction.customId.split("_")
			if (interaction.user.id === targetUserId) {
				await interaction.editReply({ephemeral:true,content:"⚠️ Can't boost yourself. Boost other instead "})
				return	
			}
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			let totalBoost 
			switch (commandButton) {
				case "boostInactiveMember":
					PointController.incrementTotalPoints(5,interaction.user.id)
					totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
					notificationThreadTargetUser.send(BoostMessage.sendBoostToInactiveMember(targetUser.user,interaction.user,totalBoost))
					await interaction.editReply({ephemeral:true,embeds:[BoostMessage.successSendBoost(targetUser.user)]})
					break;
				case "boostBack":
					PointController.incrementTotalPoints(5,interaction.user.id)
					totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
					notificationThreadTargetUser.send(BoostMessage.boostBack(targetUser.user,interaction.user,totalBoost))
					await interaction.editReply({ephemeral:true,content:`boost sent to ${targetUser.user}`})
					break;
				default:
					await interaction.editReply({ephemeral:true,content:`message sent to ${targetUser.user}`})
					break;
			}
		}else if(interaction.isSelectMenu()){
			await interaction.deferReply({ephemeral:true});
			const [commandMenu,targetUserId] = interaction.customId.split("_")
			if (interaction.user.id === targetUserId) {
				await interaction.editReply({ephemeral:true,content:"⚠️ Can't reply to yourself. Boost other instead."})
				return	
			}
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			switch (commandMenu) {
				case "inactiveReply":
					notificationThreadTargetUser.send(BoostMessage.IamBack(targetUser.user,interaction.user,interaction.values[0]))
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

