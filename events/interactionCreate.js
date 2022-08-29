const BoostController = require("../controllers/BoostController");
const ChannelController = require("../controllers/ChannelController");
const DailyReport = require("../controllers/DailyReport");
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
				await interaction.editReply(BoostMessage.warningBoostYourself())
				return	
			}
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			let totalBoost 
			let isMoreThanOneMinute 
			switch (commandButton) {
				case "boostInactiveMember":
					DailyReport.activeMember(interaction.client,interaction.user.id)
					isMoreThanOneMinute = await BoostController.isPreviousBoostMoreThanOneMinute(interaction.user.id,targetUser.user.id)
					if (isMoreThanOneMinute) {
						PointController.incrementTotalPoints(5,interaction.user.id)
						totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
						notificationThreadTargetUser.send(BoostMessage.sendBoostToInactiveMember(targetUser.user,interaction.user,totalBoost))
						await interaction.editReply({embeds:[BoostMessage.successSendBoost(targetUser.user)]})
					}else {
						await interaction.editReply(BoostMessage.warningSpamBoost())
					}
					break;
				case "boostBack":
					DailyReport.activeMember(interaction.client,interaction.user.id)
					isMoreThanOneMinute = await BoostController.isPreviousBoostMoreThanOneMinute(interaction.user.id,targetUser.user.id)
					if (isMoreThanOneMinute) {
						PointController.incrementTotalPoints(5,interaction.user.id)
						totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
						notificationThreadTargetUser.send(BoostMessage.boostBack(targetUser.user,interaction.user,totalBoost))
						await interaction.editReply(BoostMessage.successBoostBack(targetUser.user))
					}else{
						await interaction.editReply(BoostMessage.warningSpamBoost())
					}

					break;
				default:
					await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
					break;
			}
		}else if(interaction.isSelectMenu()){
			await interaction.deferReply({ephemeral:true});
			const [commandMenu,targetUserId] = interaction.customId.split("_")
			if (interaction.user.id === targetUserId) {
				await interaction.editReply(BoostMessage.warningReplyYourself())
				return	
			}
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			switch (commandMenu) {
				case "inactiveReply":
					notificationThreadTargetUser.send(BoostMessage.IamBack(targetUser.user,interaction.user,interaction.values[0]))
					await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
					break;
				default:
					await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
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

