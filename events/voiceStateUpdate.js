const DailyReport = require('../controllers/DailyReport');
const CoworkingController = require('../controllers/CoworkingController');
const PointController = require('../controllers/PointController');
const RequestAxios = require('../helpers/axios');
const {CHANNEL_SESSION_LOG, CHANNEL_GENERAL, CHANNEL_CLOSA_CAFE, GUILD_ID, CHANNEL_SESSION_GOAL, CHANNEL_TODO, CHANNEL_PARTY_ROOM, CHANNEL_UPCOMING_SESSION, ROLE_ONBOARDING_COWORKING, ROLE_ONBOARDING_PROGRESS} = require('../helpers/config');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const FocusSessionMessage = require('../views/FocusSessionMessage');
const ChannelController = require('../controllers/ChannelController');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const FocusSessionController = require('../controllers/FocusSessionController');
const GenerateImage = require('../helpers/GenerateImage');
const { AttachmentBuilder } = require('discord.js');
const UserController = require('../controllers/UserController');
const CoworkingMessage = require('../views/CoworkingMessage');
const OnboardingController = require('../controllers/OnboardingController');
const MemberController = require('../controllers/MemberController');
const OnboardingMessage = require('../views/OnboardingMessage');
const ReferralCodeController = require('../controllers/ReferralCodeController');
const AchievementBadgeController = require('../controllers/AchievementBadgeController');
const AchievementBadgeMessage = require('../views/AchievementBadgeMessage');
const GuidelineInfoController = require('../controllers/GuidelineInfoController');

let closaCafe = {

}

