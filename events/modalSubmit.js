const ChannelController = require("../controllers/ChannelController");
const GoalController = require("../controllers/GoalController");
const MemberController = require("../controllers/MemberController");
const MembershipController = require("../controllers/MembershipController");
const PartyController = require("../controllers/PartyController");
const RecurringMeetupController = require("../controllers/RecurringMeetupController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const TestimonialController = require("../controllers/TestimonialController");
const VacationController = require("../controllers/VacationController");
const WeeklyReflectionController = require("../controllers/WeeklyReflectionController");
const { ROLE_NEW_MEMBER, CHANNEL_WELCOME, CHANNEL_REFLECTION, CHANNEL_TESTIMONIAL_PRIVATE, CHANNEL_GOALS, CHANNEL_CELEBRATE, CHANNEL_ANNOUNCEMENT, CHANNEL_INTRO, CHANNEL_UPCOMING_SESSION } = require("../helpers/config");
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

module.exports = {
	name: 'modalSubmit',
	async execute(modal) {
		const [commandButton,targetUserId=modal.user.id,value] = modal.customId.split("_")
		if(commandButton === 'addNewProject'){
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
				MemberController.addRole(modal.client,modal.user.id,ROLE_NEW_MEMBER)
				await modal.editReply(ReferralCodeMessage.replySuccessRedeem());
				Promise.all([
					MembershipController.updateMembership(1,modal.user.id),
					MembershipController.updateMembership(1,response.ownedBy)
				])
				.then(async ([endMembershipNewUser,endMembershipReferrer])=>{
					GuidelineInfoController.updateMessagGuideline(modal.client,modal.user.id)
					GuidelineInfoController.updateMessagGuideline(modal.client,response.ownedBy)
					ChannelController.sendToNotification(
						modal.client,
						ReferralCodeMessage.successRedeemReferral(endMembershipNewUser),
						modal.user.id
					)

					ChannelController.sendToNotification(
						modal.client,
						ReferralCodeMessage.successRedeemYourReferral(referralCode,endMembershipReferrer,modal.user),
						response.ownedBy
					)

					const channelConfirmation = ChannelController.getChannel(modal.client,CHANNEL_WELCOME)
					const referrer = await MemberController.getMember(modal.client,response.ownedBy)

					const [totalMember,totalInvited] = await Promise.all([
						MemberController.getTotalMember(),
						ReferralCodeController.getTotalInvited(response.ownedBy)
					])
					const msg = await channelConfirmation.send(ReferralCodeMessage.notifSuccessRedeem(modal.user,referrer.user,totalMember,totalInvited))
					ChannelController.createThread(msg,`Welcome to closa ${modal.user.username}!`)

					MemberController.addRole(modal.client,modal.user.id,ROLE_NEW_MEMBER)
				})
				

				
			}else{
				switch (response.description) {
					case "expired":
						await modal.editReply(ReferralCodeMessage.replyExpiredCode());
						
						break;
					case "redeemed":
						await modal.editReply(ReferralCodeMessage.replyAlreadyRedeemedCode());
						break;
					default:
						await modal.editReply(ReferralCodeMessage.replyInvalidReferralCode());
						break;
				}
				
			}
			
		}else if(commandButton === "writeGoal"){
			const [accountabilityMode,role,goalCategory] = value.split('-')
			const project = modal.getTextInputValue('project');
			const goal = modal.getTextInputValue('goal');
			const about = modal.getTextInputValue('about');
			const shareProgressAt = modal.getTextInputValue('shareProgressAt');

			await modal.deferReply()

			await GoalController.interactionPostGoal(modal,{
				goal,about,project,shareProgressAt,accountabilityMode,role,goalCategory
			})
			ChannelController.deleteMessage(modal.message)
		}else if(commandButton === "editGoal"){
			const deadlineGoal = GoalController.getDeadlineGoal()
			const role = value.split('-')[1]
			const project = modal.getTextInputValue('project');
			const goal = modal.getTextInputValue('goal');
			const about = modal.getTextInputValue('about');
			const shareProgressAt = Time.getTimeFromText(modal.getTextInputValue('shareProgressAt'))
			await modal.deferReply({ephemeral:true})
			
			await modal.message.edit(GoalMessage.postGoal({
				project,goal,about,shareProgressAt,role,user:modal.user,deadlineGoal,value
			}))
			GoalController.updateDataGoal({
				id:modal.message.id,
				project,goal,about,shareProgressAt
			})
			await modal.editReply(`${modal.user} goal has been updated`)
			const thread = await ChannelController.getThread(modal.message.channel,modal.message.id)
			thread.send(`${modal.user} edited the goal`)
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
			
			const customDate = modal.getTextInputValue('date');
			const time = modal.getTextInputValue('time');
			
			// handle format: 18 Decemember and December 18
			const date = customDate.match(/(\d+)/)[0]
			const month = customDate.split(date).filter(Boolean)[0]
			const monthInNumber = Time.convertMonthInNumber(month)
			
			const patternTime = /\d+[.:]\d+/
			if (!patternTime.test(time) || monthInNumber === -1 || !FormatString.isNumber(date)) {
				return await modal.editReply(`Incorrect format, please make sure there is no typo or invalid date & time.
	
The correct format:
\`\`/schedule meetup month date at time\`\``)
	
			}
	
			const [hours,minutes] = time.split(/[.:]/)
	
			const meetupDate = Time.getDate()
			meetupDate.setDate(date)
			if (monthInNumber < meetupDate.getMonth()) meetupDate.setFullYear(meetupDate.getFullYear()+1)
			meetupDate.setMonth(monthInNumber)
			meetupDate.setHours(Time.minus7Hours(hours))
			meetupDate.setMinutes(minutes)
	
			const partyId = modal.channel.name.split(' ')[1]
			RecurringMeetupController.scheduleMeetup(modal.client,meetupDate,modal.channelId,partyId)
			await modal.editReply(`${MessageFormatting.tagUser(modal.user.id)} just set the meetup schedule on \`\`${Time.getFormattedDate(meetupDate)} at ${time}\`\`✅`)

		}else if(commandButton.includes("submitTestimonial")){
			if(commandButton === 'submitTestimonialGuideline') await modal.deferReply({ephemeral:true})
			else await modal.deferReply()
			const testimonialLink = modal.getTextInputValue('link');
			const channelTestimonial = ChannelController.getChannel(modal.client,CHANNEL_TESTIMONIAL_PRIVATE)
			const msg = await channelTestimonial.send(TestimonialMessage.postTestimonialUser(modal.user.id,testimonialLink,true))
			await modal.editReply(TestimonialMessage.successSubmitTestimonial())
			ChannelController.createThread(msg,`from ${modal.user.username}`)
			if(commandButton === 'submitTestimonial') ChannelController.deleteMessage(modal.message)
			await GuidelineInfoController.updateDataShowTestimonial(modal.user.id,false)
			GuidelineInfoController.updateMessagGuideline(modal.client,modal.user.id)
			TestimonialController.addTestimonialUser(modal.user.id,testimonialLink)
		}else if(commandButton === "writeReflection" ){
			await modal.deferReply({
				ephemeral: modal.channel.id === CHANNEL_ANNOUNCEMENT
			})
			const highlight = modal.getTextInputValue('highlight');
			const lowlight = modal.getTextInputValue('lowlight');
			const actionPlan = modal.getTextInputValue('actionPlan');
			const note = modal.getTextInputValue('note');

			if(!WeeklyReflectionController.isRangeWeeklyReflection()) {
				await interaction.editReply(WeeklyReflectionMessage.replySubmissionClosed())
				return ChannelController.deleteMessage(interaction.message)
			}
			const dataUser = await supabase
			.from('Users')
			.select()
			.eq('id',modal.user.id)
			.single()

			let projectName = '-'
			let threadGoal 
			if (dataUser.body?.goalId) {
				const channel = ChannelController.getChannel(modal.client,CHANNEL_GOALS)
				threadGoal = await ChannelController.getThread(channel,dataUser.body.goalId)
				projectName = threadGoal.name.split('by')[0]
			}
			const channelReflection = ChannelController.getChannel(modal.client,CHANNEL_REFLECTION)
			const msg = await channelReflection.send(WeeklyReflectionMessage.postReflection({
				projectName,highlight,lowlight,actionPlan,note,
				user:modal.user
			}))
			threadGoal.send(PartyMessage.notifyMemberShareReflection(modal.user.id,msg.id,projectName))
			PartyController.notifyMemberPartyShareReflection(modal.client,modal.user.id,msg.id)
			ChannelController.createThread(msg,`Reflection by ${modal.user.username}`)
			
			const incrementPoint = PointController.calculatePoint('reflection')
			await UserController.incrementTotalPoints(incrementPoint,modal.user.id)
			const dataPoint = await UserController.getDetail(modal.user.id,'totalPoint')
			const totalPoint = dataPoint.body?.totalPoint
			WeeklyReflectionController.addReflection({highlight,lowlight,actionPlan,note,UserId:modal.user.id})
			await modal.editReply(WeeklyReflectionMessage.replySuccessSubmitReflection(totalPoint,incrementPoint))
			if(modal.channel.id !== CHANNEL_ANNOUNCEMENT) ChannelController.deleteMessage(modal.message)
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

				if(linkDeck && linkDeck.includes('http')) metatagImage = await CelebrationController.getMetatagImages(linkProject)
				if(!metatagImage && linkProject && linkProject.includes('http')) metatagImage = await CelebrationController.getMetatagImages(linkProject)
	
				if(!CelebrationController.isRangeCelebration()) {
					await interaction.editReply(WeeklyReflectionMessage.replySubmissionClosed())
					return ChannelController.deleteMessage(interaction.message)
				}
				const dataUser = await supabase
				.from('Users')
				.select()
				.eq('id',modal.user.id)
				.single()
	
				let projectName = '-'
				let threadGoal 
				if (dataUser.body?.goalId) {
					const channel = ChannelController.getChannel(modal.client,CHANNEL_GOALS)
					threadGoal = await ChannelController.getThread(channel,dataUser.body.goalId)
					projectName = threadGoal.name.split('by')[0]
				}
				const channelCelebration = ChannelController.getChannel(modal.client,CHANNEL_CELEBRATE)
				const msg = await channelCelebration.send(CelebrationMessage.postCelebration({
					projectName,story,linkProject,linkDeck,metatagImage,
					user:modal.user
				}))
				threadGoal.send(PartyMessage.notifyMemberShareCelebration(modal.user.id,msg.id,projectName))
				PartyController.notifyMemberPartyShareReflection(modal.client,modal.user.id,msg.id)
				ChannelController.createThread(msg,`Celebration by ${modal.user.username}`)

				const incrementPoint = PointController.calculatePoint('celebration')
				await UserController.incrementTotalPoints(incrementPoint,modal.user.id)
				const dataPoint = await UserController.getDetail(modal.user.id,'totalPoint')
				const totalPoint = dataPoint.body?.totalPoint
				CelebrationController.addCelebration({story,linkProject,linkDeck,UserId:modal.user.id})
				TestimonialController.askToWriteTestimonial(modal.client,modal.user.id,dataUser.body.notificationId)
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
				ChannelController.createThread(msg,`Welcome ${modal.user.username}!`)
				const incrementPoint = PointController.calculatePoint('intro')
				await UserController.incrementTotalPoints(incrementPoint,modal.user.id)
				const dataPoint = await UserController.getDetail(modal.user.id,'totalPoint')
				const totalPoint = dataPoint.body?.totalPoint
				await IntroController.addIntro({
					name,about,expertise,needHelp,social,
					id:msg.id,
					UserId:modal.user.id,
				})

				GuidelineInfoController.updateMessagGuideline(modal.client,modal.user.id)

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

			modal.message.edit(TestimonialMessage.reviewTestimonial(testimonialUser.id,testimonialLink,reply))
			modal.editReply('change custom reply')
		}else if(commandButton === 'scheduleCoworking'){
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

			const channelUpcomingSession = ChannelController.getChannel(modal.client,CHANNEL_UPCOMING_SESSION)
			channelUpcomingSession.send(CoworkingMessage.coworkingEvent('',name,modal.user,totalSlot,0,rules,totalMinute,Time.getDate(coworkingDate)))
				.then(msg=>{
					ChannelController.createThread(msg,name)
					msg.edit(CoworkingMessage.coworkingEvent(msg.id,name,modal.user,totalSlot,0,rules,totalMinute,Time.getDate(coworkingDate)))
					const voiceRoomName = `${name} — ${UserController.getNameFromUserDiscord(modal.user)}`
					supabase.from("CoworkingEvents")
					.insert({
						id:msg.id,
						rules,
						name,
						voiceRoomName,
						totalMinute,
						date:coworkingDate,
						totalSlot,
						HostId:modal.user.id
					}).then()
					if(Time.getDiffTime(Time.getDate(),Time.getDate(coworkingDate)) < 5){
						CoworkingController.createFocusRoom(modal.client,voiceRoomName,msg.id)
					}else{
						CoworkingController.remindFiveMinutesBeforeCoworking(modal.client,fiveMinutesBefore,msg.id)
					}
					CoworkingController.addReminderCoworkingEvent(coworkingDate,modal.user.id,msg.id)
				})
			modal.editReply('success create coworking event')
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

			ChannelController.createThread(msg,name)
			msg.edit(CoworkingMessage.coworkingEvent(msg.id,name,modal.user,totalSlot,0,rules,totalMinute,Time.getDate(coworkingDate)))
			const voiceRoomName = `${name} — ${UserController.getNameFromUserDiscord(modal.user)}`
			supabase.from("CoworkingEvents")
			.update({
				rules,
				name,
				voiceRoomName,
				totalMinute,
				date:coworkingDate,
				totalSlot,
			})
			.eq('id',msg.id).single()
			.then(async coworkingEvent=>{
				if(!coworkingEvent.voiceRoomId){
					if(Time.getDiffTime(Time.getDate(),Time.getDate(coworkingDate)) < 5){
						CoworkingController.createFocusRoom(modal.client,voiceRoomName,msg.id)
					}else{
						CoworkingController.remindFiveMinutesBeforeCoworking(modal.client,fiveMinutesBefore,msg.id)
					}
					await supabase.from("Reminders")
						.delete()
						.eq('message',msg.id)
						
					supabase.from("Reminders")
						.insert([
							{ message:msg.id, time:fiveMinutesBefore, type:'fiveMinutesBeforeCoworking'},
							{ message:msg.id, time:coworkingDate, type:'CoworkingEvent'}
						]).then()
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

			const {data} = await supabase.from("Users")
				.select()
				.eq('id',targetUserId)
				.single()

			const [hours,minutes] = time.split(/[.:]/)
			if (data.reminderHighlight !== time) {
				supabase.from("Users")
					.update({reminderHighlight:time})
					.eq('id',targetUserId)
					.single()
					.then(async ({data:user})=>{
						let ruleReminderHighlight = new schedule.RecurrenceRule();
						ruleReminderHighlight.hour = Time.minus7Hours(hours)
						ruleReminderHighlight.minute = minutes
						const scheduleReminderHighlight = schedule.scheduleJob(ruleReminderHighlight,function(){
							supabase.from('Users')
							.select()
							.eq('id',user.id)
							.single()
							.then(async ({data})=>{
								if (data) {
									if (user.reminderHighlight !== data.reminderHighlight) {
										scheduleReminderHighlight.cancel()
									}else if(data.lastHighlight !== Time.getDate().toISOString().substring(0,10)){
										const {id:userId,notificationId} = data;
										ChannelController.sendToNotification(
											interaction.client,
											HighlightReminderMessage.highlightReminder(userId),
											userId,
											notificationId
										)
									}
								}
							})
						
						})
					})
			}
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
			ChannelController.sendToNotification(modal.client,BoostMessage.sendBoostToInactiveMember(user,modal.user,totalBoost,message),user.id)

			await modal.editReply(BoostMessage.successSendMessage(user))
		}
	},
};

