const DailyReport = require('../controllers/DailyReport');
const CoworkingController = require('../controllers/CoworkingController');
const PointController = require('../controllers/PointController');
const RequestAxios = require('../helpers/axios');
const {CHANNEL_SESSION_LOG, CHANNEL_GENERAL, CHANNEL_CLOSA_CAFE, GUILD_ID, CHANNEL_SESSION_GOAL, CHANNEL_TODO, CHANNEL_PARTY_ROOM, CHANNEL_UPCOMING_SESSION} = require('../helpers/config');
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
let listFocusRoom = {
	[CHANNEL_CLOSA_CAFE]:true
}
let closaCafe = {

}

let meetup = {}
module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldMember,newMember,focusRoomUser) {
		try {
			if(oldMember.member.user.bot) return
	
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
				supabase.from('FocusSessions')
					.select()
					.eq('UserId',userId)
					.is('session',null)
					.single()
					.then(async ({data})=>{
					if (data) {
						const dataUser = await UserController.getDetail(userId,'dailyWorkTime')
						const dailyWorkTime = Number(dataUser.body?.dailyWorkTime)
						const totalTimeToday = await FocusSessionController.getTotalTaskTimeToday(userId)
						focusRoomUser[userId] = {
							date:Time.getTodayDateOnly(),
							totalTimeToday,
							dailyWorkTime,
							selfVideo : newMember.selfVideo,
							streaming : newMember.streaming,
							threadId:data.threadId,
							totalTime:0,
							focusTime:0,
							breakTime:0,
							breakCounter:0,
							isFocus:true,
							status : 'processed',
							firstTime:true,
						}
						FocusSessionController.setCoworkingPartner(userId)
						
						const channel = oldMember.client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_SESSION_GOAL)
						const thread = await channel.threads.fetch(data.threadId);
						if (newMember.selfVideo || newMember.streaming ){
							const data = await FocusSessionController.getDetailFocusSession(userId)
							const taskName = data?.taskName
							const projectName = data?.Projects?.name
							thread.send(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId))
							.then(async msgFocus=>{
								FocusSessionController.updateMessageFocusTimerId(userId,msgFocus.id)
								FocusSessionController.countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,userId,'voice')						
							})
							focusRoomUser[userId].firstTime = false
							CoworkingController.handleStartCoworkingTimer(userId,joinedChannelId,listFocusRoom,newMember)
						}
						kickUser(userId,newMember.member.user,thread,focusRoomUser)
							.then(()=>{
								newMember.disconnect()
							})
							.catch((err)=>{
								focusRoomUser[userId].status = 'done'
							})
					}
				})
				
			}else if (listFocusRoom[newMember.channelId] && focusRoomUser[userId]) {
				focusRoomUser[userId].selfVideo = newMember.selfVideo
				focusRoomUser[userId].streaming = newMember.streaming
				const channel = oldMember.client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_SESSION_GOAL)
				const thread = await channel.threads.fetch(focusRoomUser[userId]?.threadId);
				if (!focusRoomUser[userId]?.selfVideo && !focusRoomUser[userId]?.streaming) {
					if (focusRoomUser[userId]?.status !== 'processed' ) {
						focusRoomUser[userId]?.status === 'processed'
						kickUser(userId,newMember.member.user,thread,focusRoomUser)
							.then(()=>{		
								newMember.disconnect()	
							})
							.catch(()=>{
								focusRoomUser[userId].status = 'done'
							})
					}
				}else if (focusRoomUser[userId]?.firstTime){
					const data = await FocusSessionController.getDetailFocusSession(userId)
					const taskName = data?.taskName
					const projectName = data?.Projects?.name
					thread.send(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId))
						.then(async msgFocus=>{
							FocusSessionController.updateMessageFocusTimerId(userId,msgFocus.id)
							FocusSessionController.countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,userId,'voice')						
						})
					focusRoomUser[userId].firstTime = false
					CoworkingController.handleStartCoworkingTimer(userId,joinedChannelId,listFocusRoom,newMember)
				}
			}else if(isEndedFocusTime(listFocusRoom,focusRoomUser,oldMember?.channelId,joinedChannelId,userId)){
	
				const {totalTime,focusTime,breakTime} = focusRoomUser[userId]
				const data = await FocusSessionController.getDetailFocusSession(userId)
				const taskName = data?.taskName
				const projectName = data?.Projects?.name
	
				FocusSessionController.updateTime(userId,totalTime,focusTime,breakTime,projectName,focusRoomUser[userId]?.yesterdayProgress)
					.then(async response=>{
						if (totalTime >= 5) {
							await supabase.rpc('incrementTotalSession',{row_id:userId})
							await FocusSessionController.updateCoworkingPartner(userId)
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
						}
						const {msgIdFocusRecap,channelIdFocusRecap} = focusRoomUser[userId]
						const channel = await ChannelController.getChannel(oldMember.client,channelIdFocusRecap)
						const msgFocus = await ChannelController.getMessage(channel,msgIdFocusRecap)
						await msgFocus.edit(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId,false))
						if(focusRoomUser[userId]?.msgIdReplyBreak){
							ChannelController.getMessage(channel,focusRoomUser[userId]?.msgIdReplyBreak)
								.then(replyBreak=>{
									ChannelController.deleteMessage(replyBreak)
								})
						}
						delete focusRoomUser[userId]
						
						const thread = await ChannelController.getThread(
							ChannelController.getChannel(oldMember.client,CHANNEL_SESSION_GOAL),
							channelIdFocusRecap
						)
						thread.setArchived(true)
					})
			}
		} catch (error) {
			ChannelController.sendError(error,`voice state ${newMember.member.user.id}`)
		}
	},
};


async function kickUser(userId,user,thread,focusRoomUser) {					
	const time = Time.oneMinute() * 2
	return new Promise((resolve,reject)=>{
		setTimeout(async () => {
			let {selfVideo,streaming} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
			if (!selfVideo && !streaming) {
				if (focusRoomUser[userId] !== undefined) {
					const msg = await thread.send(`**Hi ${user}, please do one of these following:**
:camera_with_flash: **turn on your video** or :computer: **sharescreen** to stay accountable

please do it within **2 min** before you get auto-kick from the room.`)
					setTimeout(() => {
						let {selfVideo,streaming} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
						if (!selfVideo && !streaming) {
							resolve("user didn't open camera or sharescreen")
						}else{
							ChannelController.deleteMessage(msg)
							reject('user already open camera or sharescreen')
						}
					}, time);
				}
			}else{
				reject('user already open camera or sharescreen')
			}
		}, time);
	})
}

function isFirsTimeJoinFocusRoom(listFocusRoom,focusRoomUser,joinedChannelId,userId) {
	return listFocusRoom[joinedChannelId] && !focusRoomUser[userId]
}

function isEndedFocusTime(listFocusRoom,focusRoomUser,oldChannelId,joinedChannelId,userId) {
	return listFocusRoom[oldChannelId] && !listFocusRoom[joinedChannelId] && focusRoomUser[userId]
}