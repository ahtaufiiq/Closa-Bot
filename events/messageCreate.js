const DailyStreakController = require("../controllers/DailyStreakController");
const RequestAxios = require("../helpers/axios");
const { CHANNEL_HIGHLIGHT, CHANNEL_TODO,CHANNEL_STREAK,GUILD_ID,CHANNEL_GOALS, CHANNEL_TOPICS, CHANNEL_REFLECTION, CHANNEL_CELEBRATE, CHANNEL_PAYMENT, MY_ID, CHANNEL_INTRO, CHANNEL_SESSION_GOAL, CHANNEL_CLOSA_CAFE, ROLE_INACTIVE_MEMBER, CHANNEL_MEMES, CLIENT_ID, CHANNEL_COMMAND, CHANNEL_FEATURE_REQUEST, ROLE_NEW_MEMBER, ROLE_MEMBER, ROLE_ONBOARDING_PROGRESS, CHANNEL_TESTIMONIAL, CHANNEL_STATUS} = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const DailyStreakMessage = require("../views/DailyStreakMessage");
const schedule = require('node-schedule');
const FormatString = require("../helpers/formatString");
const Email = require("../helpers/Email");
const GenerateImage = require("../helpers/GenerateImage");
const { AttachmentBuilder, MessageActivityType, MessageType, userMention, codeBlock, ThreadAutoArchiveDuration } = require("discord.js");
const InfoUser = require("../helpers/InfoUser");
const ChannelController = require("../controllers/ChannelController");
const FocusSessionMessage = require("../views/FocusSessionMessage");
const HighlightReminderMessage = require("../views/HighlightReminderMessage");
const PointController = require("../controllers/PointController");
const DailyReport = require("../controllers/DailyReport");
const MembershipController = require("../controllers/MembershipController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const PartyController = require("../controllers/PartyController");
const TodoReminderMessage = require("../views/TodoReminderMessage");
const TestimonialController = require("../controllers/TestimonialController");
const GoalMessage = require("../views/GoalMessage");
const LocalData = require("../helpers/LocalData");
const MemeContestMessage = require("../views/MemeContestMessage");
const MemeController = require("../controllers/MemeController");
const BoostController = require("../controllers/BoostController");
const FocusSessionController = require("../controllers/FocusSessionController");
const MemberController = require("../controllers/MemberController");
const OnboardingController = require("../controllers/OnboardingController");
const OnboardingMessage = require("../views/OnboardingMessage");
const TestimonialMessage = require("../views/TestimonialMessage");
const AchievementBadgeController = require("../controllers/AchievementBadgeController");
const GuidelineInfoController = require("../controllers/GuidelineInfoController");
const UserController = require("../controllers/UserController");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
const DiscordWebhook = require("../helpers/DiscordWebhook");

module.exports = {
	name: 'messageCreate',
	async execute(msg,focusRoomUser,listFocusRoom) {
		if(msg.author.bot) {
			if(msg.channelId === CHANNEL_FEATURE_REQUEST){
				let titleThread
				if(msg.content.includes('changelog')){
					titleThread = `Changelog — ${msg.embeds[0].data.title}`
				}else{
					titleThread = `Post — ${msg.embeds[0].data.title}`
				}
				await ChannelController.createThread(msg,titleThread,true)
			}else if(msg.channelId === CHANNEL_TESTIMONIAL){
				if(!msg.mentions.users.first()) return
				const titleThread = `${msg.mentions.users.first().username} just joined the hype`
				await ChannelController.createThread(msg,titleThread,true)
			}
			return
		}else if(msg.author.id === MY_ID){
			//handle data coworking users (focusRoomUser)
			if(msg.content.includes('/delete')){
				const focusUserId = msg.content.split('/delete ')[1]
				delete focusRoomUser[focusUserId]
				const idUsers = Object.keys(focusRoomUser)
				if(idUsers.length > 0) msg.reply(idUsers.map(idUser => `${userMention(idUser)}`).join(' '))
				else msg.reply('empty')
				return
			}else if(msg.content.includes('/search')){
				const idUsers = Object.keys(focusRoomUser)
				if(idUsers.length > 0) msg.reply(idUsers.map(idUser => `${userMention(idUser)}`).join(' '))
				else msg.reply('empty')
				return
			}else if(msg.content.includes('/detail')){
				const focusUserId = msg.content.split('/detail ')[1]
				if(focusRoomUser[focusUserId]){
					msg.reply(codeBlock(JSON.stringify(focusRoomUser[focusUserId],null,2)))
				}else msg.reply("no user")
				return
			}else if(msg.content.includes('/update')){
				const focusUserId = msg.content.split('/update ')[1]
				focusRoomUser[focusUserId] = {
					...focusRoomUser[focusUserId],
					...JSON.parse(msg.content.split(`\`\`\``)[1])
				}
				return
			}
		}

		// PartyController.handleMentionOutsideMemberInPartyRoom(msg)
		// PartyController.handleOutsideMemberChatInPartyRoom(msg)
		await DailyReport.activeMember(msg.client,msg.author.id)
		PointController.addPoint(msg.author.id,msg.channel.type,0,msg.channelId)

		if (msg.type !== MessageType.Default) return
		supabase.from("Users")
			.update({
				lastActive:Time.getTodayDateOnly()
			})
			.eq('id',msg.author.id)
			.then()
			
		const ChannelStreak = msg?.guild?.channels?.cache?.get(CHANNEL_STREAK)
		switch (msg.channelId) {
			case CHANNEL_TESTIMONIAL:
				let titleTestimonial = `${msg.content.trimStart().split('\n')[0]}`
				if(FormatString.notCharacter(titleTestimonial[0])) titleTestimonial = titleTestimonial.slice(1).trimStart()
				ChannelController.sendToNotification(
					msg.client,
					TestimonialMessage.successPostVibes(msg.author.id),
					msg.author.id
				)
				ChannelController.createThread(msg,titleTestimonial,true)
				break;
			case CHANNEL_SESSION_GOAL:
				if(focusRoomUser[msg.author.id] && !focusRoomUser[msg.author.id].firstTime) {
					const {joinedChannelId} = focusRoomUser[msg.author.id]
					ChannelController.sendToNotification(msg.client,FocusSessionMessage.warningTypingNewTask(msg.author.id,joinedChannelId),msg.author.id)
					ChannelController.deleteMessage(msg)
				}else{
					try {
						await ChannelController.createThread(msg,`🟢 Tracking — ${msg.content}`,false,null,ThreadAutoArchiveDuration.OneDay)
						const threadSession = await ChannelController.getThread(
							ChannelController.getChannel(msg.client,CHANNEL_SESSION_GOAL),
							msg.id
						)
						const userId = msg.author.id
						const projects = await FocusSessionController.getAllProjects(userId)
						const projectMenus = FocusSessionController.getFormattedMenu(projects)
						const dataSessionGoal = await FocusSessionController.insertFocusSession(userId,msg.content,null,msg.id)
						const taskId = dataSessionGoal.body.id

						threadSession.send(FocusSessionMessage.selectProject(userId,projectMenus,taskId))
							.then(msgSelecProject=>{
								focusRoomUser[userId].msgSelecProjectId = msgSelecProject.id
							})
						if(!focusRoomUser[userId]) focusRoomUser[userId] = {}
						focusRoomUser[userId].threadId = msg.id
						focusRoomUser[userId].statusSetSessionGoal = 'selectProject'

						
						FocusSessionController.handleAutoSelectProject(msg.client,focusRoomUser,userId,taskId)
					} catch (error) {
						DiscordWebhook.sendError(error,msg.author.id+' messageCreate '+msg.id)
					}
				}
				break;
			case CHANNEL_HIGHLIGHT:
				const patternEmoji = /^🔆/
				if (patternEmoji.test(msg.content.trimStart())) {
					if (Time.haveTime(msg.content)) {
						const differentTime = msg.content.toLowerCase().includes(' wita') ? -1 : msg.content.toLowerCase().includes(' wit') ? -2 : 0
						const isTomorrow = msg.content.toLowerCase().includes('tomorrow') 
						const time = Time.getTimeFromText(msg.content)
                        const [hours,minutes] = time.split(/[.:]/)
						const date = new Date()
						let lastHighlight = Time.getTodayDateOnly()
						if(isTomorrow) {
							date.setDate(date.getDate()+1)
							lastHighlight = Time.getTomorrowDateOnly()
						}

						date.setHours(Time.minus7Hours(Number(hours)+differentTime,false))
						date.setMinutes(minutes-10)
						supabase.from('Reminders')
							.insert({
								message:msg.content,
								time:date,
								UserId:msg.author.id,
							})
							.then()
						await RequestAxios.post('highlights', {
							description: msg.content,
							UserId: msg.author.id
						})
						const data = await supabase.from('Users')
							.update({lastHighlight})
							.eq('id',msg.author.id)
							.single()
						
						ChannelController.sendToNotification(
							msg.client,
							HighlightReminderMessage.successScheduled(msg.content.split("🔆")[1].trim()),
							msg.author.id,
							data.body.notificationId
						)

						schedule.scheduleJob(date,async function () {
							ChannelController.sendToNotification(
								msg.client,
								HighlightReminderMessage.remindHighlightUser(msg.author.id,msg.content),
								msg.author.id,
								data.body.notificationId
							)
						})
						
						PartyController.sendNotifToSetHighlight(msg.client,msg.author.id)
					}else{
						msg.delete()
						ChannelController.sendToNotification(
							msg.client,
							HighlightReminderMessage.wrongFormat(msg.author),
							msg.author.id
						)
					}
				}
				
					
				break;
			case CHANNEL_TODO:
				if(msg.content.split(' ').length < 16 && msg.attachments.size === 0){
					msg.delete()
					ChannelController.sendToNotification(
						msg.client,
						TodoReminderMessage.warningMinimalWords(msg.author.id),
						msg.author.id
					)
					return
				}
				
				
				const { data, error } = await supabase
					.from('Users')
					.select()
					.eq('id',msg.author.id)
					.single()

				const attachments = []
				let files = []

				msg.attachments.each(data=>{
					const fileSizeInMB = Math.ceil(data.size / 1e6)
					if(fileSizeInMB <= 24){
						files.push({
							attachment:data.attachment
						})
					}
					attachments.push(data.attachment)
				})

				let goalName = ''
				let msgGoalId
				if (data?.goalId) {
					const thread = await ChannelController.getGoalThread(msg.client,data.goalId)
					goalName = thread.name.split('by')[0]
					let {totalDay,lastDone} = data
					if(lastDone !== Time.getTodayDateOnly()) totalDay += 1
					const msgGoal = await thread.send(
						GoalMessage.shareProgress(msg,files,totalDay)
					)
					if(totalDay === 1){
						const channelStatus = ChannelController.getChannel(msg.client,CHANNEL_STATUS)
						channelStatus.send(GoalMessage.shareProgress(msg,files,totalDay))
					}
					msgGoalId = msgGoal.id
				}else{
					ChannelController.sendToNotification(
						msg.client,
						TodoReminderMessage.warningNeverSetGoal(msg.author.id,msg.content),
						msg.author.id,
						data?.notificationId
					)
					return msg.delete()
				}
				OnboardingController.handleOnboardingProgress(msg.client,msg.author)
				BoostController.deleteBoostMessage(msg.client,msg.author.id)

				const splittedMessage = msg.content.trimStart().split('\n')
				let titleProgress = splittedMessage[0].length < 5 ? splittedMessage[1] : splittedMessage[0]
				if(FormatString.notCharacter(titleProgress[0])) titleProgress = titleProgress.slice(1).trimStart()

				ChannelController.createThread(msg,titleProgress,true)

				// PartyController.updateDataProgressRecap(msg.author.id,'progress',{
				// 	avatarURL:msg.author.displayAvatarURL(),
				// 	username:msg.author.username,
				// 	msgId:msg.id,
				// 	msgContent:msg.content.split('\n')[0],
				// 	time:Time.getTimeOnly(Time.getDate()),
				// 	type:"progress"
				// })
				
				
				RequestAxios.get(`todos/${msg.author.id}`)
				.then(async (data) => {
					await supabase.from("Todos")
						.insert({
							attachments,
							msgGoalId,
							description:msg.content,
							UserId:msg.author.id,
							msgProgressId:msg.id,
						})

					if (data.length > 0) {
						throw new Error("Tidak perlu kirim daily streak ke channel")
					} else {
						supabase.from("Users").update({avatarURL:InfoUser.getAvatar(msg.author)}).eq('id',msg.author.id).then()
						if(!Time.isCooldownPeriod()) await ReferralCodeController.updateTotalDaysThisCohort(msg.author.id)
					}
					
					return supabase.from("Users")
						.select()
						.eq('id',msg.author.id)
						.single()
				})
				.then(async data=>{
					let currentStreak = data.body.currentStreak + 1
					let totalDay =  (data.body.totalDay || 0) + 1
					
					if (Time.isValidStreak(currentStreak,data.body.lastDone,data.body.lastSafety) || Time.isValidCooldownPeriod(data.body.lastDone)) {
						if (Time.onlyMissOneDay(data.body.lastDone,data.body.lastSafety) && (!Time.isCooldownPeriod() || Time.isFirstDayCooldownPeriod())) {
							const missedDate = Time.getNextDate(-1)
							missedDate.setHours(8)
							await DailyStreakController.addSafetyDot(msg.author.id,missedDate)
						}
						if (currentStreak > data.body.longestStreak) {
							return supabase.from("Users")
								.update({
									currentStreak,
									totalDay,
									'longestStreak':currentStreak,
									'endLongestStreak':Time.getTodayDateOnly()
								})
								.eq('id',msg.author.id)
								.single()
						}else{
							return supabase.from("Users")
								.update({
									currentStreak,
									totalDay
								})
								.eq('id',msg.author.id)
								.single()
						}
					}else{
						return supabase.from("Users")
							.update({
								'currentStreak':1,
								totalDay,
							})
							.eq('id',msg.author.id)
							.single()
					}
				})
				.then(async data => {
					supabase.from('Users')
						.update({lastDone:Time.getTodayDateOnly()})
						.eq('id',msg.author.id)
						.then()
					let {
						currentStreak,
						longestStreak, 
						totalDay ,
						totalPoint, 
						endLongestStreak,
						totalDaysThisCohort
					} = data.body

					if(totalDay === 20){
						await MemberController.addRole(msg.client,msg.author.id,ROLE_MEMBER)
						MemberController.removeRole(msg.client,msg.author.id,ROLE_NEW_MEMBER)
						ChannelController.sendToNotification(
							msg.client,
							ReferralCodeMessage.levelUpBecomeMember(msg.author.id),
							msg.author.id
						)
						supabase.from("Users")
							.update({type:'member'})
							.eq('id',msg.author.id)
							.then()
					}

					if(totalDaysThisCohort === 12 && !Time.isCooldownPeriod()){
						ChannelController.sendToNotification(
							msg.client,
							ReferralCodeMessage.appreciationForActiveUser(msg.author.id),
							msg.author.id
						)
					}
					
					if (goalName) {
						DailyStreakController.generateHabitBuilder(msg.client,msg.author)
							.then(async files=>{
								await ChannelStreak.send({
									embeds:[DailyStreakMessage.dailyStreak(currentStreak,msg.author,longestStreak)],content:`${msg.author}`,
									files
								})

								if(endLongestStreak === Time.getTodayDateOnly()){
									if(currentStreak === 7 || currentStreak === 30 || currentStreak === 100 || currentStreak === 200 || currentStreak === 365) {
										AchievementBadgeController.achieveProgressStreak(msg.client,currentStreak,msg.author,true)
									}
								}else {
									if(currentStreak === 30 || currentStreak === 100 || currentStreak === 200 || currentStreak === 365) {
										AchievementBadgeController.achieveProgressStreak(msg.client,currentStreak,msg.author)
									}
								}
							})
					}else{
						ChannelStreak.send({
							embeds:[DailyStreakMessage.dailyStreak(currentStreak,msg.author,longestStreak)],content:`${msg.author}`
						})
					}
					
				})
				
				.catch(err => {
					DiscordWebhook.sendError(err)
				})
						
				break;
			case CHANNEL_TOPICS:
				ChannelController.createThread(msg,`${msg.content.split('\n')[0]}`,true)	
				break;
			case CHANNEL_CELEBRATE:
				if (msg.attachments.size > 0 || msg.content.includes('http')) {
					ChannelController.createThread(msg,`${msg.author.username} celebration 🎉`,true)
				}	
				const dataUser = await supabase
									.from('Users')
									.select()
									.eq('id',msg.author.id)
									.single()
				
				let filesCelebration = []

				msg.attachments.each(data=>{
					filesCelebration.push({
						attachment:data.attachment
					})
				})

				if (dataUser.body?.goalId) {
					const thread = await ChannelController.getGoalThread(msg.client,dataUser.body?.goalId)
					thread.send({
						content:msg.content,
						files:filesCelebration
					})
				}
				TestimonialController.askToWriteTestimonial(msg.client,msg.author.id,dataUser.body.notificationId)
				break;
			case CHANNEL_MEMES:
				const {isMemeContest} = LocalData.getData()
				if(isMemeContest){
					msg.delete()
					if(msg.attachments.size === 0) {
						ChannelController.sendToNotification(msg.client,MemeContestMessage.invalidSubmissionFormat(msg.author),msg.author.id)
					}else{
						const totalSubmitToday = await MemeController.totalSubmitToday(msg.author.id)
						if(totalSubmitToday === 5){
							
							return ChannelController.sendToNotification(msg.client,MemeContestMessage.submissionLimit(msg.author),msg.author.id)
						}else{
							MemeController.submitMeme(msg)
							MemeController.addVibePoints(msg.client,msg.author)
						}
					}
				}
				break;
			case CHANNEL_PAYMENT:
				if (msg.content[0] === 'v') {
					const msgReferrence = await msg.client.guilds.cache.get(GUILD_ID).channels.cache.get("953575264208695327").messages.fetch(msg.reference.messageId)
					const paymentType = msgReferrence.embeds[0].title
					const UserId = msg.mentions.users.first().id
					const user = msg.mentions.users.first()

					if (msgReferrence.embeds.length>0 ) {
						
						
						const idPayment = msgReferrence.embeds[0].footer.text
			
						const {data} = await supabase.from('Payments')
						.select()
						.eq('id',idPayment)
						.single()
						
						const [total,type] = data.membership.split(' ')

						supabase.from("Payments")
						.update({UserId})
						.eq('id',idPayment)
						.then(data=>{
							if (data?.body) {
								 msg.react('✅')	
							}
						})

						if (paymentType === "Renewal") {
							const email = msgReferrence.embeds[0].fields[0].value
							const totalMonth = type.toLowerCase() === 'year' ? total * 12 : total
							const endMembership = await MembershipController.updateMembership(totalMonth,UserId)
							Email.sendSuccessMembershipRenewal(data.body.name,data.body.email,endMembership)
							user.send(`Hi <@${UserId}>, your membership status already extended until ${endMembership}.
Thank you for your support to closa community!`)
								.catch(err=>console.log("Cannot send message to user"))
							msg.reply(`${data.body.name} membership status already extended until ${endMembership}`)
						}else if(paymentType === 'Payment'){
							const email = msgReferrence.embeds[0].fields[4].value
							const name = msgReferrence.embeds[0].fields[3].value

							
							supabase.from('Users')
								.update({"endMembership":Time.getEndMembership(type,total,data.createdAt),email,name})
								.eq('id',UserId)
								.single()
								.then(data=>{
									const date = Time.getFormattedDate(Time.getDate(data.body.endMembership))
									const startDate = Time.getFormattedDate(Time.getDate())
									user.send(`Hi <@${UserId}>, your membership status until ${date}.
Thank you for your support to closa community!`)
										.catch(err=>console.log("Cannot send message to user"))
									Email.createContact('ataufiq655@gmail.com','ahtaufiiq')
										.catch(err=>{
										})
										.finally(()=>{
											Email.sendWelcomeToClosa(data.body.name,data.body.email,startDate)
										})
									msg.reply(`${data.body.name} membership status until ${date}`)
								})
						}
						
					}
						
				}
				break;
		}
	},
};