let meetup = {}
module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldMember,newMember,focusRoomUser,listFocusRoom) {
		try {
			if(oldMember.member.user.bot) return
			let totalOldMember = oldMember.channel? oldMember.channel.members.size : 0
			const channelSessionLog = oldMember.guild.channels.cache.get(CHANNEL_SESSION_LOG)
			const userId = newMember.member.id || oldMember.member.id
			const joinedChannelId = newMember?.channelId
			await CoworkingController.addCoworkingRoomToListFocusRoom(listFocusRoom,joinedChannelId)
	
			RecurringMeetupController.handleVoiceRoomWeeklySync(newMember,meetup,userId)

			if(oldMember.channel === null){
				closaCafe[userId] = Time.getDate()
				UserController.updateLastActive(userId)
			}else if (newMember.channel === null) {
				const {totalInMinutes}= Time.getGapTime(closaCafe[userId],true)
				await DailyReport.activeMember(oldMember.client,userId)
				if(!focusRoomUser[userId]) PointController.addPoint(userId,'voice',totalInMinutes)
	
				delete closaCafe[userId]
			}

			if(isFirsTimeJoinFocusRoom(listFocusRoom,focusRoomUser,joinedChannelId,userId)){
				const dataUser = await UserController.getDetail(userId,'dailyWorkTime,breakReminder')
				const dailyWorkTime = Number(dataUser.body?.dailyWorkTime)
				const breakReminder = Number(dataUser.body?.breakReminder)
				const totalTimeToday = await FocusSessionController.getTotalTaskTimeToday(userId)
				focusRoomUser[userId] = {
					timestamp:Time.getDate().getTime(),
					date:Time.getTodayDateOnly(),
					totalTimeToday,
					dailyWorkTime,
					breakReminder,
					selfVideo : newMember.selfVideo,
					streaming : newMember.streaming,
					threadId:null,
					currentFocus:0,
					totalTime:0,
					focusTime:0,
					breakTime:0,
					breakCounter:0,
					isFocus:true,
					status : 'processed',
					firstTime:true,
					firstTimeCoworkingTimer:true,
					joinedChannelId,
					...focusRoomUser[userId]
				}
				kickUser(userId,newMember.client,joinedChannelId,focusRoomUser)
				.then(()=>{
					newMember.disconnect()
				})
				.catch((err)=>{
					if(focusRoomUser[userId]) focusRoomUser[userId].status = 'done'
				})
				supabase.from('FocusSessions')
					.select()
					.eq('UserId',userId)
					.is('session',null)
					.single()
					.then(async ({data})=>{
					if (data) {
						FocusSessionController.startFocusTimer(newMember.client,data.threadId,userId,focusRoomUser)
					}else{
						ChannelController.sendToNotification(
							newMember.client,
							FocusSessionMessage.askToWriteSessionGoal(userId),
							userId
						)
					}
				})
				
			}else if (listFocusRoom[newMember.channelId] && focusRoomUser[userId]) {
				focusRoomUser[userId].selfVideo = newMember.selfVideo
				focusRoomUser[userId].streaming = newMember.streaming

				if (!focusRoomUser[userId]?.selfVideo && !focusRoomUser[userId]?.streaming) {
					if (focusRoomUser[userId]?.status !== 'processed' ) {
						focusRoomUser[userId]?.status === 'processed'
						kickUser(userId,newMember.client,joinedChannelId,focusRoomUser)
							.then(()=>{		
								newMember.disconnect()	
							})
							.catch(()=>{
								if(focusRoomUser[userId]) focusRoomUser[userId].status = 'done'
							})
					}
				}else if (FocusSessionController.isValidToStartFocusTimer(focusRoomUser,userId)){
					FocusSessionController.startFocusTimer(newMember.client,focusRoomUser[userId].threadId,userId,focusRoomUser)
				}else{
					FocusSessionController.handleAutoSelectProject(oldMember.client,focusRoomUser,userId)
				}
			}else if(isEndedFocusTime(listFocusRoom,focusRoomUser,oldMember?.channelId,joinedChannelId,userId)){
				if(oldMember.channelId === CHANNEL_CLOSA_CAFE){
					if (totalOldMember === 0 && !focusRoomUser[userId]?.firstTime) {
						CoworkingController.handleLastUserLeaveEvent(oldMember.client)
					}
				}
				const {totalTime,focusTime,breakTime,firstTime,statusSetSessionGoal} = focusRoomUser[userId]
				const data = await FocusSessionController.getDetailFocusSession(userId)
				const taskName = data?.taskName
				const projectName = data?.Projects?.name
				if(!firstTime && statusSetSessionGoal === 'done'){
		
					await FocusSessionController.updateTime(userId,totalTime,focusTime,breakTime,projectName,focusRoomUser[userId]?.yesterdayProgress)
					await FocusSessionController.updateCoworkingPartner(oldMember.client,userId)
					if (totalTime >= 5) {
						supabase
							.rpc('incrementTotalCoworkingTime', { increment:totalTime, row_id: userId })
							.then(async ({body:totalCoworkingTime})=>{
								const dataUser = await UserController.getDetail(userId,'totalFocusSession,badgeCoworkingTime')
								const {badgeCoworkingTime,totalFocusSession} = dataUser.body
								let typeCoworkingTime
								if(!badgeCoworkingTime && totalCoworkingTime >= 1000) typeCoworkingTime = AchievementBadgeMessage.typeCoworkingTime['1000min']
								else if(badgeCoworkingTime === AchievementBadgeMessage.typeCoworkingTime['1000min'] && totalCoworkingTime >= 3000) typeCoworkingTime = AchievementBadgeMessage.typeCoworkingTime['50hr']
								else if(badgeCoworkingTime === AchievementBadgeMessage.typeCoworkingTime['50hr'] && totalCoworkingTime >= 6000) typeCoworkingTime = AchievementBadgeMessage.typeCoworkingTime['100hr']
								else if(badgeCoworkingTime === AchievementBadgeMessage.typeCoworkingTime['100hr'] && totalCoworkingTime >= 18000) typeCoworkingTime = AchievementBadgeMessage.typeCoworkingTime['300hr']
								else if(badgeCoworkingTime === AchievementBadgeMessage.typeCoworkingTime['300hr'] && totalCoworkingTime >= 30000) typeCoworkingTime = AchievementBadgeMessage.typeCoworkingTime['500hr']
								else if(badgeCoworkingTime === AchievementBadgeMessage.typeCoworkingTime['1000hr'] && totalCoworkingTime >= 60000) typeCoworkingTime = AchievementBadgeMessage.typeCoworkingTime['1000hr']

								if(typeCoworkingTime){
									AchievementBadgeController.achieveCoworkingTimeBadge(
										oldMember.client,
										totalFocusSession,
										typeCoworkingTime,
										oldMember.member.user
									)
									supabase.from("Users").update({badgeCoworkingTime:typeCoworkingTime}).eq('id',userId).then()
								}
								
							})

						await supabase.rpc('incrementTotalSession',{row_id:userId})
						const yesterdayTotalTime = focusRoomUser[userId]?.yesterdayTotalTime
						const incrementVibePoint = totalTime - (yesterdayTotalTime || 0)
						PointController.addPoint(userId,'voice',incrementVibePoint)
						if(yesterdayTotalTime){
							const yesterdayDateOnly = Time.getDateOnly(Time.getNextDate(-1))
							const {coworkingPartner,dailyWorkTime,totalPoint,totalSession,projectThisWeek,tasks} = await FocusSessionController.getRecapFocusSession(newMember.client,userId,yesterdayDateOnly)
							const buffer = await GenerateImage.dailySummary({
								user:newMember.member.user,
								coworkingFriends:coworkingPartner,
								dailyWorkTime,
								projects:projectThisWeek,
								tasks,
								totalSession,
								dateOnly:yesterdayDateOnly
							})
							let totalTaskTime = 0
							let totalTaskFocusTime = 0
							for (let i = 0; i < tasks.length; i++) {
								const task = tasks[i];
								totalTaskTime += Number(task.totalTime)
								totalTaskFocusTime += Number(task.focusTime)
							}
							const files = [new AttachmentBuilder(buffer,{name:`daily_summary${newMember.member.username}.png`})]
							await channelSessionLog.send(FocusSessionMessage.recapDailySummary(newMember.member.user,files,yesterdayTotalTime,totalPoint,totalTaskTime,totalTaskFocusTime,dailyWorkTime))
						}
						const {coworkingPartner,dailyWorkTime,totalPoint,totalSession,projectThisWeek,tasks} = await FocusSessionController.getRecapFocusSession(newMember.client,userId)
						const buffer = await GenerateImage.dailySummary({
							user:newMember.member.user,
							coworkingFriends:coworkingPartner,
							dailyWorkTime,
							projects:projectThisWeek,
							tasks,
							totalSession
						})
						let totalTaskTime = 0
						let totalTaskFocusTime = 0
						for (let i = 0; i < tasks.length; i++) {
							const task = tasks[i];
							totalTaskTime += Number(task.totalTime)
							totalTaskFocusTime += Number(task.focusTime)
						}
						const files = [new AttachmentBuilder(buffer,{name:`daily_summary${newMember.member.username}.png`})]
						channelSessionLog.send(FocusSessionMessage.recapDailySummary(newMember.member.user,files,incrementVibePoint,totalPoint,totalTaskTime,totalTaskFocusTime,dailyWorkTime))
						OnboardingController.handleOnboardingCoworking(oldMember.client,newMember.member.user)
					}
					const {msgIdFocusRecap,channelIdFocusRecap} = focusRoomUser[userId]
					const channel = await ChannelController.getChannel(oldMember.client,channelIdFocusRecap)
					const msgFocus = await ChannelController.getMessage(channel,msgIdFocusRecap)
					await msgFocus.edit(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId,false))
					if(focusRoomUser[userId]?.msgIdReplyBreak){
						ChannelController.getMessage(channel,focusRoomUser[userId]?.msgIdReplyBreak)
							.then(replyBreak => {
								ChannelController.deleteMessage(replyBreak)
							})
					}
					
				}
				try {
					const {threadId} = focusRoomUser[userId]
					if(threadId){
						const thread = await ChannelController.getThread(
							ChannelController.getChannel(oldMember.client,CHANNEL_SESSION_GOAL),
							threadId
						)
						if(totalTime < 5 || !totalTime){
							thread.delete()
							const msgSession = await ChannelController.getMessage(
								ChannelController.getChannel(oldMember.client,CHANNEL_SESSION_GOAL),
								threadId
							)
							msgSession.delete()
							ChannelController.sendToNotification(
								oldMember.client,
								FocusSessionMessage.warningDisconnectUnderFiveMinute(userId,taskName),
								userId
							)
						}else{
							await thread.edit({name:`⚪ Ended — ${thread.name.split('— ')[1]}`})
							thread.setArchived(true)
						}
					}
				} catch (error) {
					ChannelController.sendError(error,'thread edit and archived')
				}

				FocusSessionController.deleteFocusSession(userId)
				delete focusRoomUser[userId]
			}
		} catch (error) {
			ChannelController.sendError(error,`voice state ${newMember.member.user.id}`)
		}
	},
};


