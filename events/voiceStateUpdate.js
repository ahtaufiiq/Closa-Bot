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
				}
			}else if(isEndedFocusTime(listFocusRoom,focusRoomUser,oldMember?.channelId,joinedChannelId,userId)){
				if(oldMember.channelId === CHANNEL_CLOSA_CAFE){
					if (totalOldMember === 0 && !focusRoomUser[userId]?.firstTime) {
						CoworkingController.handleLastUserLeaveEvent(oldMember.client)
					}
				}
				const {totalTime,focusTime,breakTime,firstTime,statusSetSessionGoal} = focusRoomUser[userId]
				if(!firstTime && statusSetSessionGoal === 'done'){
					const data = await FocusSessionController.getDetailFocusSession(userId)
					const taskName = data?.taskName
					const projectName = data?.Projects?.name
		
					await FocusSessionController.updateTime(userId,totalTime,focusTime,breakTime,projectName,focusRoomUser[userId]?.yesterdayProgress)
					await FocusSessionController.updateCoworkingPartner(userId)
					if (totalTime >= 5) {
						await supabase.rpc('incrementTotalSession',{row_id:userId})
						const incrementVibePoint = totalTime 
						PointController.addPoint(userId,'voice',totalTime)
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

						const isHasRoleOnboardingCoworking = await OnboardingController.isHasRoleOnboardingCoworking(oldMember.client,userId)
						if(isHasRoleOnboardingCoworking){
							MemberController.removeRole(oldMember.client,userId,ROLE_ONBOARDING_COWORKING)
							UserController.getDetail(userId,'lastDone')
								.then(data=>{
									if(data.body.lastDone){
										OnboardingController.updateOnboardingStep(oldMember.client,userId,'done')
										ReferralCodeController.addNewReferral(userId,3)
										OnboardingController.deleteReminderToStartOnboarding(userId)
										setTimeout(async () => {
											const files = []
											const totalReferralCode = await ReferralCodeController.getTotalActiveReferral(userId)
											const coverWhite = await GenerateImage.referralCover(totalReferralCode,newMember.member,false)
											files.push(new AttachmentBuilder(coverWhite,{name:`referral_coverWhite_${newMember.member.username}.png`}))
											ChannelController.sendToNotification(
												oldMember.client,
												OnboardingMessage.completedQuest(userId,files),
												userId
											)
										}, 1000 * 15);
									}else{
										MemberController.addRole(oldMember.client,userId,ROLE_ONBOARDING_PROGRESS)
										setTimeout(() => {
											ChannelController.sendToNotification(
												oldMember.client,
												OnboardingMessage.thirdQuest(userId),
												userId
											)
											OnboardingController.updateOnboardingStep(oldMember.client,userId,'thirdQuest')
										}, 1000 * 15);
									}
								})
						}
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
					
					const thread = await ChannelController.getThread(
						ChannelController.getChannel(oldMember.client,CHANNEL_SESSION_GOAL),
						channelIdFocusRecap
					)
					thread.setArchived(true)
					FocusSessionController.deleteFocusSession(userId)
				}
				if(focusRoomUser[userId]?.firstTime){
					delete focusRoomUser[userId].joinedChannelId 
					delete focusRoomUser[userId].selfVideo 
					delete focusRoomUser[userId].streaming 
					delete focusRoomUser[userId].timestamp
				}else delete focusRoomUser[userId]
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