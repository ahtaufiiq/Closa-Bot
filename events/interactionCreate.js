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
const { ROLE_TRIAL_MEMBER, CHANNEL_PARTY_ROOM, CHANNEL_GOALS, CHANNEL_REFLECTION, CHANNEL_TESTIMONIAL, CHANNEL_UPCOMING_SESSION } = require("../helpers/config");
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
const SickDayController = require("../controllers/SickDayController");
const TestimonialMessage = require("../views/TestimonialMessage");
const UserController = require("../controllers/UserController");
const MemeContestMessage = require("../views/MemeContestMessage");
const MemeController = require("../controllers/MemeController");
const CelebrationController = require("../controllers/CelebrationController");
const IntroController = require("../controllers/IntroController");
const DailyStreakController = require("../controllers/DailyStreakController");
const DailyStreakMessage = require("../views/DailyStreakMessage");
const FocusSessionController = require("../controllers/FocusSessionController");
const FocusSessionMessage = require("../views/FocusSessionMessage");
const CoworkingController = require("../controllers/CoworkingController");
const CoworkingMessage = require("../views/CoworkingMessage");
const InfoUser = require("../helpers/InfoUser");
module.exports = {
	name: 'interactionCreate',
	async execute(interaction,focusRoomUser) {
		try {
			if (!interaction.isCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;
			if (interaction.isButton()) {
				if(ReferralCodeController.showModalRedeem(interaction)) return
				if(PartyController.showModalCustomReminder(interaction)) return
				if(GoalController.showModalWriteGoal(interaction)) return
				if(GoalController.showModalEditGoal(interaction)) return 
				if(GoalController.showModalPreferredCoworkingTime(interaction)) return 
				if(VacationController.showModalCustomDate(interaction)) return
				if(RecurringMeetupController.showModalRescheduleMeetup(interaction)) return
				if(RecurringMeetupController.showModalExtendTime(interaction)) return
				if(TestimonialController.showModalSubmitTestimonial(interaction)) return
				if(TestimonialController.showModalCustomReply(interaction)) return
				if(WeeklyReflectionController.showModalWriteReflection(interaction)) return
				if(WeeklyReflectionController.showModalEditReflection(interaction)) return
				if(CelebrationController.showModalWriteCelebration(interaction)) return
				if(CelebrationController.showModalEditCelebration(interaction)) return
				if(BoostController.showModalPersonalBoost(interaction)) return
				if(IntroController.showModalWriteIntro(interaction)) return
				if(IntroController.showModalEditIntro(interaction)) return
				if(FocusSessionController.showModalAddNewProject(interaction)) return
				if(CoworkingController.showModalScheduleCoworking(interaction)) return
				if(CoworkingController.showModalEditCoworking(interaction)) return

				let [commandButton,targetUserId=interaction.user.id,value] = interaction.customId.split("_")
				if(targetUserId === 'null') targetUserId = interaction.user.id
				if(commandButton === 'buyOneVacationTicket'){
					await interaction.deferReply({ephemeral:true});
				}else if (commandButton === 'continueFocus' || commandButton === 'breakFiveMinute' || commandButton === 'breakFifteenMinute' || commandButton=== "postGoal" || commandButton.includes('Reminder') ||commandButton.includes('Time') || commandButton.includes('role') || commandButton === 'goalCategory'  || commandButton.includes('Meetup') || commandButton.includes('VacationTicket') || commandButton === "extendTemporaryVoice" || commandButton === 'confirmBuyRepairStreak') {
					await interaction.deferReply();
				}else{
					await interaction.deferReply({ephemeral:true});
				}

				if (commandButton.includes('boost') && interaction.user.id === targetUserId) {
					await interaction.editReply(BoostMessage.warningBoostYourself())
					return	
				}
				
				const targetUser = await MemberController.getMember(interaction.client,targetUserId)
				switch (commandButton) {
					case 'showGuidelineCoworking':
						interaction.editReply(CoworkingMessage.guidelineCoworking())
						break;
					case "cancelBookCoworking":
						const dataAttendance = await supabase.from("CoworkingAttendances")
							.select()
							.eq('UserId',interaction.user.id)
							.eq('EventId',value)
							.single()
						if (dataAttendance.body) {
							const channel = ChannelController.getChannel(interaction.client,CHANNEL_UPCOMING_SESSION)
							const threadCoworking = await ChannelController.getThread(channel,dataAttendance.body.EventId)
							const msg = await ChannelController.getMessage(threadCoworking,dataAttendance.body.id)
							supabase.from("CoworkingAttendances")
								.delete()
								.eq('id',dataAttendance.body.id)
								.then(data=>{
									CoworkingController.updateCoworkingMessage(interaction.message)
								})
							msg.delete()
							interaction.editReply("your schedule has been canceled.")
						}else{
							interaction.editReply("can't cancel the session you're not even booking.")
						}
						break;
					case "bookCoworking":
						if(targetUserId === interaction.user.id) return interaction.editReply("⚠️ Can't book your own coworking event")
						interaction.editReply("you're in ✅ ")
						const threadCoworking = await ChannelController.getThread(
							ChannelController.getChannel(interaction.client,CHANNEL_UPCOMING_SESSION),
							interaction.message.id
						)
						threadCoworking.send(`${interaction.user} will attend the session`)
							.then(msg=>{
								supabase.from("CoworkingAttendances")
									.insert({id:msg.id,UserId:interaction.user.id,EventId:interaction.message.id,avatarUrl:InfoUser.getAvatar(interaction.user)})
									.then(()=>{
										CoworkingController.updateCoworkingMessage(interaction.message)
									})
								CoworkingController.getCoworkingEvent(interaction.message.id)
									.then(data=>{
										const coworkingDate = new Date(data.body.time)
										CoworkingController.addReminderCoworkingEvent(coworkingDate,interaction.user.id,interaction.message.id)
									})
							})
						
						break;
					case "continueFocus":{
						if(targetUserId !== interaction.user.id) return interaction.editReply("You can't continue focus session someone else")
						const channel = await ChannelController.getChannel(interaction.client,interaction.channelId)
						const msgFocusOld = await ChannelController.getMessage(channel,focusRoomUser[targetUserId]?.msgIdFocusRecap)
						const dataFocusSession = await FocusSessionController.getDetailFocusSession(targetUserId)
						const taskName = dataFocusSession?.taskName
						const projectName = dataFocusSession?.Projects?.name
						focusRoomUser[targetUserId].msgIdReplyBreak = null
						focusRoomUser[targetUserId].breakCounter = 0
						focusRoomUser[targetUserId].isFocus = true
						ChannelController.deleteMessage(msgFocusOld)
						interaction.editReply(FocusSessionMessage.messageTimer(focusRoomUser[targetUserId],taskName,projectName,targetUserId))
							.then(msgFocus=>{
								FocusSessionController.countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,targetUserId)
								ChannelController.deleteMessage(interaction.message)
							})
						}break;
					case "breakFiveMinute":
					case "breakFifteenMinute":
						if(targetUserId !== interaction.user.id) return interaction.editReply("You can't break focus session someone else")
						let minute = commandButton === 'breakFiveMinute' ? 5 : 15
						focusRoomUser[targetUserId].isFocus = false
						focusRoomUser[targetUserId].breakCounter += minute
						const channel = await ChannelController.getChannel(interaction.client,interaction.channelId)
						const [msgFocusOld,replyBreak] = await Promise.all([
							ChannelController.getMessage(channel,focusRoomUser[targetUserId]?.msgIdFocusRecap),
							interaction.editReply(FocusSessionMessage.messageBreakTime(focusRoomUser[targetUserId]?.breakCounter,targetUserId))
						])
						focusRoomUser[targetUserId].msgIdReplyBreak = replyBreak.id
						const dataFocusSession = await FocusSessionController.getDetailFocusSession(targetUserId)
						const taskName = dataFocusSession?.taskName
						const projectName = dataFocusSession?.Projects?.name
						if(value === 'addBreak') {
							ChannelController.deleteMessage(interaction.message)
						}

						msgFocusOld.edit(FocusSessionMessage.messageTimer(focusRoomUser[targetUserId],taskName,projectName,targetUserId))
						const event = value ? `interaction_${replyBreak.id}`: 'interaction'
						FocusSessionController.countdownFocusSession(msgFocusOld,taskName,projectName,focusRoomUser,targetUserId,event)
						const intervalBreak = setInterval(() => {
							if(focusRoomUser[targetUserId]?.msgIdReplyBreak != replyBreak.id) return clearInterval(intervalBreak)
							if(focusRoomUser[targetUserId]?.breakCounter === 1) {
								clearInterval(intervalBreak)
								if(focusRoomUser[targetUserId]?.msgIdReplyBreak != replyBreak.id) return
								replyBreak.reply(FocusSessionMessage.reminderEndedBreak(targetUserId))
									.then(msg=>{
										focusRoomUser[targetUserId].msgIdReplyBreak = msg.id
										setTimeout(async () => {
											if(focusRoomUser[targetUserId]?.msgIdReplyBreak != msg.id) return 
											ChannelController.deleteMessage(msgFocusOld)
											msg.reply(FocusSessionMessage.messageTimer(focusRoomUser[targetUserId],taskName,projectName,targetUserId))
												.then(msgFocus=>{
													FocusSessionController.countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,targetUserId)
													ChannelController.deleteMessage(msg)
														.then(()=> focusRoomUser[targetUserId].msgIdReplyBreak = null)
												})
										}, Time.oneMinute());
										ChannelController.deleteMessage(replyBreak)
									})
							}else{
								interaction.editReply(FocusSessionMessage.messageBreakTime(focusRoomUser[targetUserId]?.breakCounter,targetUserId))
							}
						}, Time.oneMinute());
						break
					case "repairStreak":
						if(targetUserId !== interaction.user.id) return interaction.editReply("You can't repair streak someone else")
						const totalPoint = await UserController.getTotalPoint(interaction.user.id)
						if(totalPoint < 3500){
							interaction.editReply(DailyStreakMessage.notHaveEnoughPoint())
						}else{
							interaction.editReply(DailyStreakMessage.confirmationBuyRepairStreak(totalPoint,interaction.message.id))
						}
						break;
					case 'confirmBuyRepairStreak':
						const currentPoint = await UserController.getTotalPoint(interaction.user.id)
						if(currentPoint < 3500){
							interaction.editReply(DailyStreakMessage.notHaveEnoughPoint())
						}else{
							await UserController.incrementTotalPoints(-3500,interaction.user.id)
							const msgSuccessRepairStreak = await DailyStreakController.applyRepairStreak(interaction.client,interaction.user)
							interaction.editReply(msgSuccessRepairStreak)
							const msg = await ChannelController.getMessage(interaction.message.channel,value)
							msg.delete()
						}
						break;
					case 'cancelBuyRepairStreak':
						interaction.editReply("Transaction has been canceled.")
						break;
					case "upvoteMeme":
						if(interaction.user.id === targetUserId) {
							ChannelController.sendToNotification(interaction.client,MemeContestMessage.cannotVoteOwnMeme(interaction.user),interaction.user.id)
							return interaction.editReply(MemeContestMessage.cannotVoteOwnMeme(interaction.user))
						}

						const totalUpvoteToday = await MemeController.totalUpvoteToday(interaction.user.id)
						if(totalUpvoteToday === 5){
							ChannelController.sendToNotification(interaction.client,MemeContestMessage.upvoteLimit(interaction.user),interaction.user.id)
							return interaction.editReply(MemeContestMessage.upvoteLimit(interaction.user))
						}

						supabase.from('UpvoteMemes')
							.insert({
								id:`${value}_${interaction.user.id}`,
								upvoteDate:Time.getTodayDateOnly(),
								UserId:interaction.user.id,
								MemeId:Number(value),
							})
							.single()
							.then(data => {
								let message
								if(data?.error?.code === '23505'){
									message = MemeContestMessage.alreadyUpvoteMeme(interaction.user)
								}else{
									message = MemeContestMessage.upvoteSuccess(5 - totalUpvoteToday - 1,interaction.user)
								}
								ChannelController.sendToNotification(interaction.client,message,interaction.user.id)
								return interaction.editReply(message)
							})
						
						break;
					case "followGoal":
						if(interaction.user.id === targetUserId) return interaction.editReply(`**You can't follow your own goal.**`)
						const thread = await ChannelController.getThread(ChannelController.getChannel(interaction.client,CHANNEL_GOALS),interaction.message.id)
						const threadMembers = await thread.members.fetch()
						if(threadMembers.get(interaction.user.id)) return interaction.editReply(`**You already followed ${value}’s goal.**`)

						thread.send(`**${interaction.user} followed this project**`)
						interaction.editReply(`**You've successfully followed ${value}’s goal.**`)
						break;
					case "personalBoost":
						BoostController.interactionBoostInactiveMember(interaction,targetUser)
						break;
					case "boostInactiveMember":
						BoostController.interactionBoostInactiveMember(interaction,targetUser)
						break;
					case "boostBack":
						BoostController.interactionBoostBack(interaction,targetUser)
						break;
					case "joinPartyRoom":
						const dataJoinedParty = await PartyController.dataJoinedParty(interaction.user.id)
						if (dataJoinedParty) {
							ChannelController.sendToNotification(
								interaction.client,
								PartyMessage.alreadyJoinPartyRoom(interaction.user.id,dataJoinedParty.PartyRooms.msgId),
								interaction.user.id,
								dataJoinedParty.Users.notificationId
							)
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
							ChannelController.sendToNotification(
								interaction.client,
								GoalMessage.pickYourRole(interaction.user.id,`joinParty${value}`),
								targetUserId
							)
							const notificationId = await UserController.getNotificationId(targetUserId)
							await interaction.editReply(PartyMessage.replyCannotJoinPartyBeforeSetGoal(interaction.user.id,notificationId))
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
						ChannelController.sendToNotification(
							interaction.client,
							PartyMessage.replySuccessJoinParty(interaction.user.id,dataPartyRooms.body.msgId),
							interaction.user.id,
							notificationId
						)
						setTimeout(() => {
							ChannelController.sendToNotification(
								interaction.client,
								PartyMessage.reminderSetHighlightAfterJoinParty(interaction.user.id),
								interaction.user.id,
								notificationId
							)
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
								ChannelController.sendToNotification(
									interaction.client,
									GoalMessage.pickYourRole(targetUserId),
									targetUserId
								)
								const notificationId = await UserController.getNotificationId(targetUserId)
								await interaction.editReply(PartyMessage.replySuccessStartPartyMode(notificationId))
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
						GoalController.interactionStartProject(interaction,targetUserId)
						break;
					case "cancelReplaceGoal":
						await interaction.editReply(PartyMessage.cancelReplaceGoal(value))
						break;
					case "startProject":
						const alreadyHaveGoal = await GoalController.alreadyHaveGoal(interaction.user.id)
						if (alreadyHaveGoal) {
							interaction.editReply(PartyMessage.warningReplaceExistingGoal(interaction.user.id,"solo"))
						}else{
							GoalController.interactionStartProject(interaction,targetUserId)
						}
						break;
					case "defaultReminder":
						await PartyController.interactionSetDefaultReminder(interaction,value)
						ChannelController.sendToNotification(
							interaction.client,
							PartyMessage.endOfOnboarding(),
							targetUserId
						)
						break;
					case "noReminder":
						await interaction.editReply(PartyMessage.replyNoHighlightReminder())
						ChannelController.deleteMessage(interaction.message)
						ChannelController.sendToNotification(
							interaction.client,
							PartyMessage.endOfOnboarding(),
							targetUserId
						)
						break;
					case "claimReferral":
						ReferralCodeController.interactionClaimReferral(interaction,targetUserId)
						break;
					case "generateReferral":
						ReferralCodeController.interactionGenerateReferral(interaction,targetUserId)
						break;
					case "generateReferralCover":
						ReferralCodeController.interactionGenerateReferralCover(interaction,targetUserId)
						break;
					case "remindJoinNextCohort":
						PaymentController.setReminderJoinNextCohort(interaction.client,targetUserId)
						await interaction.editReply(PaymentMessage.replySetReminderJoinNextCohort())
						break;
					case "declineBuyVacationTicket":
						await interaction.editReply(VacationMessage.declineBuyVacationTicket())
						break;
					case "buyOneVacationTicket":
						await interaction.editReply(VacationMessage.confirmationBuyOneVacationTicket(interaction.user.id))
						break;
					case "confirmBuyOneVacationTicket":
						await VacationController.interactionBuyOneVacationTicket(interaction)
						break;
					case "shopVacation":
						await VacationController.interactionShopVacationTicket(interaction)
						break;
					case "cancelBuyTicket":
						await interaction.editReply(VacationMessage.cancelTransaction())
						ChannelController.deleteMessage(interaction.message)
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
					case "extendTemporaryVoice" :
						await interaction.editReply(RecurringMeetupMessage.optionExtendedTime(value))
						ChannelController.deleteMessage(interaction.message)
						break;
					case "extendSession" :
						const [voiceChanelId,extendTime] = value.split('-')
						RecurringMeetupController.updateExtendTime(+extendTime,voiceChanelId)
						await interaction.editReply(RecurringMeetupMessage.replyExtendTime())
						ChannelController.deleteMessage(interaction.message)
						break;
					case "cancelExtend":
						await interaction.editReply(RecurringMeetupMessage.cancelExtendTime())
						ChannelController.deleteMessage(interaction.message)
						break;
					case "shopSickTicket":
						SickDayController.interactionShopSickTicket(interaction)
						break;
					case "totalSickDay":
						SickDayController.interactionOptionSickTicket(interaction,value)
						break;
					case "buySickTicket":
						SickDayController.interactionBuySickTicket(interaction,value)
						break;
					case "postTestimonial":
						interaction.message.edit({
							content:interaction.message.content,
							components:[]
						})
						const testimonialUser = interaction.message.mentions.users.first()
						const channelTestimonial = ChannelController.getChannel(interaction.client,CHANNEL_TESTIMONIAL)
						const msgTestimonial = await channelTestimonial.send(interaction.message.content)
						ChannelController.createThread(msgTestimonial,`from ${testimonialUser.username}`)
						await interaction.editReply("Testimonial has been posted")
						break;
					default:
						await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
						break;
				}
			}else if(interaction.isStringSelectMenu()){
				
				const [commandMenu,targetUserId,value] = interaction.customId.split("_")
				if (commandMenu.includes('boost')) {
					await interaction.deferReply({ephemeral:true});
					if (interaction.user.id === targetUserId ) {
						await interaction.editReply(BoostMessage.warningReplyYourself())
						return	
					}
				}else if(commandMenu === 'buyVacationTicket'){
					await interaction.deferReply({ephemeral:true});
				}else if(commandMenu !== 'inactiveReply' && commandMenu !== 'selectDailyWorkTime' && commandMenu !== 'selectDailyWorkGoal' && commandMenu !== "selectProject"){
					await interaction.deferReply();
				}
				
				const targetUser = await MemberController.getMember(interaction.client,targetUserId)
				const valueMenu = interaction.values[0]
				switch (commandMenu) {
					case "selectDailyWorkGoal":
						if(interaction.user.id !== targetUserId) return interaction.reply({content:`**You can't select daily work time someone else.**`,ephemeral:true})

						if(valueMenu === 'custom'){
							GoalController.showModalCustomDailyWorkTime(interaction)
						}else {
							const [minWorkGoal,labelMenuWorkGoal] = valueMenu.split('_')
							await interaction.deferReply();
							supabase.from("Users")
								.update({dailyWorkTime:minWorkGoal})
								.eq('id',interaction.user.id)
								.then()
							interaction.editReply(GoalMessage.preferredCoworkingTime(interaction.user.id))
							ChannelController.deleteMessage(interaction.message)
						}
						break;
					case "selectDailyWorkTime":
						if(interaction.user.id !== targetUserId) return interaction.reply({content:`**You can't select daily work time someone else.**`,ephemeral:true})
						await interaction.deferReply();
						const [projectId,taskName] = value.split('-')
						const [min,labelMenu] = valueMenu.split('_')
						const data = await supabase.from("Users")
							.update({dailyWorkTime:min})
							.eq('id',interaction.user.id)
						interaction.editReply(FocusSessionMessage.successSetDailyWorkTime(labelMenu))
						FocusSessionController.insertFocusSession(interaction.user.id,taskName,projectId,interaction.channelId)

						await interaction.channel.send(FocusSessionMessage.startFocusSession(interaction.user))
						ChannelController.deleteMessage(interaction.message)
						break;
					case 'selectProject':
						if(interaction.user.id !== targetUserId)return interaction.reply({content:`**You can't select project someone else.**`,ephemeral:true})
						if(valueMenu === 'addNewProject'){
							FocusSessionController.showModalAddNewProject(interaction,`addNewProject_${targetUserId}_${value}`)
						}else{
							await interaction.deferReply();
							const dataUser  = await UserController.getDetail(interaction.user.id,'dailyWorkTime')
							if (dataUser.body?.dailyWorkTime) {
								FocusSessionController.insertFocusSession(interaction.user.id,value,valueMenu,interaction.channelId)
								const haveCoworkingEvent = await CoworkingController.haveCoworkingEvent(interaction.user.id)
								await interaction.editReply(FocusSessionMessage.startFocusSession(interaction.user,haveCoworkingEvent?.voiceRoomId))
							}else{
								await interaction.editReply(
									FocusSessionMessage.setDailyWorkTime(interaction.user.id,valueMenu,value)
								)
							}
							ChannelController.deleteMessage(interaction.message)
						}
						break;
					case 'boostPartyMember':
						if(valueMenu === interaction.user.id) return interaction.editReply(BoostMessage.warningBoostYourself())
						const {user} = await MemberController.getMember(interaction.client,valueMenu)
						const totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,user.id)
						ChannelController.sendToNotification(
							interaction.client,
							BoostMessage.sendBoostToInactiveMember(user,interaction.user,totalBoost),
							valueMenu
						)
						await interaction.editReply(BoostMessage.successSendBoost(user))
						break
					case "inactiveReply":
						if(valueMenu === 'personalBoost'){
							BoostController.showModalPersonalBoost(interaction)
						}else{
							await interaction.deferReply({ephemeral:true});
							ChannelController.sendToNotification(
								interaction.client,
								BoostMessage.IamBack(targetUser.user,interaction.user,valueMenu),
								targetUserId
							)
							await interaction.editReply(BoostMessage.successSendBoost(targetUser.user))
						}
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
		} catch (error) {
			ChannelController.sendError(error,`interaction create ${interaction?.user?.id}`)
		}
	},
};