async function kickUser(userId,client,joinedChannelId,focusRoomUser) {			
	const time = Time.oneMinute() * 2
	const oldTimestamp = focusRoomUser[userId]?.timestamp
	return new Promise((resolve,reject)=>{
		setTimeout(async () => {
			let {selfVideo,streaming,threadId,statusSetSessionGoal,timestamp} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
			if (!selfVideo && !streaming && timestamp === oldTimestamp) {
				if (focusRoomUser[userId]) {
					const isAlreadySetSessionGoal = statusSetSessionGoal === 'done'
					if(statusSetSessionGoal !== 'setDailyWorkTime' && statusSetSessionGoal !== 'selectProject'){
						ChannelController.sendToNotification(
							client,
							FocusSessionMessage.askToAccountability(userId,isAlreadySetSessionGoal),
							userId
						)
					}
					let msg
					if(threadId){
						const channel = ChannelController.getChannel(client,CHANNEL_SESSION_GOAL)
						const thread = await ChannelController.getThread(channel,threadId)
						thread.send(FocusSessionMessage.askToAccountability(userId,isAlreadySetSessionGoal,statusSetSessionGoal))
							.then(msgReminder =>{
								msg = msgReminder
							})
					}else if(joinedChannelId === CHANNEL_CLOSA_CAFE){
						const channel = ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
						channel.send(FocusSessionMessage.askToAccountability(userId,isAlreadySetSessionGoal))
							.then(msgReminder =>{
								msg = msgReminder
							})
					}
					setTimeout(() => {
						let {selfVideo,streaming,threadId} = focusRoomUser[userId] || {selfVideo:false,streaming:false,threadId:null}
						
						if ((selfVideo || streaming) && threadId) {
							reject('user already open camera or sharescreen and set session goal')
						}else{
							resolve("user didn't open camera or sharescreen")
						}
						if(msg) ChannelController.deleteMessage(msg)
					}, time);
				}
			}else{
				reject('user already open camera or sharescreen')
			}
		}, time);
	})
}

function isFirsTimeJoinFocusRoom(listFocusRoom,focusRoomUser,joinedChannelId,userId) {
	return listFocusRoom[joinedChannelId] && !focusRoomUser[userId]?.joinedChannelId
}

function isEndedFocusTime(listFocusRoom,focusRoomUser,oldChannelId,joinedChannelId,userId) {
	return listFocusRoom[oldChannelId] && !listFocusRoom[joinedChannelId] && focusRoomUser[userId]
}