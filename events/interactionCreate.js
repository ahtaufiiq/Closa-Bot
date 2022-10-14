const { MessageAttachment } = require("discord.js");
const BoostController = require("../controllers/BoostController");
const ChannelController = require("../controllers/ChannelController");
const DailyReport = require("../controllers/DailyReport");
const MemberController = require("../controllers/MemberController");
const PointController = require("../controllers/PointController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const GenerateImage = require("../helpers/GenerateImage");
const BoostMessage = require("../views/BoostMessage");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const PaymentMessage = require("../views/PaymentMessage");
const PaymentController = require("../controllers/PaymentController");
const PartyMessage = require("../views/PartyMessage");
const { CHANNEL_GOALS } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
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
			let totalBoost 
			let isMoreThanOneMinute 
			switch (commandButton) {
				case "joinParty":
					notificationThreadTargetUser.send(PartyMessage.pickYourRole(targetUserId))
					await interaction.editReply(PartyMessage.replySuccessJoinParty(notificationThreadTargetUser.id))
					break;
				case "startSoloMode":
					notificationThreadTargetUser.send(PartyMessage.pickYourRole(targetUserId,'solo'))
					await interaction.editReply(PartyMessage.replySuccessStartSoloMode(notificationThreadTargetUser.id))
					break;
				case "postGoal":
					const project = interaction.message.embeds[0].title
					const [
						{value:goal},
						{value:about},
						{value:descriptionShareProgress},
					] = interaction.message.embeds[0].fields
					const shareProgressAt = PartyController.getTimeShareProgress(descriptionShareProgress)
					const role = value.split('-')[1]
					await interaction.editReply(PartyMessage.postGoal({
						project,
						goal,
						about,
						role,
						shareProgressAt,
						user:interaction.user,
						dayLeft:19,
						value
					}))
					interaction.message.delete()

					
					
					const channelGoals = ChannelController.getChannel(interaction.client,CHANNEL_GOALS)
					channelGoals.send(PartyMessage.postGoal({
						project,
						goal,
						about,
						shareProgressAt,
						role,
						user:interaction.user,
						dayLeft:19,
						value
					}))
					.then(msg=>{
						ChannelController.createThread(msg,"Learn Marketing",interaction.user.username)
						supabase.from('Users')
							.update({
								goal_id:msg.id
							})
							.eq('id',interaction.user.id)
							.then()
					})
					
					notificationThreadTargetUser.send(PartyMessage.askUserWriteHighlight(targetUserId))
					break;
				case "roleDeveloper":
					PartyController.interactionPickRole(interaction,'developer',targetUserId,value)
					break;
				case "roleDesigner":
					PartyController.interactionPickRole(interaction,'designer',targetUserId,value)
					break;
				case "roleCreator":
					PartyController.interactionPickRole(interaction,'creator',targetUserId,value)
					break;
				case "defaultReminder":
					await interaction.editReply(PartyMessage.replyDefaultReminder())
					break;
				case "customReminder":
					await interaction.editReply(PartyMessage.replyCustomReminder())
					break;
				case "boostInactiveMember":
					BoostController.interactionBoostInactiveMember(interaction,targetUser)
					break;
				case "boostBack":
					BoostController.interactionBoostBack(interaction,targetUser)
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
					await interaction.editReply(PartyMessage.askUserWriteGoal(19,targetUserId,valueMenu))
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

