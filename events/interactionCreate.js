const BoostController = require("../controllers/BoostController");
const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const BoostMessage = require("../views/BoostMessage");
const PaymentMessage = require("../views/PaymentMessage");
const PaymentController = require("../controllers/PaymentController");
const PartyMessage = require("../views/PartyMessage");
const PartyController = require("../controllers/PartyController");
const supabase = require("../helpers/supabaseClient");
const LocalData = require("../helpers/LocalData");
const { CHANNEL_PARTY_MODE, ROLE_TRIAL_MEMBER, CHANNEL_PARTY_ROOM, CHANNEL_GOALS, CHANNEL_REFLECTION } = require("../helpers/config");
const RecurringMeetupController = require("../controllers/RecurringMeetupController");
const Time = require("../helpers/time");
const RecurringMeetupMessage = require("../views/RecurringMeetupMessage");
const schedule = require('node-schedule');
const GoalController = require("../controllers/GoalController");
const GoalMessage = require("../views/GoalMessage");
const VacationMessage = require("../views/VacationMessage");
const VacationController = require("../controllers/VacationController");
const TestimonialController = require("../controllers/TestimonialController");
const WeeklyReflectionMessage = require("../views/WeeklyReflectionMessage");
const WeeklyReflectionController = require("../controllers/WeeklyReflectionController");
module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (!interaction.isCommand() && !interaction.isButton() && !interaction.isSelectMenu()) return;

		if (interaction.isButton()) {
			if(ReferralCodeController.showModalRedeem(interaction)) return
			if(GoalController.showModalWriteGoal(interaction)) return
			if(GoalController.showModalEditGoal(interaction)) return 
			if(VacationController.showModalCustomDate(interaction)) return
			if(RecurringMeetupController.showModalRescheduleMeetup(interaction)) return
			if(TestimonialController.showModalSubmitTestimonial(interaction)) return
			if(WeeklyReflectionController.showModalWriteReflection(interaction)) return
			if(WeeklyReflectionController.showModalEditReflection(interaction)) return
			
			let [commandButton,targetUserId=interaction.user.id,value] = interaction.customId.split("_")
			if(targetUserId === 'null') targetUserId = interaction.user.id
			if (commandButton=== "postGoal" || commandButton.includes('Reminder') ||commandButton.includes('Time') || commandButton.includes('role') || commandButton === 'goalCategory'  || commandButton.includes('Meetup') || commandButton.includes('VacationTicket')) {
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
				case "joinPartyRoom":
					
					const dataJoinedParty = await PartyController.dataJoinedParty(interaction.user.id)
					if (dataJoinedParty) {
						const notificationThread = await ChannelController.getNotificationThread(interaction.client,interaction.user.id,dataJoinedParty.Users.notificationId)
						notificationThread.send(PartyMessage.alreadyJoinPartyRoom(interaction.user.id,dataJoinedParty.PartyRooms.msgId))
						await interaction.editReply(PartyMessage.alreadyJoinPartyRoom(interaction.user.id,dataJoinedParty.PartyRooms.msgId))
						return
					}
					const slotParty = await PartyController.checkSlotParty(value)
					if(slotParty.isFull){
						await interaction.editReply(PartyMessage.replyPartyIsFull())
						return
					}
					const isAlreadyHaveGoal = await GoalController.alreadyHaveGoal(interaction.user.id)

					if (isAlreadyHaveGoal) {
						await interaction.editReply(PartyMessage.confirmationJoinParty(interaction.user.id,value))
					}else{
						notificationThreadTargetUser.send(GoalMessage.pickYourRole(interaction.user.id,`joinParty${value}`))
						await interaction.editReply(PartyMessage.replyCannotJoinPartyBeforeSetGoal(interaction.user.id,notificationThreadTargetUser.id))
					}

					break
				case "leavePartyRoom":
					const dataMemberParty = await supabase.from("MemberPartyRooms")
						.select("partyId,PartyRooms(msgId)")
						.eq("UserId",interaction.user.id)
						.gte("endPartyDate",Time.getTodayDateOnly())
						.single()
					if (dataMemberParty.body) {
						if(dataMemberParty.body.partyId === Number(value)){
							await interaction.editReply(PartyMessage.confirmationLeaveParty(interaction.user.id,`${value}-${dataMemberParty.body.PartyRooms.msgId}`))
						}else{
							await interaction.editReply(PartyMessage.leaveOtherPartyRoom(dataMemberParty.body.PartyRooms.msgId))
						}
					}else{
						await interaction.editReply(PartyMessage.leaveBeforeJoinedParty())
					}
					break;
				case "acceptLeaveParty":
					const [partyNumber,msgId] = value.split('-')
					const threadParty = await ChannelController.getThread(interaction.channel,msgId)
					await PartyController.deleteUserFromParty(interaction.user.id,partyNumber)
					ChannelController.removeUserFromThread(interaction.client,CHANNEL_PARTY_ROOM,msgId,interaction.user.id)
					
					supabase.from("PartyRooms")
					.select("*,MemberPartyRooms(UserId)")
					.eq('id',partyNumber)
					.single()
					.then(async data=>{
						const members = data?.body?.MemberPartyRooms
						if(members.length === 3){
							setTimeout(async () => {
								const dataRecentUser = await PartyController.getRecentActiveUserInParty(members,interaction.user.id)
								if(dataRecentUser.body) threadParty.send(PartyMessage.remindSharePartyWhenSomeoneLeaveParty(dataRecentUser.body.UserId,msgId))
							}, 1000 * 60 * 5);
						}
					})
					threadParty.send(PartyMessage.userLeaveParty(interaction.user.id))
					PartyController.updateMessagePartyRoom(interaction.client,msgId,partyNumber)
					await interaction.editReply(PartyMessage.succesLeaveParty(partyNumber))

					PartyController.unfollowGoalAccountabilityPartner(interaction.client,partyNumber,interaction.user.id)
					break;
				case "declineLeaveParty":
					await interaction.editReply(PartyMessage.declineLeaveParty())
					break;
				case "declineJoinParty":
					await interaction.editReply(PartyMessage.replyCancelJoinParty())
					break;
				case "acceptJoinParty":
					let notificationId
					const data = await supabase.from("Users")
						.select('goalId,notificationId')
						.eq('id',interaction.user.id)
						.single()
					notificationId = data.body.notificationId
					await PartyController.addMemberPartyRoom(interaction.client,data.body?.goalId,value,interaction.user.id)
	
					const dataPartyRooms = await supabase.from("PartyRooms")
						.select("*,MemberPartyRooms(UserId,project,isLeader,isTrialMember)")
						.eq('id',value)
						.single()

					const channelParty = ChannelController.getChannel(interaction.client,CHANNEL_PARTY_ROOM)
					const threadPartyRoom = await ChannelController.getThread(channelParty,dataPartyRooms.body.msgId)
					threadPartyRoom.send(PartyMessage.userJoinedParty(interaction.user.id))
					
					PartyController.updateMessagePartyRoom(interaction.client,dataPartyRooms.body.msgId,value)
					await interaction.editReply(PartyMessage.replySuccessJoinParty(interaction.user.id,dataPartyRooms.body.msgId))
					const notificationThread = await ChannelController.getNotificationThread(interaction.client,interaction.user.id,notificationId)
					notificationThread.send(PartyMessage.replySuccessJoinParty(interaction.user.id,dataPartyRooms.body.msgId))
					setTimeout(() => {
						notificationThread.send(PartyMessage.reminderSetHighlightAfterJoinParty(interaction.user.id))
					}, 1000 * 60 * 15);

					PartyController.followGoalAccountabilityPartner(interaction.client,value,interaction.user.id,data.body?.goalId)
					break;
				case "joinPartyMode":{
					const alreadyHaveGoal = await GoalController.alreadyHaveGoal(interaction.user.id)
					if (alreadyHaveGoal) {
						interaction.editReply(PartyMessage.warningReplaceExistingGoal(interaction.user.id))
					}else{
						const data = await supabase.from('JoinParties')
							.select()
							.eq("UserId",interaction.user.id)
							.eq('cohort',PartyController.getNextCohort())
							.single()
						if (data.body) {
							await interaction.editReply(PartyMessage.alreadyJoinWaitingRoom())
						}else{
							notificationThreadTargetUser.send(GoalMessage.pickYourRole(targetUserId))
							await interaction.editReply(PartyMessage.replySuccessStartPartyMode(notificationThreadTargetUser.id))
							await supabase.from("JoinParties")
								.insert({
									UserId:interaction.user.id,
									cohort:PartyController.getNextCohort(),
								})
							PartyController.updateMessageWaitingRoom(interaction.client)
						}
					}}
					break;
				case "acceptConfirmationMeetup":
					RecurringMeetupController.interactionConfirmationAttendance(interaction,true,value)
					break;
				case "declineConfirmationMeetup":
					RecurringMeetupController.interactionConfirmationAttendance(interaction,false,value)
					break;
				case "attendMeetup":
					RecurringMeetupController.interactionConfirmationMeetup(interaction,true,value)
					break
				case "cannotAttendMeetup":
					RecurringMeetupController.interactionConfirmationMeetup(interaction,false,value)
					break;
				case "leaveWaitingRoom":
					await supabase.from("JoinParties")
						.delete()
						.eq("UserId",interaction.user.id)
						.eq("cohort",PartyController.getNextCohort())
					PartyController.updateMessageWaitingRoom(interaction.client)
					interaction.editReply("Success leave party")
					break;
				case "continueReplaceGoal":
					notificationThreadTargetUser.send(GoalMessage.pickYourRole(targetUserId,value))
					if (PartyController.isPartyMode(value)) {
						const data = await supabase.from('JoinParties')
						.select()
						.eq("UserId",interaction.user.id)
						.eq('cohort',PartyController.getNextCohort())
						.single()
						if (data.body) {
							await interaction.editReply(PartyMessage.replyAlreadyJoinWaitingRoom())
						}else{
							await interaction.editReply(PartyMessage.replySuccessStartPartyMode(notificationThreadTargetUser.id))
							await supabase.from("JoinParties")
								.insert({
									UserId:interaction.user.id,
									cohort:PartyController.getNextCohort(),
								})
							PartyController.updateMessageWaitingRoom(interaction.client)
						}
					}else{
						await interaction.editReply(PartyMessage.replySuccessStartSoloMode(notificationThreadTargetUser.id))
					}
					break;
				case "cancelReplaceGoal":
					await interaction.editReply(PartyMessage.cancelReplaceGoal(value))
					break;
				case "startSoloMode":
					const alreadyHaveGoal = await GoalController.alreadyHaveGoal(interaction.user.id)
					if (alreadyHaveGoal) {
						interaction.editReply(PartyMessage.warningReplaceExistingGoal(interaction.user.id,"solo"))
					}else{
						notificationThreadTargetUser.send(GoalMessage.pickYourRole(targetUserId,'solo'))
						await interaction.editReply(PartyMessage.replySuccessStartSoloMode(notificationThreadTargetUser.id))
					}
					break;
				case "postGoal":
					GoalController.interactionPostGoal(interaction,value)
					break;
				case "roleDeveloper":
					GoalController.interactionPickRole(interaction,'Developer',value)
					break;
				case "roleDesigner":
					GoalController.interactionPickRole(interaction,'Designer',value)
					break;
				case "roleCreator":
					GoalController.interactionPickRole(interaction,'Creator',value)
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
				case "declineBuyVacationTicket":
					await interaction.editReply(VacationMessage.declineBuyVacationTicket())
					break;
				case "buyOneVacationTicket":
					await VacationController.interactionBuyOneVacationTicket(interaction)
					break;
				case "shopVacation":
					await VacationController.interactionShopVacationTicket(interaction)
					break;
				case "cancelBuyTicket":
					await interaction.editReply(VacationMessage.cancelTransaction())
					break;
				case "continueBuyTicket":
					await VacationController.interactionShopVacationTicket(interaction)
					break;
				case "confirmBuyTicket":
					await interaction.editReply(VacationMessage.confirmationWhenToUseTicket(interaction.user.id,value))
					break;
				case "useTicketToday":
					await VacationController.interactionBuyTicketViaShop(interaction,Number(value),Time.getTodayDateOnly())
					break;
				case "useTicketTomorrow":
					await VacationController.interactionBuyTicketViaShop(interaction,Number(value),Time.getTomorrowDateOnly())
					break;
				case "joinWeeklyReflection":
					await interaction.editReply(WeeklyReflectionMessage.replySuccessJoinReflection(notificationThreadTargetUser.id))
					break;
				case "submitReflection":
					if(!WeeklyReflectionController.isRangeWeeklyReflection()) {
						await interaction.editReply(WeeklyReflectionMessage.replySubmissionClosed())
						return interaction.message.delete()
					}
					const dataUser = await supabase
					.from('Users')
					.select()
					.eq('id',interaction.user.id)
					.single()

					let projectName = null
					if (dataUser.body?.goalId) {
						const channel = ChannelController.getChannel(interaction.client,CHANNEL_GOALS)
						const thread = await ChannelController.getThread(channel,dataUser.body.goalId)
						projectName = thread.name.split('by')[0]
					}
					const channelReflection = ChannelController.getChannel(interaction.client,CHANNEL_REFLECTION)
					const {highlight,lowlight,actionPlan,note} = WeeklyReflectionController.getDataReflectionFromMessage(interaction.message)
					const msg = await channelReflection.send({
						embeds:[
							WeeklyReflectionMessage.embedMessageReflection({
								projectName,highlight,lowlight,actionPlan,note,
								user:interaction.user
							})
						]
					})
					PartyController.notifyMemberPartyShareReflection(interaction.client,interaction.user.id,msg.id)
					ChannelController.createThread(msg,`Reflection by ${interaction.user.username}`)
					const dataPoint = await supabase.from("Users")
						.select('totalPoint')
						.eq('id',targetUserId)
						.single()
					const totalPoint = Number(dataPoint.body.totalPoint) + 100
					supabase.from("Users")
						.update({totalPoint})
						.eq('id',targetUserId)
						.then()
					WeeklyReflectionController.addReflection({highlight,lowlight,actionPlan,note,UserId:targetUserId})
					await interaction.editReply(WeeklyReflectionMessage.replySuccessSubmitReflection(totalPoint))
					interaction.message.delete()
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
			}else if(commandMenu === 'buyVacationTicket'){
				await interaction.deferReply({ephemeral:true});
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
					GoalController.interactionPickGoalCategory(interaction,valueMenu)
					break;
				case "buyVacationTicket":
					VacationController.interactionSelectOptionVacationTicket(interaction,valueMenu)
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

