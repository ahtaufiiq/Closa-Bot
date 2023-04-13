const DailyStreakController = require("../controllers/DailyStreakController");
const RequestAxios = require("../helpers/axios");
const { CHANNEL_HIGHLIGHT, CHANNEL_TODO,CHANNEL_STREAK,GUILD_ID,CHANNEL_GOALS, CHANNEL_TOPICS, CHANNEL_REFLECTION, CHANNEL_CELEBRATE, CHANNEL_PAYMENT, MY_ID, CHANNEL_INTRO, CHANNEL_SESSION_GOAL, CHANNEL_CLOSA_CAFE, ROLE_INACTIVE_MEMBER, CHANNEL_MEMES, CLIENT_ID, CHANNEL_COMMAND} = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const DailyStreakMessage = require("../views/DailyStreakMessage");
const schedule = require('node-schedule');
const FormatString = require("../helpers/formatString");
const Email = require("../helpers/Email");
const GenerateImage = require("../helpers/GenerateImage");
const { AttachmentBuilder, MessageActivityType, MessageType } = require("discord.js");
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

module.exports = {
	name: 'messageCreate',
	async execute(msg) {
		if(msg.author.bot) {
			if(msg.channelId === CHANNEL_PAYMENT) {
				await ChannelController.createThread(msg,'Payment')
			}
			return
		}

		PartyController.handleMentionOutsideMemberInPartyRoom(msg)
		PartyController.handleOutsideMemberChatInPartyRoom(msg)
		await DailyReport.activeMember(msg.client,msg.author.id)
		PointController.addPoint(msg.author.id,msg.channel.type,0,msg.channelId)

		if (msg.type !== MessageType.Default) return
		supabase.from("Users")
			.update({
				lastActive:Time.getTodayDateOnly()
			})
			.eq('id',msg.author.id)
			.then()
			
		const ChannelStreak = msg.guild.channels.cache.get(CHANNEL_STREAK)
		switch (msg.channelId) {
			case CHANNEL_SESSION_GOAL:
				const threadSession = await ChannelController.createThread(msg,`focus log - ${msg.content}`)
				const projects = await FocusSessionController.getAllProjects(msg.author.id)
				const projectMenus = FocusSessionController.getFormattedMenu(projects)
				threadSession.send(FocusSessionMessage.selectProject(msg.author.id,projectMenus,msg.content))
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

						date.setHours(Time.minus7Hours(Number(hours)+differentTime))
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
				if(msg.content.length < 50 && msg.attachments.size === 0){
					msg.delete()
					ChannelController.sendToNotification(
						msg.client,
					`Hi ${msg.author} please **write a longer story**  in <#${CHANNEL_TODO}> to provide more context to your partners.

so, you can learn or sharing from each others.`,
						msg.author.id
					)
					return
				}
				BoostController.deleteBoostMessage(msg.client,msg.author.id)
				
				const { data, error } = await supabase
					.from('Users')
					.select()
					.eq('id',msg.author.id)
					.single()

				const attachments = []
				let files = []

				msg.attachments.each(data=>{
					files.push({
						attachment:data.attachment
					})
					attachments.push(data.attachment)
				})

				let goalName = ''
				let msgGoalId
				if (data?.goalId) {
					const channel = msg.client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_GOALS)
					const thread = await channel.threads.fetch(data.goalId);
					goalName = thread.name.split('by')[0]
					let {totalDay,lastDone} = data
					if(lastDone !== Time.getTodayDateOnly()) totalDay += 1
					const msgGoal = await thread.send(
						GoalMessage.shareProgress(msg,files,totalDay)
					)
					msgGoalId = msgGoal.id
				}else{
					ChannelController.sendToNotification(
						msg.client,
						TodoReminderMessage.warningNeverSetGoal(msg.author.id),
						msg.author.id,
						data?.notificationId
					)
					msg.delete()
					return
				}

				let titleProgress = `${msg.content.trimStart().split('\n')[0]}`
				if(FormatString.notCharacter(titleProgress[0])) titleProgress = titleProgress.slice(1).trimStart()

				ChannelController.createThread(msg,titleProgress)

				PartyController.updateDataProgressRecap(msg.author.id,'progress',{
					avatarURL:msg.author.displayAvatarURL(),
					username:msg.author.username,
					msgId:msg.id,
					msgContent:msg.content.split('\n')[0],
					time:Time.getTimeOnly(Time.getDate()),
					type:"progress"
				})
				
				if(ReferralCodeController.isTimeToGenerateReferral()){
					ReferralCodeController.generateReferral(msg.client,msg.author)
				}
				
				RequestAxios.get(`todos/${msg.author.id}`)
				.then((data) => {
					supabase.from("Todos")
						.insert({
							attachments,
							msgGoalId,
							description:msg.content,
							UserId:msg.author.id,
							msgProgressId:msg.id,
						}).then()

					if (data.length > 0) {
						throw new Error("Tidak perlu kirim daily streak ke channel")
					} else {
						ReferralCodeController.updateTotalDaysThisCohort(msg.author.id)
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
				.then(data => {
					supabase.from('Users')
						.update({lastDone:Time.getTodayDateOnly()})
						.eq('id',msg.author.id)
						.then()
					let {
						currentStreak,
						longestStreak, 
						totalDay ,
						totalPoint, 
						endLongestStreak
					} = data.body
					
					if (goalName) {
						RequestAxios.get('todos/tracker/'+msg.author.id)
							.then(async progressRecently=>{
								const avatarUrl = InfoUser.getAvatar(msg.author)
								const buffer = await GenerateImage.tracker(msg.author,goalName,avatarUrl,progressRecently,longestStreak,totalDay,totalPoint)
								

								const attachment = new AttachmentBuilder(buffer,{name:`progress_tracker_${msg.author.username}.png`})
								await ChannelStreak.send({
									embeds:[DailyStreakMessage.dailyStreak(currentStreak,msg.author,longestStreak)],content:`${msg.author}`,
									files:[
										attachment
									]
								})
								
								if(endLongestStreak === Time.getTodayDateOnly()){
									if(currentStreak === 7 || currentStreak === 30 || currentStreak === 100 || currentStreak === 365) {
										DailyStreakController.achieveDailyStreak(msg.client,ChannelStreak,currentStreak,msg.author)
									}
								}else {
									if(currentStreak === 30 || currentStreak === 100 || currentStreak === 365) {
										DailyStreakController.achieveDailyStreak(msg.client,ChannelStreak,currentStreak,msg.author)
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
					console.log(err)
				})
						
				break;
			case CHANNEL_TOPICS:
				ChannelController.createThread(msg,`${msg.content.split('\n')[0]}`)	
				break;
			case CHANNEL_CELEBRATE:
				if (msg.attachments.size > 0 || msg.content.includes('http')) {
					ChannelController.createThread(msg,`${msg.author.username} celebration 🎉`)
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
					const channel = msg.client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_GOALS)
					const thread = await channel.threads.fetch(dataUser.body?.goalId);
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
