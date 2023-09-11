const RequestAxios = require("../helpers/axios");
const { CHANNEL_HIGHLIGHT, CHANNEL_TODO,CHANNEL_STREAK,GUILD_ID,CHANNEL_GOALS, CHANNEL_TOPICS, CHANNEL_REFLECTION, CHANNEL_CELEBRATE, CHANNEL_PAYMENT, MY_ID, CHANNEL_INTRO, CHANNEL_SESSION_GOAL, CHANNEL_CLOSA_CAFE, ROLE_INACTIVE_MEMBER, CHANNEL_MEMES, CLIENT_ID, CHANNEL_COMMAND, CHANNEL_FEATURE_REQUEST, ROLE_NEW_MEMBER, ROLE_MEMBER, ROLE_ONBOARDING_PROGRESS, CHANNEL_TESTIMONIAL, CHANNEL_STATUS} = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const schedule = require('node-schedule');
const FormatString = require("../helpers/formatString");
const Email = require("../helpers/Email");
const { AttachmentBuilder, MessageActivityType, MessageType, userMention, codeBlock, ThreadAutoArchiveDuration } = require("discord.js");
const ChannelController = require("../controllers/ChannelController");
const FocusSessionMessage = require("../views/FocusSessionMessage");
const HighlightReminderMessage = require("../views/HighlightReminderMessage");
const PointController = require("../controllers/PointController");
const DailyReport = require("../controllers/DailyReport");
const MembershipController = require("../controllers/MembershipController");
const PartyController = require("../controllers/PartyController");
const TodoReminderMessage = require("../views/TodoReminderMessage");
const TestimonialController = require("../controllers/TestimonialController");
const LocalData = require("../helpers/LocalData");
const MemeContestMessage = require("../views/MemeContestMessage");
const MemeController = require("../controllers/MemeController");
const FocusSessionController = require("../controllers/FocusSessionController");
const TestimonialMessage = require("../views/TestimonialMessage");
const DiscordWebhook = require("../helpers/DiscordWebhook");
const GoalController = require("../controllers/GoalController");
const GoalMessage = require("../views/GoalMessage");
const MessageFormatting = require("../helpers/MessageFormatting");

