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
const { ROLE_TRIAL_MEMBER, CHANNEL_PARTY_ROOM, CHANNEL_GOALS, CHANNEL_REFLECTION, CHANNEL_TESTIMONIAL, CHANNEL_UPCOMING_SESSION, CHANNEL_ACHIEVEMENTS } = require("../helpers/config");
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
const ReminderController = require("../controllers/ReminderController");
const MessageComponent = require("../helpers/MessageComponent");
const { ButtonStyle, AttachmentBuilder } = require("discord.js");
const OnboardingController = require("../controllers/OnboardingController");
const OnboardingMessage = require("../views/OnboardingMessage");
const GuidelineInfoController = require("../controllers/GuidelineInfoController");
const AchievementBadgeMessage = require("../views/AchievementBadgeMessage");
const AdvanceReportController = require("../controllers/AdvanceReportController");
const GenerateImage = require("../helpers/GenerateImage");
const AdvanceReportMessage = require("../views/AdvanceReportMessage");
const RedisController = require("../helpers/RedisController");
const MessageFormatting = require("../helpers/MessageFormatting");
const DiscordWebhook = require("../helpers/DiscordWebhook");
const TodoReminderMessage = require("../views/TodoReminderMessage");
module.exports = {
	name: 'interactionCreate',
	async execute(interaction,focusRoomUser,listFocusRoom) {
		try {
			if (!interaction.isCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;
			if (interaction.isButton()) {
				if(ReferralCodeController.showModalRedeem(interaction)) return
				// if(PartyController.showModalCustomReminder(interaction)) return
				if(GoalController.showModalWriteGoal(interaction)) return
				if(GoalController.showModalEditGoal(interaction)) return 
				if(GoalController.showModalPreferredCoworkingTime(interaction)) return 
				if(GoalController.showModalStartNewProject(interaction)) return 
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
				if(FocusSessionController.showModalSettingBreakReminder(interaction)) return
				if(CoworkingController.showModalScheduleCoworking(interaction)) return
				if(CoworkingController.showModalEditCoworking(interaction)) return
				if(CoworkingController.showModalEditQuickRoom(interaction)) return
				if(ReminderController.showModalSetHighlightReminder(interaction)) return
				if(OnboardingController.showModalReminderCoworking(interaction)) return

				let [commandButton,targetUserId=interaction.user.id,value] = interaction.customId.split("_")
				if(targetUserId === 'null') targetUserId = interaction.user.id
				if(commandButton === 'buyOneVacationTicket' || commandButton === 'settingFocusTimer' || commandButton === 'claimReward' || commandButton === 'inviteQuickRoom'){
					await interaction.deferReply({ephemeral:true});
				}else if (commandButton === 'verifyDM' || commandButton === 'continueFocus' || commandButton === 'startOnboarding' || commandButton === 'remindOnboardingAgain' || commandButton === 'startOnboardingLater' || commandButton === 'assignNewHost' || commandButton === 'breakFiveMinute' || commandButton === 'breakFifteenMinute' || commandButton=== "postGoal" || commandButton.includes('Reminder') ||commandButton.includes('Time') || commandButton.includes('role') || commandButton === 'goalCategory'  || commandButton.includes('Meetup') || commandButton.includes('VacationTicket') || commandButton === "extendTemporaryVoice" || commandButton === 'confirmBuyRepairStreak') {
					await interaction.deferReply();
				}else if(commandButton !== 'advanceReport'){
					await interaction.deferReply({ephemeral:true});
				}

				if (commandButton.includes('boost') && interaction.user.id === targetUserId) {
					await interaction.editReply(BoostMessage.warningBoostYourself())
					return	
				}
				
				const targetUser = interaction.user.id === targetUserId ? interaction.user : await MemberController.getMember(interaction.client,targetUserId)
				switch (commandButton) {
					case "changeThumbnail":{
						if(targetUserId !== interaction.user.id) return interaction.editReply("You can't generate advance report thumbnail of someone else")
						const [dateRange,position] = value.split('|')
						const dataThumbnailWeeklyReport = await AdvanceReportController.getDataWeeklyReport(targetUserId,dateRange)
						const thumbnail = await GenerateImage.thumbnailAdvanceReport(interaction.user,dataThumbnailWeeklyReport,dateRange,position)
						const thumbnailReportFiles = [
							new AttachmentBuilder(thumbnail,{name:`thumbnail_advance_report_${interaction.user.username}.png`})
						]
						await interaction.editReply(AdvanceReportMessage.thumbnailReport(interaction.user.id,thumbnailReportFiles,dateRange,position))
						break;
					}case "generateThumbnailAdvanceReport":
						if(targetUserId !== interaction.user.id) return interaction.editReply("You can't generate advance report thumbnail of someone else")
						const dataThumbnailWeeklyReport = await AdvanceReportController.getDataWeeklyReport(targetUserId,value)
						const thumbnail = await GenerateImage.thumbnailAdvanceReport(interaction.user,dataThumbnailWeeklyReport,value,2)
						const thumbnailReportFiles = [
							new AttachmentBuilder(thumbnail,{name:`thumbnail_advance_report_${interaction.user.username}.png`})
						]
						await interaction.editReply(AdvanceReportMessage.thumbnailReport(interaction.user.id,thumbnailReportFiles,value))
						break;
					case "lastWeek":{
						if(targetUserId !== interaction.user.id) return interaction.editReply("You can't generate advance report of someone else")
						const dateRange = AdvanceReportController.getWeekDateRange(-1)
						const dataWeeklyReport = await AdvanceReportController.getDataWeeklyReport(targetUserId,dateRange)
						if(dataWeeklyReport){
							const bufferImage = await GenerateImage.advanceCoworkingReport(interaction.user,dataWeeklyReport,dateRange)
							const weeklyReportFiles = [new AttachmentBuilder(bufferImage,{name:`advance_report_${interaction.user.username}.png`})]
							await interaction.message.edit(AdvanceReportMessage.onlyReport(interaction.user.id,weeklyReportFiles,dateRange,'lastWeek'))
							interaction.editReply('changed to **last week** ✅')
						}else{
							interaction.editReply(AdvanceReportMessage.emptyLastWeekReport(interaction.user.id))
						}
						break;
					}case "thisWeek":{
						if(targetUserId !== interaction.user.id) return interaction.editReply("You can't generate advance report of someone else")
						const dateRange = AdvanceReportController.getWeekDateRange()
						const dataWeeklyReport = await AdvanceReportController.getDataWeeklyReport(targetUserId,dateRange)
						const bufferImage = await GenerateImage.advanceCoworkingReport(interaction.user,dataWeeklyReport)
						const weeklyReportFiles = [new AttachmentBuilder(bufferImage,{name:`advance_report_${interaction.user.username}.png`})]
						await interaction.message.edit(AdvanceReportMessage.onlyReport(interaction.user.id,weeklyReportFiles,AdvanceReportController.getWeekDateRange(),'thisWeek'))
						interaction.editReply('changed to **this week** ✅')
						break;
					}case "advanceReport":
						if(targetUserId !== interaction.user.id) return interaction.reply({content:"You can't generate advance report of someone else",ephemeral:true})
						await interaction.deferReply();
						const dataWeeklyReport = await AdvanceReportController.getDataWeeklyReport(targetUserId,value)
						const bufferImage = await GenerateImage.advanceCoworkingReport(interaction.user,dataWeeklyReport)
						const weeklyReportFiles = [new AttachmentBuilder(bufferImage,{name:`advance_report_${interaction.user.username}.png`})]
						await interaction.editReply(AdvanceReportMessage.onlyReport(interaction.user.id,weeklyReportFiles,value,'thisWeek'))
						interaction.message.edit({components:[]})
						break;
					case "verifyDM":
						if(targetUserId !== interaction.user.id) return interaction.editReply("⚠️ Can't verify DM someone else")
						try {
							const msg = await interaction.user.send(OnboardingMessage.successVerifyDM(interaction.user))
							UserController.updateData({DMChannelId:msg.channelId},targetUserId)
							interaction.editReply(OnboardingMessage.replySuccessActivateDM())
							ChannelController.deleteMessage(interaction.message)
						} catch (error) {
							interaction.editReply(OnboardingMessage.replyFailedActivateDM())
							GuidelineInfoController.incrementTotalNotification(1,targetUserId)
						}
						break
					case "checkyMyNotif":
						const myNotificationId = await UserController.getNotificationId(interaction.user.id)
						await interaction.editReply(`here's your notification → ${MessageFormatting.linkToInsideThread(myNotificationId)}`)			
						break;
					case "guidelineQuickRoom":
						interaction.editReply(CoworkingMessage.guidelineQuickRoom())
						break;
					case "howToStartQuickRoom":
						interaction.editReply(CoworkingMessage.replyHowToStartQuickRoom())
						break
					case "inviteQuickRoom":
						interaction.channel.createInvite({
							maxAge:86_400,
							unique:true,
						}).then(async invite=>{
							const dataUser = await UserController.getDetail(interaction.user.id,'totalInvite')
							const totalInvite = dataUser.body.totalInvite
							RedisController.set(`invite_${invite.code}`,interaction.user.id,86_400)
							interaction.editReply(CoworkingMessage.shareInviteQuickRoom(invite.code,totalInvite))
						})
						break
					case "claimReward":
						const inviteLink = await ReferralCodeController.generateInviteLink(interaction.client,targetUserId)
						await interaction.editReply(AchievementBadgeMessage.howToClaimReward(targetUserId,value,inviteLink))
						break;
					case "settingDailyGoal":
						interaction.editReply(GoalMessage.setDailyWorkTime(interaction.user.id,true))
						break;
					case 'settingFocusTimer':
						interaction.editReply(FocusSessionMessage.settings(focusRoomUser[interaction.user.id]?.breakReminder||50))
						break;
					case "onboardingFromGuideline":
						const dataOnboarding = await supabase.from("GuidelineInfos")
							.select('statusCompletedQuest,Users(onboardingStep)')
							.eq('UserId',interaction.user.id)
							.single()
						if(dataOnboarding.body){
							const {statusCompletedQuest,Users:{onboardingStep}} = dataOnboarding.body
							if(onboardingStep === 'done' || onboardingStep === null){
								interaction.editReply("You've completed your onboarding quest previously ✅ ")
							}else{
								interaction.editReply(OnboardingMessage.guidelineInfoQuest(interaction.user.id,onboardingStep,statusCompletedQuest,true))
							}
						}else{
							interaction.editReply('redeem your referral code')
						}
						break;
					case 'replySecondQuest':
						await interaction.editReply(OnboardingMessage.replySecondQuest(interaction.user.id))
						break;
					case 'replyThirdQuest':
						await interaction.editReply(OnboardingMessage.replyThirdQuest())
						break;
					case 'continueFirstQuest':
						await interaction.editReply(OnboardingMessage.firstQuest(interaction.user.id))
						if(value !== 'guideline') ChannelController.deleteMessage(interaction.message)
						break;
					case 'continueSecondQuest':
						await interaction.editReply(OnboardingMessage.secondQuest(interaction.user.id))
						if(value !== 'guideline') ChannelController.deleteMessage(interaction.message)
						break;
					case 'continueThirdQuest':
						await interaction.editReply(OnboardingMessage.thirdQuest(interaction.user.id))
						if(value !== 'guideline') ChannelController.deleteMessage(interaction.message)
						break;
					case 'startOnboarding':
						OnboardingController.startOnboarding(interaction)
						break;
					case 'remindOnboardingAgain':
						await interaction.editReply(OnboardingMessage.remindOnboardingAgain())
						ChannelController.deleteMessage(interaction.message)
						break
					case 'startOnboardingLater':
						OnboardingController.onboardingLater(interaction)
						break;
					case 'startCoworkingRoom':
						const coworkingEvent = await CoworkingController.getCoworkingEvent(value)
						if(coworkingEvent.body?.HostId !== interaction.user.id) return await interaction.editReply('⚠️ only host can start room timer')
						if(!CoworkingController.isValidToStartCoworkingTimer(focusRoomUser,interaction.user.id)){
							return await interaction.editReply(CoworkingMessage.cannotStartTimer())
						}
						await interaction.message.edit({
							components:[MessageComponent.createComponent(
								MessageComponent.addEmojiButton('showGuidelineCoworking','Learn more','💡',ButtonStyle.Secondary)
							)]
						})
						CoworkingController.handleStartCoworkingTimer(interaction,listFocusRoom)
						
						interaction.editReply('room timer just started')
						focusRoomUser[interaction.user.id].firstTimeCoworkingTimer = false
						break
					case 'assignNewHost':
						let minuteToHost = 5
						await CoworkingController.updateHostId(interaction.user.id,value)
						const msgNewHost = await interaction.editReply(CoworkingMessage.selectedNewHostCoworking(interaction.user.id,minuteToHost))
						const countdownNewHost = setInterval(async () => {
							minuteToHost--
							const coworkingEventIsLive = await CoworkingController.coworkingEventIsLive(value)
							if(coworkingEventIsLive){
								ChannelController.deleteMessage(msgNewHost)
								return clearInterval(countdownNewHost)
							}
							msgNewHost.edit(CoworkingMessage.selectedNewHostCoworking(interaction.user.id,minuteToHost))
							if(minuteToHost === 0){
								const event = await CoworkingController.getCoworkingEvent(value)
								const {id,voiceRoomId} = event.body
								const voiceRoom = ChannelController.getChannel(interaction.client,voiceRoomId)
								if(voiceRoom) voiceRoom.delete()
								const channelUpcomingSession = ChannelController.getChannel(interaction.client,CHANNEL_UPCOMING_SESSION)
								const msgEvent = await ChannelController.getMessage(channelUpcomingSession,id)
								if(msgEvent) msgEvent.delete()
								const threadEvent = await ChannelController.getThread(channelUpcomingSession,id)
								if(threadEvent) threadEvent.delete()
							}
						}, Time.oneMinute());
						ChannelController.deleteMessage(interaction.message)
						break;
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
								.then(()=>{
									CoworkingController.updateCoworkingMessage(interaction.message)
								})
							msg.delete()
							interaction.editReply("your schedule has been canceled.")
						}else{
							const dataHost = await supabase.from("CoworkingEvents")
							.select()
							.eq('HostId',interaction.user.id)
							.eq('id',value)
							.single()
							if(dataHost.body){
								supabase.from("CoworkingEvents")
									.delete()
									.eq('id',dataHost.body.id)
									.then()
								const channel = ChannelController.getChannel(interaction.client,CHANNEL_UPCOMING_SESSION)
								const msg = await ChannelController.getMessage(channel,dataHost.body.id)
								ChannelController.deleteMessage(msg)
								interaction.editReply("your schedule has been canceled.")
								if(dataHost.body.voiceRoomId){
									ChannelController.getChannel(interaction.client,dataHost.body.voiceRoomId).delete()
								}
							}else{
								interaction.editReply("can't cancel the session you're not even booking.")
							}
						}
						break;
					case "bookCoworking":
						if(targetUserId === interaction.user.id) return interaction.editReply("⚠️ Can't book your own coworking event")
						const isAlreadyBookCoworkingEvent = await CoworkingController.isAlreadyBookCoworkingEvent(interaction.user.id,interaction.message.id)
						if(isAlreadyBookCoworkingEvent) return interaction.editReply('you already booked this event')
						interaction.editReply("you're in ✅ ")
						const threadCoworking = await ChannelController.getThread(
							ChannelController.getChannel(interaction.client,CHANNEL_UPCOMING_SESSION),
							interaction.message.id
						)
						supabase.from("CoworkingEvents")
							.select('voiceRoomId')
							.eq('id',interaction.message.id)
							.single()
							.then(data=>{
								let {voiceRoomId} = data.body
								if(voiceRoomId){
									CoworkingController.updateFocusRoom(interaction.client,interaction.user,voiceRoomId)
								}
							})
						threadCoworking.send(`${interaction.user} will attend the session`)
							.then(msg=>{
								supabase.from("CoworkingAttendances")
									.insert({id:msg.id,UserId:interaction.user.id,EventId:interaction.message.id,avatarUrl:InfoUser.getAvatar(interaction.user)})
									.then(()=>{
										CoworkingController.updateCoworkingMessage(interaction.message)
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
								FocusSessionController.updateMessageFocusTimerId(targetUserId,msgFocus.id)
								FocusSessionController.countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,targetUserId)
								ChannelController.deleteMessage(interaction.message)
							})
						}break;
					case "breakFiveMinute":
					case "breakFifteenMinute":
						if(targetUserId !== interaction.user.id) return interaction.editReply("You can't break focus session someone else")
						let minute = commandButton === 'breakFiveMinute' ? 5 : 15
						if(focusRoomUser[targetUserId]){
							focusRoomUser[targetUserId].isFocus = false
							focusRoomUser[targetUserId].breakCounter += minute
							if(focusRoomUser[targetUserId].msgIdSmartBreakReminder){
								const msgSmartReminder = await ChannelController.getMessage(
									interaction.channel,
									focusRoomUser[targetUserId].msgIdSmartBreakReminder
								)
								if(value !== 'smartBreak') ChannelController.deleteMessage(msgSmartReminder)
								delete focusRoomUser[targetUserId].msgIdSmartBreakReminder
							}
						}else{
							DiscordWebhook.sendError('focusRoomUser Undefined ' + targetUserId,JSON.stringify(focusRoomUser[targetUserId],null,2))
						}
						const channel = await ChannelController.getChannel(interaction.client,interaction.channelId)
						const [msgFocusOld,replyBreak] = await Promise.all([
							ChannelController.getMessage(channel,focusRoomUser[targetUserId]?.msgIdFocusRecap),
							interaction.editReply(FocusSessionMessage.messageBreakTime(focusRoomUser[targetUserId]?.breakCounter,targetUserId))
						])
						focusRoomUser[targetUserId].msgIdReplyBreak = replyBreak.id
						const dataFocusSession = await FocusSessionController.getDetailFocusSession(targetUserId)
						const taskName = dataFocusSession?.taskName
						const projectName = dataFocusSession?.Projects?.name
						if(value === 'addBreak' || value === 'smartBreak') {
							ChannelController.deleteMessage(interaction.message)
						}

						msgFocusOld.edit(FocusSessionMessage.messageTimer(focusRoomUser[targetUserId],taskName,projectName,targetUserId))
						const event = value ? `interaction_${replyBreak.id}`: 'interaction'
						FocusSessionController.countdownFocusSession(msgFocusOld,taskName,projectName,focusRoomUser,targetUserId,event)
						const intervalBreak = setInterval(() => {
							if(!focusRoomUser[targetUserId]) {
								clearInterval(intervalBreak)
								ChannelController.deleteMessage(replyBreak)
							}
							if(focusRoomUser[targetUserId]?.msgIdReplyBreak != replyBreak.id) return clearInterval(intervalBreak)
							if(focusRoomUser[targetUserId]?.breakCounter === 1) {
								clearInterval(intervalBreak)
								if(focusRoomUser[targetUserId]?.msgIdReplyBreak != replyBreak.id) return
								replyBreak.reply(FocusSessionMessage.reminderEndedBreak(targetUserId))
									.then(msg=>{
										focusRoomUser[targetUserId].msgIdReplyBreak = msg.id
										setTimeout(async () => {
											if(!focusRoomUser[targetUserId]) return ChannelController.deleteMessage(msg)
											if(focusRoomUser[targetUserId]?.msgIdReplyBreak != msg.id) return 
											ChannelController.deleteMessage(msgFocusOld)
											msg.reply(FocusSessionMessage.messageTimer(focusRoomUser[targetUserId],taskName,projectName,targetUserId))
												.then(msgFocus=>{
													FocusSessionController.updateMessageFocusTimerId(targetUserId,msgFocus.id)
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
						const isSixWeekChallenge = !!value
						GoalController.interactionStartProject(interaction,targetUserId,isSixWeekChallenge)
						break;
					case "cancelReplaceGoal":
						await interaction.editReply(PartyMessage.cancelReplaceGoal(value))
						break;
					case "startProject":
						const alreadyHaveGoal = await GoalController.alreadyHaveGoal(interaction.user.id)
						if (alreadyHaveGoal) {
							interaction.editReply(PartyMessage.warningReplaceExistingGoal(interaction.user.id))
						}else{
							GoalController.interactionStartProject(interaction,targetUserId)
						}
						break;
					case "start6WIC":
						GoalController.alreadyHaveGoal(interaction.user.id)
							.then(alreadyHaveGoal=>{
								if (alreadyHaveGoal) {
									interaction.editReply(PartyMessage.warningReplaceExistingGoal(interaction.user.id,true))
								}else{
									GoalController.interactionStartProject(interaction,targetUserId,true)
								}
							})
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
						const channelAchievements = ChannelController.getChannel(interaction.client,CHANNEL_ACHIEVEMENTS)
						await interaction.editReply("Testimonial has been posted")
						if(value){
							const [type,achievement] = value.split('-')
							const {point} = AchievementBadgeMessage.achievementBadgePoint()[type][achievement]
							await UserController.incrementTotalPoints(+point,targetUserId)
							const dataUser = await UserController.getDetail(targetUserId,'totalPoint')
							const totalPoint = dataUser.body.totalPoint
							ChannelController.sendToNotification(
								interaction.client,
								AchievementBadgeMessage.approvedCelebration(targetUserId,type,achievement,totalPoint),
								targetUserId
							)
							const embeds = type ==='coworkingTime' ? AchievementBadgeMessage.embedAchievementCoworkingTime(achievement)
									: type === 'coworkingStreak' ? AchievementBadgeMessage.embedAchievementCoworkingStreak(achievement)
									: AchievementBadgeMessage.embedAchievementProgressStreak(achievement)

							const msgTestimonial = await channelAchievements.send({
								content:interaction.message.content,
							})
							 
							const thread = await ChannelController.createThread(msgTestimonial,`milestone by ${testimonialUser.username}`)
							// const thread = await ChannelController.getThread(
							// 	ChannelController.getChannel(interaction.client,msgTestimonial.channelId),
							// 	msgTestimonial.id
							// )
							await thread.send({embeds})
							thread.setArchived(true)
						}else{
							const msgTestimonial = await channelAchievements.send(interaction.message.content)
							ChannelController.createThread(msgTestimonial,`from ${testimonialUser.username}`,true)
						}
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
				}else if(commandMenu === 'buyVacationTicket' || commandMenu === 'searchProject'){
					await interaction.deferReply({ephemeral:true});
				}else if(commandMenu !== 'inactiveReply' && commandMenu !== 'setReminderShareProgress' && commandMenu !== 'setDeadlineProject' && commandMenu !== 'setDailyWorkTime' && commandMenu !== 'selectDailyWorkTime' && commandMenu !== 'selectDailyWorkGoal' && commandMenu !== "selectProject" && commandMenu !== 'selectPreferredCoworkingTime'){
					await interaction.deferReply();
				}
				
				const targetUser = await MemberController.getMember(interaction.client,targetUserId)
				const valueMenu = interaction.values[0]
				switch (commandMenu) {
					case "searchProject":
						interaction.editReply(`Here's the project history → ${MessageFormatting.linkToInsideThread(valueMenu)}`)
						break;
					case "setDeadlineProject":
						if(interaction.user.id !== targetUserId) return interaction.reply({content:`**You can't set deadline project for someone else.**`,ephemeral:true})
						if(valueMenu === 'custom'){
							GoalController.showModalDeadlineProject(interaction)
						}else{
							await interaction.deferReply()
							const isSixWeekChallenge = !!value
							await interaction.editReply(GoalMessage.startNewProject(interaction.user.id,valueMenu,isSixWeekChallenge))
							ChannelController.deleteMessage(interaction.message)
						}
						break
					case 'setReminderShareProgress':
						if(interaction.user.id !== targetUserId) return interaction.reply({content:`**You can't set a reminder for someone else.**`,ephemeral:true})
						if(valueMenu === 'custom'){
							GoalController.showModalReminderShareProgress(interaction)
						}else{
							await GoalController.interactionSetReminderShareProgress(interaction,valueMenu)
						}
						break;
					case 'selectPreferredCoworkingTime':
						if(interaction.user.id !== targetUserId) return interaction.reply({content:`**You can't select preferred daily coworking time someone else.**`,ephemeral:true})
						if(valueMenu === 'custom'){
							GoalController.showModalPreferredCoworkingTime(interaction)
						}else{
							await interaction.deferReply()
							let preferredCoworkingTime = valueMenu
							try {
								if(preferredCoworkingTime){
									const date = Time.getDate()
									const [hours,minutes] = preferredCoworkingTime.split(/[.:]/)
									date.setHours(hours ,minutes-30)
									const time = `${date.getHours()}.${date.getMinutes()}`
									
									ReminderController.setHighlightReminder(interaction.client,time,interaction.user.id)
									supabase.from("Users")
										.update({preferredCoworkingTime})
										.eq('id',interaction.user.id)
										.then()
								}
								
								const isSixWeekChallenge = !!value
								await interaction.editReply(GoalMessage.setReminderShareProgress(interaction.user.id,isSixWeekChallenge))
								ChannelController.deleteMessage(interaction.message)
							} catch (error) {
								DiscordWebhook.sendError(error,`${modal.user.id} ${coworkingTime}`)
							}
						}
						break;
					case 'setDailyWorkTime':
						if(valueMenu === 'custom'){
							GoalController.showModalCustomDailyWorkTime(interaction)
						}else {
							await interaction.deferReply({ephemeral:true});
							const [minWorkGoal,labelMenuWorkGoal] = valueMenu.split('_')
							AdvanceReportController.updateDataWeeklyGoal(minWorkGoal,interaction.user.id)
							UserController.updateData({dailyWorkTime:minWorkGoal},interaction.user.id)
							if(focusRoomUser[interaction.user.id]) focusRoomUser[interaction.user.id].dailyWorkTime = +minWorkGoal
							interaction.editReply(FocusSessionMessage.successSetDailyWorkTime(minWorkGoal))
						}
						break;
					case "selectDailyWorkGoal":
						if(interaction.user.id !== targetUserId) return interaction.reply({content:`**You can't select daily work time someone else.**`,ephemeral:true})
						const isSixWeekChallenge = !!value
						if(valueMenu === 'custom'){
							GoalController.showModalCustomDailyWorkTime(interaction)
						}else {
							const [minWorkGoal,labelMenuWorkGoal] = valueMenu.split('_')
							await interaction.deferReply();
							AdvanceReportController.updateDataWeeklyGoal(minWorkGoal,interaction.user.id)
							UserController.updateData({dailyWorkTime:minWorkGoal},interaction.user.id)
							interaction.editReply(GoalMessage.preferredCoworkingTime(interaction.user.id,isSixWeekChallenge))
							ChannelController.deleteMessage(interaction.message)
						}
						break;
					case "selectDailyWorkTime":
						if(interaction.user.id !== targetUserId) return interaction.reply({content:`**You can't select daily work time someone else.**`,ephemeral:true})
						await interaction.deferReply();
						const [projectId,taskId] = value.split('-')
						const [min,labelMenu] = valueMenu.split('_')
						AdvanceReportController.updateDataWeeklyGoal(min,interaction.user.id)
						UserController.updateData({dailyWorkTime:min},interaction.user.id)
						interaction.editReply(FocusSessionMessage.successSetDailyWorkTime(min))
						FocusSessionController.handleStartFocusSession(interaction,interaction.user.id,focusRoomUser,taskId,projectId,listFocusRoom)
						ChannelController.deleteMessage(interaction.message)
						if(focusRoomUser[interaction.user.id]){
							focusRoomUser[interaction.user.id].statusSetSessionGoal = 'done'
							focusRoomUser[interaction.user.id].dailyWorkTime = min
						}
						break;
					case 'selectProject':
						if(interaction.user.id !== targetUserId)return interaction.reply({content:`**You can't select project someone else.**`,ephemeral:true})
						
						if(valueMenu === 'addNewProject'){
							FocusSessionController.showModalAddNewProject(interaction,`addNewProject_${targetUserId}_${value}`)
						}else{
							await interaction.deferReply();

							const task = await supabase.from('FocusSessions')
							.select()
							.eq('id',value)
							.single()
							const dataUser  = await UserController.getDetail(interaction.user.id,'dailyWorkTime')
							if (dataUser.body?.dailyWorkTime) {
								focusRoomUser[interaction.user.id].statusSetSessionGoal = 'done'
								FocusSessionController.handleStartFocusSession(interaction,interaction.user.id,focusRoomUser,value,valueMenu,listFocusRoom)
							}else{
								focusRoomUser[interaction.user.id].statusSetSessionGoal = 'setDailyWorkTime'
								await interaction.editReply(
									FocusSessionMessage.setDailyWorkTime(interaction.user.id,valueMenu,task.body?.id)
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
			}else if (interaction.isAutocomplete()) {
				const command = interaction.client.commands.get(interaction.commandName);
				console.log(command);
				if (!command) {
					console.error(`No command matching ${interaction.commandName} was found.`);
					return;
				}
		
				try {
					await command.autocomplete(interaction);
				} catch (error) {
					console.error(error);
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
			DiscordWebhook.sendError(error,`interaction create ${interaction?.user?.id} ${interaction.customId}`)
		}
	},
};

