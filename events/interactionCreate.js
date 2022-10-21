const BoostController = require("../controllers/BoostController");
const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const BoostMessage = require("../views/BoostMessage");
const PaymentMessage = require("../views/PaymentMessage");
const PaymentController = require("../controllers/PaymentController");
const PartyMessage = require("../views/PartyMessage");
const PartyController = require("../controllers/PartyController");
module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (!interaction.isCommand() && !interaction.isButton() && !interaction.isSelectMenu()) return;

		if (interaction.isButton()) {
			if(ReferralCodeController.showModalRedeem(interaction)) return
			if(PartyController.showModalWriteGoal(interaction)) return
			if(PartyController.showModalEditGoal(interaction)) return 

			const [commandButton,targetUserId=interaction.user.id,value] = interaction.customId.split("_")
			if (commandButton=== "postGoal" || commandButton.includes('Reminder') ||commandButton.includes('Time') || commandButton.includes('role') || commandButton === 'goalCategory') {
				await interaction.deferReply();
			}else{
				await interaction.deferReply({ephemeral:true});
			}

			if (commandButton.includes('boost') && interaction.user.id === targetUserId) {
				await interaction.editReply(BoostMessage.warningBoostYourself())
				return	
			}
			
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			switch (commandButton) {
				case "boostInactiveMember":
					BoostController.interactionBoostInactiveMember(interaction,targetUser,notificationThreadTargetUser)
					break;
				case "boostBack":
					BoostController.interactionBoostBack(interaction,targetUser,notificationThreadTargetUser)
					break;
				case "joinParty":{
					const alreadyHaveGoal = await PartyController.alreadyHaveGoal(interaction.user.id)
					if (alreadyHaveGoal) {
						interaction.editReply(PartyMessage.warningReplaceExistingGoal(interaction.user.id))
					}else{
						notificationThreadTargetUser.send(PartyMessage.pickYourRole(targetUserId))
						await interaction.editReply(PartyMessage.replySuccessStartAccountabilityMode(notificationThreadTargetUser.id))
					}}
					break;
				case "continueReplaceGoal":
					notificationThreadTargetUser.send(PartyMessage.pickYourRole(targetUserId,value))
					await interaction.editReply(PartyMessage.replySuccessStartAccountabilityMode(notificationThreadTargetUser.id,value))
					break;
				case "cancelReplaceGoal":
					await interaction.editReply(PartyMessage.cancelReplaceGoal(value))
					break;
				case "startSoloMode":
					const alreadyHaveGoal = await PartyController.alreadyHaveGoal(interaction.user.id)
					if (alreadyHaveGoal) {
						interaction.editReply(PartyMessage.warningReplaceExistingGoal(interaction.user.id,"solo"))
					}else{
						notificationThreadTargetUser.send(PartyMessage.pickYourRole(targetUserId,'solo'))
						await interaction.editReply(PartyMessage.replySuccessStartAccountabilityMode(notificationThreadTargetUser.id))
					}
					break;
				case "postGoal":
					PartyController.interactionPostGoal(interaction,value)
					break;
				case "roleDeveloper":
					PartyController.interactionPickRole(interaction,'Developer',value)
					break;
				case "roleDesigner":
					PartyController.interactionPickRole(interaction,'Designer',value)
					break;
				case "roleCreator":
					PartyController.interactionPickRole(interaction,'Creator',value)
					break;
				case "defaultReminder":
					await PartyController.interactionSetDefaultReminder(interaction,value)
					notificationThreadTargetUser.send(PartyMessage.endOfOnboarding())
					break;
				case "customReminder":
					await interaction.editReply(PartyMessage.replyCustomReminder())
					interaction.message.delete()
					notificationThreadTargetUser.send(PartyMessage.endOfOnboarding())
					break;
				case "noReminder":
					await interaction.editReply(PartyMessage.replyNoHighlightReminder())
					interaction.message.delete()
					notificationThreadTargetUser.send(PartyMessage.endOfOnboarding())
					break;
				case "claimReferral":
					ReferralCodeController.interactionClaimReferral(interaction,targetUserId)
					break;
				case "generateReferral":
					ReferralCodeController.interactionGenerateReferral(interaction,targetUserId)
					break;
				case "remindJoinNextCohort":
					PaymentController.setReminderJoinNextCohort(interaction.client,targetUserId)
					await interaction.editReply(PaymentMessage.replySetReminderJoinNextCohort())
					break;
				default:
					await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
					break;
			}
		}else if(interaction.isSelectMenu()){
			
			const [commandMenu,targetUserId] = interaction.customId.split("_")
			if (commandMenu.includes('boost')) {
				await interaction.deferReply({ephemeral:true});
				if (interaction.user.id === targetUserId ) {
					await interaction.editReply(BoostMessage.warningReplyYourself())
					return	
				}
			}else{
				await interaction.deferReply();
			}
			
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			const valueMenu = interaction.values[0]
			switch (commandMenu) {
				case "inactiveReply":
					notificationThreadTargetUser.send(BoostMessage.IamBack(targetUser.user,interaction.user,valueMenu))
					await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
					break;
				case "goalCategory":
					const deadlineGoal = PartyController.getDeadlineGoal()
					await interaction.editReply(PartyMessage.askUserWriteGoal(deadlineGoal.dayLeft,deadlineGoal.description,targetUserId,valueMenu))
					interaction.message.delete()
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