module.exports = {
	name: 'messageCreate',
	async execute(msg,focusRoomUser,listFocusRoom) {
		try {
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
							const taskId = dataSessionGoal.data.id
	
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
							const differentTime = msg.content.toLowerCase().includes(' wita') ? 1 : msg.content.toLowerCase().includes(' wit') ? 2 : 0
							const isTomorrow = msg.content.toLowerCase().includes('tomorrow') 
							const time = Time.getTimeFromText(msg.content)
							const [hours,minutes] = time.split(/[.:]/)
							const date = new Date()
							let lastHighlight = Time.getTodayDateOnly()
							if(isTomorrow) {
								date.setDate(date.getDate()+1)
								lastHighlight = Time.getTomorrowDateOnly()
							}
	
							date.setHours(Time.minus7Hours(Number(hours)-differentTime,false))
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
								.select()
								.single()
							
							ChannelController.sendToNotification(
								msg.client,
								HighlightReminderMessage.successScheduled(msg.content.split("🔆")[1].trim()),
								msg.author.id,
								data.data.notificationId
							)
	
							schedule.scheduleJob(date,async function () {
								ChannelController.sendToNotification(
									msg.client,
									HighlightReminderMessage.remindHighlightUser(msg.author.id,msg.content),
									msg.author.id,
									data.data.notificationId
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
					
					const [allActiveGoal,haveArchivedProject] = await Promise.all([
						GoalController.getActiveGoalUser(msg.author.id),
						GoalController.haveArchivedProject(msg.author.id)
					])
					
					const splittedMessage = msg.content.trimStart().split('\n')
					let titleProgress = splittedMessage[0].length < 5 ? splittedMessage[1] : splittedMessage[0]
					if(FormatString.notCharacter(titleProgress[0])) titleProgress = titleProgress.slice(1).trimStart()
					const threadProgress = await ChannelController.createThread(msg,titleProgress,allActiveGoal.data.length < 2)
					const dataProgress = await supabase.from("Todos")
					.insert({
						description:msg.content,
						UserId:msg.author.id,
						msgProgressId:msg.id,
						type:'waiting'
					}).select()
					const taskId = dataProgress.data[0].id
					if(allActiveGoal.data.length > 1 || (allActiveGoal.data.length === 1 && haveArchivedProject)){
						const goalMenus = GoalController.getFormattedGoalMenu(allActiveGoal.data)
						if(haveArchivedProject){
							goalMenus.push({
								label:'📁 Archived projects',
								value:`archivedProject`
							})
						}
						const msgSelectProject = await threadProgress.send(GoalMessage.selectGoal(msg.author.id,goalMenus,msg.id,taskId))
						setTimeout(async () => {
							const data = await supabase.from("Todos").select().eq('id',taskId).single()
							if(data.data.type === 'waiting'){
								const goalId = allActiveGoal.data[0].id
								await ChannelController.deleteMessage(msgSelectProject)
								GoalController.postProgress(msg,goalId,taskId)
								await threadProgress.send(`✅ updated to ${MessageFormatting.linkToInsideThread(goalId)}`)
							}
							threadProgress.setArchived(true)
						}, Time.oneMinute() * 2);
					}else if(allActiveGoal.data.length === 1){
						const goalId = allActiveGoal.data[0].id
						GoalController.postProgress(msg,goalId,taskId)
						await threadProgress.send(`✅ updated to ${MessageFormatting.linkToInsideThread(goalId)}`)
						threadProgress.setArchived(true)
					}else if(haveArchivedProject){
						const allArchivedGoal = await GoalController.getArchivedGoalUser(msg.author.id)
						const goalMenus = GoalController.getFormattedGoalMenu(allArchivedGoal.data)
						const msgSelectProject = await threadProgress.send(GoalMessage.selectArchivedGoal(msg.author.id,goalMenus,msg.id,taskId))
						setTimeout(async () => {
							const data = await supabase.from("Todos").select().eq('id',taskId).single()
							if(data.data.type === 'waiting'){
								const goalId = allArchivedGoal.data[0].id
								await ChannelController.deleteMessage(msgSelectProject)
								GoalController.postProgress(msg,goalId,taskId)
								await threadProgress.send(`✅ updated to ${MessageFormatting.linkToInsideThread(goalId)}`)
							}
							threadProgress.setArchived(true)
						}, Time.oneMinute() * 2);
					}else {
						ChannelController.sendToNotification(
							msg.client,
							TodoReminderMessage.warningNeverSetGoal(msg.author.id,msg.content),
							msg.author.id
						)
						return ChannelController.deleteMessage(msg)
					}
							
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
	
					if (dataUser.data?.goalId) {
						const thread = await ChannelController.getGoalThread(msg.client,dataUser.data?.goalId)
						thread.send({
							content:msg.content,
							files:filesCelebration
						})
					}
					TestimonialController.askToWriteTestimonial(msg.client,msg.author.id,dataUser.data.notificationId)
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
							.select()
							.then(({data})=>{
								if (data) {
									 msg.react('✅')	
								}
							})
	
							if (paymentType === "Renewal") {
								const email = msgReferrence.embeds[0].fields[0].value
								const totalMonth = type.toLowerCase() === 'year' ? total * 12 : total
								const endMembership = await MembershipController.updateMembership(totalMonth,UserId)
								Email.sendSuccessMembershipRenewal(data.data.name,data.data.email,endMembership)
								user.send(`Hi <@${UserId}>, your membership status already extended until ${endMembership}.
Thank you for your support to closa community!`)
									.catch(err=>console.log("Cannot send message to user"))
								msg.reply(`${data.data.name} membership status already extended until ${endMembership}`)
							}else if(paymentType === 'Payment'){
								const email = msgReferrence.embeds[0].fields[4].value
								const name = msgReferrence.embeds[0].fields[3].value
	
								
								supabase.from('Users')
									.update({"endMembership":Time.getEndMembership(type,total,data.createdAt),email,name})
									.eq('id',UserId)
									.select()
									.single()
									.then(data=>{
										const date = Time.getFormattedDate(Time.getDate(data.data.endMembership))
										const startDate = Time.getFormattedDate(Time.getDate())
										user.send(`Hi <@${UserId}>, your membership status until ${date}.
Thank you for your support to closa community!`)
											.catch(err=>console.log("Cannot send message to user"))
										Email.createContact('ataufiq655@gmail.com','ahtaufiiq')
											.catch(err=>{
											})
											.finally(()=>{
												Email.sendWelcomeToClosa(data.data.name,data.data.email,startDate)
											})
										msg.reply(`${data.data.name} membership status until ${date}`)
									})
							}
							
						}
							
					}
					break;
			}
		} catch (error) {
			DiscordWebhook.sendError(error,'messageCreate')
		}
	},
};
