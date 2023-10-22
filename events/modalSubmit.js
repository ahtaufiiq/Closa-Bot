const ChannelController = require("../controllers/ChannelController");
const GoalController = require("../controllers/GoalController");
const MemberController = require("../controllers/MemberController");
const MembershipController = require("../controllers/MembershipController");
const PartyController = require("../controllers/PartyController");
const RecurringMeetupController = require("../controllers/RecurringCoworkingController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const TestimonialController = require("../controllers/TestimonialController");
const VacationController = require("../controllers/VacationController");
const WeeklyReflectionController = require("../controllers/WeeklyReflectionController");
const { ROLE_NEW_MEMBER, CHANNEL_WELCOME, CHANNEL_REFLECTION, CHANNEL_TESTIMONIAL_PRIVATE, CHANNEL_GOALS, CHANNEL_CELEBRATE, CHANNEL_ANNOUNCEMENT, CHANNEL_INTRO, CHANNEL_UPCOMING_SESSION, CHANNEL_NOTIFICATION, ROLE_ONBOARDING_COWORKING, ROLE_ONBOARDING_PROJECT, CHANNEL_6WIC, CHANNEL_GENERAL } = require("../helpers/config");
const FormatString = require("../helpers/formatString");
const MessageFormatting = require("../helpers/MessageFormatting");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const GoalMessage = require("../views/GoalMessage");
const PartyMessage = require("../views/PartyMessage");
const RecurringMeetupMessage = require("../views/RecurringMeetupMessage");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
const TestimonialMessage = require("../views/TestimonialMessage");
const WeeklyReflectionMessage = require("../views/WeeklyReflectionMessage");
const schedule = require('node-schedule');
const HighlightReminderMessage = require("../views/HighlightReminderMessage");
const PointController = require("../controllers/PointController");
const BoostMessage = require("../views/BoostMessage");
const DailyReport = require("../controllers/DailyReport");
const BoostController = require("../controllers/BoostController");
const GuidelineInfoController = require("../controllers/GuidelineInfoController");
const CelebrationController = require("../controllers/CelebrationController");
const CelebrationMessage = require("../views/CelebrationMessage");
const UserController = require("../controllers/UserController");
const IntroMessage = require("../views/IntroMessage");
const IntroController = require("../controllers/IntroController");
const FocusSessionController = require("../controllers/FocusSessionController");
const FocusSessionMessage = require("../views/FocusSessionMessage");
const CoworkingMessage = require("../views/CoworkingMessage");
const CoworkingController = require("../controllers/CoworkingController");
const { AttachmentBuilder } = require("discord.js");
const GenerateImage = require("../helpers/GenerateImage");
const OnboardingMessage = require("../views/OnboardingMessage");
const OnboardingController = require("../controllers/OnboardingController");
const AchievementBadgeMessage = require("../views/AchievementBadgeMessage");
const ReminderController = require("../controllers/ReminderController");
const DiscordWebhook = require("../helpers/DiscordWebhook");
const AdvanceReportController = require("../controllers/AdvanceReportController");
const fs = require('fs');
const MessageComponent = require("../helpers/MessageComponent");
module.exports = {
	name: 'modalSubmit',
	async execute(modal,focusRoomUser) {
		try {
			const [commandButton,targetUserId=modal.user.id,value] = modal.customId.split("_")
			if(commandButton === 'setReminderContinueQuest'){
				await modal.deferReply({ephemeral:true});
				const reminder = modal.getTextInputValue('reminder');
				const [date,time] = reminder.split(' at ')
				if(!date || !time) return await modal.editReply(OnboardingMessage.wrongFormatReminderContinueQuest())
				
				const [hours,minutes] = time.trim().split(/[.:]/)
				if(!hours,!minutes) return await modal.editReply(OnboardingMessage.wrongFormatReminderContinueQuest())
				
				const reminderDate = Time.getDate(date)
				reminderDate.setFullYear(Time.getDate().getFullYear())
				reminderDate.setHours(hours,minutes)
				if(Time.getDateOnly(reminderDate) < Time.getTodayDateOnly()) reminderDate.setFullYear(reminderDate.getFullYear()+1)
				OnboardingController.setReminderContinueQuest(modal,reminderDate)
			}else if(commandButton === 'editQuickRoom'){
				await modal.deferReply({ephemeral:true});
				const name = modal.getTextInputValue('name');
				let limit = Number(modal.getTextInputValue('limit'));
				if(Number.isNaN(limit)) limit === 9

				if(limit < 1) limit = 1
				else if(limit > 25) limit = 25
				modal.channel.edit({
					name:name || `☕ ${UserController.getNameFromUserDiscord(modal.user)}'s table`,
					userLimit:limit
				})

				modal.editReply(`✅ success edited your channel`)

				let counterEditRoom 
				let tableNumber
				for (let i = 0; i < modal.message.components[0].components.length; i++) {
					const {custom_id} = modal.message.components[0].components[i].data;
					const [prevCommandButton,_,prevValue] = custom_id.split('_')
					if(prevCommandButton === 'editQuickRoom'){
						const [number,counter] = prevValue.split('-')
						tableNumber = number
						counterEditRoom = Number(counter) + 1
						break
					}
				}
				
				await modal.message.edit(CoworkingMessage.successCreateQuickRoom(modal.user.id,tableNumber,counterEditRoom))
			}else if (commandButton === 'reminderCoworking') {
				await modal.deferReply({ephemeral:true});
				const reminderTime = modal.getTextInputValue('schedule');
				const differentTime = reminderTime.toLowerCase().includes(' wita') ? 1 : reminderTime.toLowerCase().includes(' wit') ? 2 : 0
				const time = Time.getTimeFromText(reminderTime)
				const [hours,minutes] = time.split(/[.:]/)
				const date = new Date()

				date.setHours(Time.minus7Hours(Number(hours)-differentTime,false))
				date.setMinutes(minutes)
				const isMoreThanTenMinutes = Time.getDiffTime(new Date(),date) > 10
				if(isMoreThanTenMinutes) date.setMinutes(minutes-10)
				
				supabase.from('Reminders')
					.insert({
						message:reminderTime,
						time:date,
						UserId:modal.user.id,
					})
					.then()

				schedule.scheduleJob(date,async function () {
					ChannelController.sendToNotification(modal.client,OnboardingMessage.reminderCoworking(modal.user.id,reminderTime),modal.user.id)
				})
				modal.editReply(OnboardingMessage.replySetReminderCoworking(modal.user.id,reminderTime,isMoreThanTenMinutes))
			}else if(commandButton === 'settingBreakReminder'){
				await modal.deferReply({ephemeral:true})
				const breakTime = modal.getTextInputValue('breakTime');
				const totalMinute = Time.getTotalMinutes(breakTime)
				supabase.from("Users")
					.update({breakReminder:totalMinute})
					.eq('id',modal.user.id)
					.then()
				if(focusRoomUser[modal.user.id]) focusRoomUser[modal.user.id].breakReminder = totalMinute
				modal.editReply(FocusSessionMessage.successSettingBreakTime(totalMinute))
			}else if(commandButton === 'setDailyWorkTime'){
				await modal.deferReply({ephemeral:true})
				const dailyWorkGoal = modal.getTextInputValue('dailyWorkGoal');
				const totalMinute = Time.getTotalMinutes(dailyWorkGoal)
				if(focusRoomUser[modal.user.id]) focusRoomUser[modal.user.id].dailyWorkTime = totalMinute
				AdvanceReportController.updateDataWeeklyGoal(totalMinute,modal.user.id)
				UserController.updateData({dailyWorkTime:totalMinute},modal.user.id)
				await modal.editReply(FocusSessionMessage.successSetDailyWorkTime(totalMinute))
			}else if(commandButton === 'setReminderShareProgress'){
				let shareProgressAt = modal.getTextInputValue('shareProgress')
				GoalController.interactionSetReminderShareProgress(modal,shareProgressAt)
			}else if(commandButton === 'selectDailyWorkGoal'){
				await modal.deferReply()
				const dailyWorkGoal = modal.getTextInputValue('dailyWorkGoal');
				const totalMinute = Time.getTotalMinutes(dailyWorkGoal)
				AdvanceReportController.updateDataWeeklyGoal(totalMinute,modal.user.id)
				UserController.updateData({dailyWorkTime:totalMinute},modal.user.id)
				const isSixWeekChallenge = !!value
				await modal.editReply(GoalMessage.preferredCoworkingTime(modal.user.id,isSixWeekChallenge))
				ChannelController.deleteMessage(modal.message)
			}else if(commandButton === 'scheduledCoworkingTimeGoal' || commandButton === 'selectPreferredCoworkingTime'){
				GoalController.modalSubmitPreferredCoworkingTime(modal)
			}else if(commandButton === 'addNewProject'){
				await modal.deferReply()
				const project = modal.getTextInputValue('project');
				await supabase.from("Projects")
					.insert({
						name:project,
						UserId:modal.user.id
					})
				const projects = await FocusSessionController.getAllProjects(modal.user.id)
				const projectMenus = FocusSessionController.getFormattedMenu(projects)

				await modal.editReply(FocusSessionMessage.selectProject(modal.user.id,projectMenus,value))
				modal.message.delete()
			}else if (commandButton === 'modalReferral') {
				await modal.deferReply({ephemeral:true});
				const referralCode = modal.getTextInputValue('referral');
				const [isEligibleToRedeemRederral,isFirstTimeRedeemReferral,response] = await Promise.all([
					ReferralCodeController.isEligibleToRedeemRederral(modal.user.id),
					ReferralCodeController.isFirstTimeRedeemReferral(modal.user.id),
					ReferralCodeController.validateReferral(referralCode)
				])

				if (response.ownedBy === modal.user.id) {
					await modal.editReply(ReferralCodeMessage.cannotRedeemOwnCode());
					return
				}else if(!isEligibleToRedeemRederral){
					await modal.editReply(ReferralCodeMessage.cannotRedeemByExistingMember());
					return
				}else if(!isFirstTimeRedeemReferral){
					await modal.editReply(ReferralCodeMessage.cannotRedeemMoreThanOne());
					return
				}
				if (response.valid) {
					supabase.from("Referrals")
							.update({isRedeemed:true,redeemedBy:modal.user.id})
							.eq('referralCode',referralCode)
							.then()
					await modal.editReply(ReferralCodeMessage.replySuccessRedeem());
					// await MemberController.addRole(modal.client,modal.user.id,ROLE_NEW_MEMBER)

					const channelConfirmation = ChannelController.getChannel(modal.client,CHANNEL_WELCOME)
					const referrer = await MemberController.getMember(modal.client,response.ownedBy)

					const [totalMember,totalInvited] = await Promise.all([
						MemberController.getTotalMember(),
						ReferralCodeController.getTotalInvited(response.ownedBy)
					])
					const msg = await channelConfirmation.send(ReferralCodeMessage.notifSuccessRedeem(modal.user,referrer.user,totalMember,totalInvited))
					OnboardingController.welcomeOnboarding(modal.client,modal.user)
				}else{
					switch (response.description) {
						case "redeemed":
							await modal.editReply(ReferralCodeMessage.replyAlreadyRedeemedCode());
							break;
						default:
							await modal.editReply(ReferralCodeMessage.replyInvalidReferralCode());
							break;
					}
					
				}
				
			}else if(commandButton === "applySixWeekChallenge"){
				await modal.deferReply({ephemeral:true})

				const project = modal.getTextInputValue('project');
				const goal = modal.getTextInputValue('goal');
				const role = modal.customId.split("_")[2]

				const channelGeneral = ChannelController.getChannel(modal.client,CHANNEL_GENERAL)
				channelGeneral.send({
					content:`**${modal.user} just joined 6-week challenge! 🔥**`,
					embeds:[
						MessageComponent.embedMessage({user:modal.user})
						.addFields(
							{ name: '**Project**', value:FormatString.truncateString( project,1020) },
							{ name: "**Goal**", value:FormatString.truncateString(goal,1020) },
							{ name: "**Role**", value:FormatString.truncateString(role,1020) },
						)
					]
				})

				modal.editReply(`**Thank you for participating ✅

see you on our kick-off day.**`)
				if(!fs.existsSync('6wic.json')) fs.writeFileSync('6wic.json','[]')
				const data = JSON.parse(fs.readFileSync('6wic.json'))
				data.push({
					project,
					goal,
					role,
					UserId:modal.user.id
				})
				fs.writeFileSync('6wic.json',JSON.stringify(data,null,2))
			}else if(commandButton === "startNewProject"){
				await modal.deferReply()

				const project = modal.getTextInputValue('project');
				const goal = modal.getTextInputValue('goal');
				const dataUser = await UserController.getDetail(modal.user.id,'reminderProgress')
				const shareProgressAt = dataUser.data.reminderProgress
				const deadlineGoal = Time.getDate(value)
				const isSixWeekChallenge = !!modal.customId.split("_")[3]

				await GoalController.interactionPostGoal(modal,{
					goal,project,shareProgressAt,deadlineGoal
				},isSixWeekChallenge)
				ChannelController.deleteMessage(modal.message)
				OnboardingController.handleOnboardingProject(modal.client,modal.user)
				
			}else if(commandButton === "setDeadlineProject"){
				await modal.deferReply()

				const deadline = modal.getTextInputValue('deadline');
				const deadlineGoal = Time.getDate(deadline)
				deadlineGoal.setFullYear(Time.getDate().getFullYear())
				if(Time.getTodayDateOnly() > Time.getDateOnly(deadlineGoal)) deadlineGoal.setFullYear(deadlineGoal.getFullYear()+1)
				const isSixWeekChallenge = !!value
				await modal.editReply(GoalMessage.startNewProject(modal.user.id,Time.getDateOnly(deadlineGoal),isSixWeekChallenge))
				ChannelController.deleteMessage(modal.message)

			}else if(commandButton === "writeGoal"){
				await modal.deferReply()

				const project = modal.getTextInputValue('project');
				const goal = modal.getTextInputValue('goal');
				const about = modal.getTextInputValue('about');
				const shareProgressAt = modal.getTextInputValue('shareProgressAt');
				const deadline = modal.getTextInputValue('deadline');
				const deadlineGoal = Time.getDate(deadline)
				deadlineGoal.setFullYear(Time.getDate().getFullYear())
				if(Time.getTodayDateOnly() > Time.getDateOnly(deadlineGoal)) deadlineGoal.setFullYear(deadlineGoal.getFullYear()+1)
				const isSixWeekChallenge = !!value
				await GoalController.interactionPostGoal(modal,{
					goal,about,project,shareProgressAt,deadlineGoal
				},isSixWeekChallenge)
				ChannelController.deleteMessage(modal.message)

				OnboardingController.handleOnboardingProject(modal.client,modal.user)
				
			}else if(commandButton === "editGoal"){
				await modal.deferReply({ephemeral:true})

				const project = modal.getTextInputValue('project');
				const goal = modal.getTextInputValue('goal');
				const about = modal.getTextInputValue('about');
				const shareProgressAt = Time.getTimeFromText(modal.getTextInputValue('shareProgressAt'))
				const deadline = modal.getTextInputValue('deadline');
				const deadlineGoal = Time.getDate(deadline)
				deadlineGoal.setFullYear(Time.getDate().getFullYear())

				const dataUser = await supabase.from('Users')
					.select()
					.eq('id',modal.user.id)
					.single()
				const preferredCoworkingTime = dataUser.data?.preferredCoworkingTime
				
				const isSixWeekChallenge = modal.channelId === CHANNEL_6WIC ? true : false
				const buffer = await GenerateImage.project({
					user:modal.user,project,goal,date:deadlineGoal
				},isSixWeekChallenge)
				const files = [new AttachmentBuilder(buffer,{name:`${project}_${modal.user.username}.png`})]
				
				await modal.message.edit(GoalMessage.postGoal({
					project,goal,about,shareProgressAt,user:modal.user,deadlineGoal,files,preferredCoworkingTime
				},isSixWeekChallenge))
				GoalController.updateDataGoal({
					id:modal.message.id,
					project,goal,about,shareProgressAt
				})
				await modal.editReply(`${modal.user} project has been updated`)
				const thread = await ChannelController.getThread(modal.message.channel,modal.message.id)
				thread.send(`${modal.user} edited the project`)
			}else if(commandButton === "useTicketCustomDate"){
				await modal.deferReply({ephemeral:true})
				
				const totalTicket = modal.customId.split("_")[2]
				const customDate = modal.getTextInputValue('customDate');
				
				// handle format: 18 Decemember and December 18
				const date = customDate.match(/(\d+)/)[0]
				const month = customDate.split(date).filter(Boolean)[0]

				const monthInNumber = Time.convertMonthInNumber(month)
				if (monthInNumber === -1 || !FormatString.isNumber(date)) {
					return await modal.editReply(`Incorrect format, please make sure there is no typo or invalid date.
		
The correct format:
\`\`December 29\`\``)
				}else{
					const vacationDate = Time.getDate()
					vacationDate.setDate(date)
					if (monthInNumber < vacationDate.getMonth()) vacationDate.setFullYear(vacationDate.getFullYear()+1)
					vacationDate.setMonth(monthInNumber)
					vacationDate.setHours(8)
					vacationDate.setMinutes(0)
					const dateOnly = Time.getDateOnly(vacationDate)
					await VacationController.interactionBuyTicketViaShop(modal,Number(totalTicket),dateOnly)
				}

			}else if(commandButton === "rescheduleMeetup"){
				await modal.deferReply()
				
				// const customDate = modal.getTextInputValue('date');
				const time = Time.getTimeFromText(modal.getTextInputValue('time'));
				
				// handle format: 18 Decemember and December 18
				// const date = customDate.match(/(\d+)/)[0]
				// const month = customDate.split(date).filter(Boolean)[0]
				// const monthInNumber = Time.convertMonthInNumber(month)
				
				const patternTime = /\d+[.:]\d+/
				if (!patternTime.test(time) || monthInNumber === -1 || !FormatString.isNumber(date)) {
					return await modal.editReply(`Incorrect format, please make sure there is no typo or invalid time.
		
The correct format: \`\`20.00\`\``)
		
				}
		
				const [hours,minutes] = time.split(/[.:]/)
		
				// const meetupDate = Time.getDate()
				// meetupDate.setDate(date)
				// if (monthInNumber < meetupDate.getMonth()) meetupDate.setFullYear(meetupDate.getFullYear()+1)
				// meetupDate.setMonth(monthInNumber)
				// meetupDate.setHours(Time.minus7Hours(hours,false))
				// meetupDate.setMinutes(minutes)
				PartyController.updateCoworkingTime(partyId,time)
				const partyId = modal.channel.name.split(' ')[1]
				// RecurringMeetupController.scheduleMeetup(modal.client,meetupDate,modal.channelId,partyId)
				await modal.editReply(`${MessageFormatting.tagUser(modal.user.id)} just set the new default coworking time at **${time} every day** ✅`)
			}else if(commandButton.includes("submitTestimonial")){
				if(commandButton === 'submitTestimonialGuideline' || commandButton === 'submitTestimonialAchievement') await modal.deferReply({ephemeral:true})
				else await modal.deferReply()
				const link = modal.getTextInputValue('link');
				const channelTestimonial = ChannelController.getChannel(modal.client,CHANNEL_TESTIMONIAL_PRIVATE)
				if(commandButton === 'submitTestimonialAchievement'){
					const msg = await channelTestimonial.send(AchievementBadgeMessage.postCelebrationUser(modal.user.id,link,true,value))
					await modal.editReply(AchievementBadgeMessage.replySubmitLink())
				} 
				else {
					const msg = await channelTestimonial.send(TestimonialMessage.postTestimonialUser(modal.user.id,link,true))
					await modal.editReply(TestimonialMessage.successSubmitTestimonial())
					await GuidelineInfoController.updateDataShowTestimonial(modal.user.id,false)
					GuidelineInfoController.updateMessageGuideline(modal.client,modal.user.id)
					TestimonialController.addTestimonialUser(modal.user.id,link)
					if(commandButton === 'submitTestimonial' ) ChannelController.deleteMessage(modal.message)
				}
			}else if(commandButton === "writeReflection" ){
				await modal.deferReply({
					ephemeral: modal.channel.id === CHANNEL_GENERAL
				})
				const highlight = modal.getTextInputValue('highlight');
				const lowlight = modal.getTextInputValue('lowlight');
				const actionPlan = modal.getTextInputValue('actionPlan');
				const note = modal.getTextInputValue('note');

				if(!WeeklyReflectionController.isRangeWeeklyReflection()) {
					await modal.editReply(WeeklyReflectionMessage.replySubmissionClosed())
					return ChannelController.deleteMessage(modal.message)
				}
				const dataUser = await supabase
				.from('Users')
				.select()
				.eq('id',modal.user.id)
				.single()

				let projectName = '-'
				let threadGoal 
				if (dataUser.data?.goalId) {
					threadGoal = await ChannelController.getGoalThread(modal.client,dataUser.data.goalId)
					projectName = threadGoal.name.split('by')[0]
				}
				const channelReflection = ChannelController.getChannel(modal.client,CHANNEL_REFLECTION)
				const msg = await channelReflection.send(WeeklyReflectionMessage.postReflection({
					projectName,highlight,lowlight,actionPlan,note,
					user:modal.user
				}))
				threadGoal.send(PartyMessage.notifyMemberShareReflection(modal.user.id,msg.id,projectName))
				// PartyController.notifyMemberPartyShareReflection(modal.client,modal.user.id,msg.id)
				ChannelController.createThread(msg,`Reflection by ${modal.user.username}`,true)
				
				const incrementPoint = PointController.calculatePoint('reflection')
				await UserController.incrementTotalPoints(incrementPoint,modal.user.id)
				const dataPoint = await UserController.getDetail(modal.user.id,'totalPoint')
				const totalPoint = dataPoint.data?.totalPoint
				WeeklyReflectionController.addReflection({highlight,lowlight,actionPlan,note,UserId:modal.user.id})
				await modal.editReply(WeeklyReflectionMessage.replySuccessSubmitReflection(totalPoint,incrementPoint))
				if(modal.channel.id !== CHANNEL_GENERAL) ChannelController.deleteMessage(modal.message)
			}else if(commandButton === 'editReflection'){
				await modal.deferReply({ephemeral:true})
				const highlight = modal.getTextInputValue('highlight');
				const lowlight = modal.getTextInputValue('lowlight');
				const actionPlan = modal.getTextInputValue('actionPlan');
				const note = modal.getTextInputValue('note');
				const projectName = value

				modal.message.edit(WeeklyReflectionMessage.postReflection({
					projectName,highlight,lowlight,actionPlan,note,user:modal.user
				}))
				await modal.editReply(`${modal.user} reflection has been updated`)
			}else if(commandButton === "writeCelebration" ){
				await modal.deferReply({
					ephemeral: modal.channel.id === CHANNEL_ANNOUNCEMENT
				})
				const story = modal.getTextInputValue('story');
				const linkProject = modal.getTextInputValue('linkProject');
				const linkDeck = modal.getTextInputValue('linkDeck');

				let metatagImage 

				if(linkDeck && linkDeck.includes('http')) metatagImage = await CelebrationController.getMetatagImages(linkDeck)
				if(!metatagImage && linkProject && linkProject.includes('http')) metatagImage = await CelebrationController.getMetatagImages(linkProject)
	
				if(!CelebrationController.isRangeCelebration()) {
					await modal.editReply(WeeklyReflectionMessage.replySubmissionClosed())
					return ChannelController.deleteMessage(modal.message)
				}
				const dataUser = await supabase
				.from('Users')
				.select()
				.eq('id',modal.user.id)
				.single()
	
				let projectName = '-'
				let threadGoal 
				if (dataUser.data?.goalId) {
					threadGoal = await ChannelController.getGoalThread(modal.client,dataUser.data.goalId)
					projectName = threadGoal.name.split('by')[0]
				}
				const channelCelebration = ChannelController.getChannel(modal.client,CHANNEL_CELEBRATE)
				const msg = await channelCelebration.send(CelebrationMessage.postCelebration({
					projectName,story,linkProject,linkDeck,metatagImage,
					user:modal.user
				}))
				threadGoal.send(PartyMessage.notifyMemberShareCelebration(modal.user.id,msg.id,projectName))
				// PartyController.notifyMemberPartyShareReflection(modal.client,modal.user.id,msg.id)
				ChannelController.createThread(msg,`Celebration by ${modal.user.username}`,true)

				const incrementPoint = PointController.calculatePoint('celebration')
				await UserController.incrementTotalPoints(incrementPoint,modal.user.id)
				const dataPoint = await UserController.getDetail(modal.user.id,'totalPoint')
				const totalPoint = dataPoint.data?.totalPoint
				CelebrationController.addCelebration({story,linkProject,linkDeck,UserId:modal.user.id})
				TestimonialController.askToWriteTestimonial(modal.client,modal.user.id,dataUser.data.notificationId)
				await modal.editReply(CelebrationMessage.replySuccessSubmitCelebration(totalPoint,incrementPoint))
				if(modal.channel.id !== CHANNEL_ANNOUNCEMENT) ChannelController.deleteMessage(modal.message)
			}else if(commandButton === 'editCelebration'){
				await modal.deferReply({ephemeral:true})
				const story = modal.getTextInputValue('story');
				const linkProject = modal.getTextInputValue('linkProject');
				const linkDeck = modal.getTextInputValue('linkDeck');
				const projectName = value

				let metatagImage 

				if(linkDeck && linkDeck.includes('http')) metatagImage = await CelebrationController.getMetatagImages(linkDeck)
				if(!metatagImage && linkProject && linkProject.includes('http')) metatagImage = await CelebrationController.getMetatagImages(linkProject)
	
				modal.message.edit(CelebrationMessage.postCelebration({
					projectName,story,linkProject,linkDeck,metatagImage,user:modal.user
				}))
				await modal.editReply(`${modal.user} celebration has been updated`)
			}else if(commandButton === "writeIntro" ){
				await modal.deferReply({ephemeral: true})
				const name = modal.getTextInputValue('name');
				const about = modal.getTextInputValue('about');
				const expertise = modal.getTextInputValue('expertise');
				const needHelp = modal.getTextInputValue('needHelp');
				const social = modal.getTextInputValue('social');
				
				const channelIntro = ChannelController.getChannel(modal.client,CHANNEL_INTRO)
				const msg = await channelIntro.send(IntroMessage.postIntro({
					name,about,expertise,needHelp,social,
					user:modal.user
				}))
				ChannelController.createThread(msg,`Welcome ${modal.user.username}!`,true)
				const incrementPoint = PointController.calculatePoint('intro')
				await UserController.incrementTotalPoints(incrementPoint,modal.user.id)
				const dataPoint = await UserController.getDetail(modal.user.id,'totalPoint')
				const totalPoint = dataPoint.data?.totalPoint
				await IntroController.addIntro({
					name,about,expertise,needHelp,social,
					id:msg.id,
					UserId:modal.user.id,
				})

				GuidelineInfoController.updateMessageGuideline(modal.client,modal.user.id)

				await modal.editReply(IntroMessage.replySuccessSubmitIntro(totalPoint,incrementPoint))
			}else if(commandButton === 'editIntro'){
				await modal.deferReply({ephemeral:true})
				const name = modal.getTextInputValue('name');
				const about = modal.getTextInputValue('about');
				const expertise = modal.getTextInputValue('expertise');
				const needHelp = modal.getTextInputValue('needHelp');
				const social = modal.getTextInputValue('social');

				modal.message.edit(IntroMessage.postIntro({
					name,about,expertise,needHelp,social,
					user:modal.user
				}))
				IntroController.editIntro({
					name,about,expertise,needHelp,social,
					id:modal.message.id,
					UserId:modal.user.id,
				})
				await modal.editReply(`${modal.user} intro has been updated`)
			}else if(commandButton === "customExtend"){
				await modal.deferReply({ephemeral:true})
				const extendTime = Number(modal.getTextInputValue('time').trim().split(' ')[0]);
				RecurringMeetupController.updateExtendTime(extendTime,value)
				await modal.editReply(RecurringMeetupMessage.replyExtendTime())
				ChannelController.deleteMessage(modal.message)
			}else if(commandButton === 'customReplyTestimonial'){
				await modal.deferReply({ephemeral:true})
				const testimonialLink = `http${modal.message.content.split('http')[1]}`
				const testimonialUser = modal.message.mentions.users.first()
				const reply = modal.getTextInputValue('reply');

				if(value) modal.message.edit(AchievementBadgeMessage.reviewTestimonial(reply))
				else modal.message.edit(TestimonialMessage.reviewTestimonial(testimonialUser.id,testimonialLink,reply))
				modal.editReply('change custom reply')
			}else if(commandButton === 'scheduleCoworking'){
				await modal.deferReply({ephemeral:true})
				CoworkingController.createCoworkingEvent(modal)
			}else if(commandButton === 'editCoworking'){
				await modal.deferReply({ephemeral:true})
				const name = modal.getTextInputValue('name');
				const duration = modal.getTextInputValue('duration');
				const date = modal.getTextInputValue('date');
				const totalSlot = modal.getTextInputValue('totalSlot');
				const rules = modal.getTextInputValue('rules');
				
				let totalMinute = Time.getTotalMinutes(duration)
				let {error,data:coworkingDate} = Time.convertToDate(date)
				if(error) return modal.editReply('invalid format date')

				const fiveMinutesBefore = new Date(coworkingDate.valueOf())
				fiveMinutesBefore.setMinutes(fiveMinutesBefore.getMinutes()-5)

				const msg = await ChannelController.getMessage(
					ChannelController.getChannel(modal.client,CHANNEL_UPCOMING_SESSION),
					value
				)

				const thread = await ChannelController.getThread(
					ChannelController.getChannel(modal.client,CHANNEL_UPCOMING_SESSION),
					value
				)

				thread.send(`${modal.user} just rescheduled the session to ${CoworkingMessage.formatDateRescheduleCoworking(Time.getDate(coworkingDate))}`)

				const voiceRoomName = `${name} — ${UserController.getNameFromUserDiscord(modal.user)}`
				supabase.from("CoworkingEvents")
				.update({
					rules,
					name,
					voiceRoomName,
					totalMinute,
					date:coworkingDate,
					totalSlot,
					updatedAt:new Date()
				})
				.eq('id',msg.id).select().single()
				.then(async coworkingEvent=>{
					if(!coworkingEvent.voiceRoomId){
						CoworkingController.updateCoworkingMessage(msg,false)
						if(Time.getDiffTime(Time.getDate(),Time.getDate(coworkingDate)) < 5){
							CoworkingController.createFocusRoom(modal.client,voiceRoomName,msg.id,totalSlot,true)
						}else{
							CoworkingController.remindFiveMinutesBeforeCoworking(modal.client,fiveMinutesBefore,msg.id)
						}
						supabase.from("Reminders")
							.update({
								time:fiveMinutesBefore
							})
							.eq('message',msg.id)
							.eq('type','fiveMinutesBeforeCoworking')
							.then()
						supabase.from("Reminders")
							.update({
								time:coworkingDate
							})
							.eq('message',msg.id)
							.eq('type','CoworkingEvent')
							.then()
					}

				})
				modal.editReply('success edit coworking event')
			}else if(commandButton === 'customReminder'){
				await modal.deferReply()
				const time = modal.getTextInputValue('time');
				const patternTime = /\d+[.:]\d+/
				if (!patternTime.test(time)) {
						await modal.editReply(`Incorrect format, try: 6.30
(for example) - use 24h format`)
					return	
				}

				ReminderController.setHighlightReminder(modal.client,time,targetUserId)
				await modal.editReply(PartyMessage.endOfOnboarding())
				ChannelController.deleteMessage(modal.message)
			}else if(commandButton === 'personalBoost' || commandButton === 'inactiveReply'){
				await modal.deferReply({ephemeral:true});
				const message = modal.getTextInputValue('message');
				const {user} = await MemberController.getMember(modal.client,targetUserId)

				const {isMoreThanOneMinute,isIncrementPoint} = await PointController.validateTimeBoost(modal.user.id,targetUserId)
				if(!isMoreThanOneMinute) return await modal.editReply(BoostMessage.warningSpamBoost())
				if(isIncrementPoint) {
					await DailyReport.activeMember(modal.client,modal.user.id)
					PointController.addPoint(modal.user.id,'personalBoost')
				}
				const totalBoost = await BoostController.incrementTotalBoost(modal.user.id,user.id)
				ChannelController.sendToNotification(
					modal.client,
					BoostMessage.sendBoostToInactiveMember(user,modal.user,totalBoost,message),
					user.id
				)

				await modal.editReply(BoostMessage.successSendMessage(user))
			}else if(commandButton === 'setReminderHighlight'){
				const taskName = modal.getTextInputValue('taskName');
				if (Time.haveTime(taskName)) {
					await modal.deferReply();
					const differentTime = taskName.toLowerCase().includes(' wita') ? 1 : taskName.toLowerCase().includes(' wit') ? 2 : 0
					const isTomorrow = taskName.toLowerCase().includes('tomorrow') 
					const time = Time.getTimeFromText(taskName)
					const [hours,minutes] = time.split(/[.:]/)
					const date = new Date()
					let lastHighlight = Time.getTodayDateOnly()
					if(isTomorrow) {
						date.setDate(date.getDate()+1)
						lastHighlight = Time.getTomorrowDateOnly()
					}

					date.setHours(Time.minus7Hours(Number(hours)-differentTime,false))
					date.setMinutes(minutes)
					const isMoreThanTenMinutes = Time.getDiffTime(new Date(),date) > 10
					if(isMoreThanTenMinutes) date.setMinutes(minutes-10)
					
					supabase.from('Reminders')
						.insert({
							message:taskName,
							time:date,
							UserId:modal.user.id,
						})
						.then()
					supabase.from("Highlights")
						.insert({
							description:taskName,
							UserId:modal.user.id
						})
						.then()

					await supabase.from('Users')
						.update({lastHighlight})
						.eq('id',modal.user.id)
						.single()
					
					schedule.scheduleJob(date,async function () {
						PartyController.sendNotifToSetHighlight(modal.client,modal.user.id,taskName)
					})
					
					const incrementPoint = PointController.calculatePoint('highlight')
					UserController.incrementTotalPoints(incrementPoint,modal.user.id)
					await modal.editReply(HighlightReminderMessage.successSetHighlightReminder(taskName,modal.user.id,incrementPoint))
					ChannelController.deleteMessage(modal.message)
				}else{
					await modal.deferReply({ephemeral:true})
					modal.editReply({ephemeral:true,content:HighlightReminderMessage.wrongFormat(modal.user)})			
				}
			}

		} catch (error) {
			DiscordWebhook.sendError(error,`modalSubmit ${modal.user.id} ${modal.customId}`)
		}
	},
};

