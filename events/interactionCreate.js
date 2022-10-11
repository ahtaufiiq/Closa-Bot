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
const SoloModeMessage = require("../views/SoloModeMessage");
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
		}else if(interaction.isButton() && interaction.customId.includes('writeGoal')){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent()
					.setCustomId('project')
					.setLabel("Project Name")
					.setPlaceholder("Short project's name e.g: Design Exploration")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('goal')
					.setLabel("My goal is")
					.setPlaceholder("Write specific & measurable goal e.g: read 2 books")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('about')
					.setLabel("About Project")
					.setPlaceholder("Tell a bit about this project")
					.setStyle("LONG")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('shareProgressAt')
					.setLabel("Every day i'll share my progress at")
					.setPlaceholder("e.g 21.00")
					.setStyle("SHORT")
					.setRequired(true),
			)
			showModal(modal, {
				client: interaction.client, // Client to show the Modal through the Discord API.
				interaction: interaction, // Show the modal with interaction data.
			});
			return
		}else if(interaction.isButton() && interaction.customId.includes('editGoal')){
			const project = interaction.message.embeds[0].title
			const [
				{value:goal},
				{value:about},
				{value:shareProgressAt},
			] = interaction.message.embeds[0].fields
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent()
					.setCustomId('project')
					.setLabel("Project Name")
					.setDefaultValue(project)
					.setPlaceholder("Short project's name e.g: Design Exploration")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('goal')
					.setLabel("My goal is")
					.setDefaultValue(goal)
					.setPlaceholder("Write specific & measurable goal e.g: read 2 books")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('about')
					.setLabel("About Project")
					.setDefaultValue(about)
					.setPlaceholder("Tell a bit about this project")
					.setStyle("LONG")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('shareProgressAt')
					.setLabel(shareProgressAt)
					.setDefaultValue("21.00")
					.setPlaceholder("e.g 21.00")
					.setStyle("SHORT")
					.setRequired(true),
			)
			showModal(modal, {
				client: interaction.client, // Client to show the Modal through the Discord API.
				interaction: interaction, // Show the modal with interaction data.
			});
			return
		}else if (interaction.isButton()) {
			
			const [commandButton,targetUserId=interaction.user.id] = interaction.customId.split("_")
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
					notificationThreadTargetUser.send(SoloModeMessage.pickYourRole(targetUserId))
					await interaction.editReply(SoloModeMessage.replySuccessStartSoloMode(notificationThreadTargetUser.id))
					break;
				case "postGoal":
					const project = interaction.message.embeds[0].title
					const [
						{value:goal},
						{value:about},
						{value:shareProgressAt},
					] = interaction.message.embeds[0].fields
					await interaction.editReply(PartyMessage.postGoal({
						project,
						goal,
						about,
						shareProgressAt,
						user:interaction.user,
						coworkingTime:"Night",
						role:"Designer",
						dayLeft:19
					}))
					interaction.message.delete()

					notificationThreadTargetUser.send(`**You've already joined a party!**

Here is the link to your party & please say "hi" to the party
Join → https://discord.com/channels/blablabla/blablabla`)
					
					const channelGoals = ChannelController.getChannel(interaction.client,CHANNEL_GOALS)
					channelGoals.send(PartyMessage.postGoal({
						project,
						goal,
						about,
						shareProgressAt,
						user:interaction.user,
						coworkingTime:"Night",
						role:"Designer",
						dayLeft:19
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
					
					setTimeout(() => {
						notificationThreadTargetUser.send(PartyMessage.askUserWriteHighlight(targetUserId))
					}, 1000 * 60 * 15);
					// notificationThreadTargetUser.send(PartyMessage.settingReminderHighlight(targetUserId))
					break;
				case "roleDeveloper":
					await interaction.editReply(PartyMessage.pickYourGoalCategory("developer",targetUserId))
					interaction.message.delete()
					break;
				case "defaultReminder":
					await interaction.editReply(PartyMessage.replyDefaultReminder())
					break;
				case "customReminder":
					await interaction.editReply(PartyMessage.replyCustomReminder())
					break;
				case "roleDesigner":
					await interaction.editReply(PartyMessage.pickYourGoalCategory("designer",targetUserId))
					interaction.message.delete()
					break;
				case "roleCreator":
					await interaction.editReply(PartyMessage.pickYourGoalCategory("creator",targetUserId))
					interaction.message.delete()
					break;
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
			switch (commandMenu) {
				case "inactiveReply":
					notificationThreadTargetUser.send(BoostMessage.IamBack(targetUser.user,interaction.user,interaction.values[0]))
					await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
					break;
				case "goalCategory":
					await interaction.editReply(PartyMessage.askUserWriteGoal(19,targetUserId))
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

