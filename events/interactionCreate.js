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
module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (!interaction.isCommand() && !interaction.isButton() && !interaction.isSelectMenu()) return;
		if(interaction.isButton() && interaction.customId === 'redeem'){
			const modal = new Modal()
			.setCustomId("modalReferral")
			.setTitle("Referral Code")
			.addComponents(
				new TextInputComponent()
					.setCustomId('referral')
					.setLabel("Enter your referral code")
					.setStyle("SHORT")
					.setRequired(true)
			)
			showModal(modal, {
				client: interaction.client, // Client to show the Modal through the Discord API.
				interaction: interaction, // Show the modal with interaction data.
			});
			return
		}else if (interaction.isButton()) {
			
			await interaction.deferReply({ephemeral:true});
			const [commandButton,targetUserId] = interaction.customId.split("_")
			if (commandButton.includes('boost') && interaction.user.id === targetUserId) {
				await interaction.editReply(BoostMessage.warningBoostYourself())
				return	
			}
			
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			let totalBoost 
			let isMoreThanOneMinute 
			switch (commandButton) {
				case "boostInactiveMember":
					PointController.addPoint(interaction.user.id,'boost')
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
					PointController.addPoint(interaction.user.id,'boost')
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
				case "claimReferral":
					if (interaction.user.id !== targetUserId) {
						await interaction.editReply("⚠️ Can't claim other people's referrals")
						return
					}
					const dataReferral = await ReferralCodeController.getReferrals(targetUserId)
					if (dataReferral) {
						if (dataReferral.allReferralAlreadyBeenRedeemed) {
							await interaction.editReply(ReferralCodeMessage.allReferralAlreadyBeenRedeemed())
						}else{
							const totalDaysThisCohort = await ReferralCodeController.getTotalDaysThisCohort(targetUserId)
							await interaction.editReply(ReferralCodeMessage.showReferralCode(targetUserId,dataReferral.referralCode,dataReferral.expired,totalDaysThisCohort))
							ReferralCodeController.updateIsClaimed(targetUserId)
						}
					}else{
						await interaction.editReply(ReferralCodeMessage.dontHaveReferralCode())
					}

					break;
				case "generateReferral":
					if (interaction.user.id !== targetUserId) {
						await interaction.editReply("⚠️ Can't claim other people's referrals")
						return
					}
					const referralCodes = ReferralCodeController.getActiveReferralCodeFromMessage(interaction.message.content)
					const expire = ReferralCodeController.getExpiredDateFromMessage(interaction.message.content)
					
					if (referralCodes.length > 0) {
						const files = []

						for (let i = 0; i < referralCodes.length; i++) {
							const referralCode = referralCodes[i];
							const buffer = await GenerateImage.referralTicket(referralCode,expire)
							const attachment = new MessageAttachment(buffer,`referral_ticket_${interaction.user.username}.png`)
							files.push(attachment)
						}
						interaction.editReply({
							content:'**Share this referral ticket to your friends.**',
							files
						})
					}else{
						interaction.editReply(ReferralCodeMessage.allReferralAlreadyBeenRedeemed())
					}
					
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

