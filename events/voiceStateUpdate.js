const DailyReport = require('../controllers/DailyReport');
const CoworkingController = require('../controllers/CoworkingController');
const PointController = require('../controllers/PointController');
const RequestAxios = require('../helpers/axios');
const {CHANNEL_SESSION_LOG, CHANNEL_GENERAL, CHANNEL_CLOSA_CAFE, GUILD_ID, CHANNEL_SESSION_GOAL, CHANNEL_TODO, CHANNEL_PARTY_ROOM} = require('../helpers/config');
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
let listFocusRoom = {
	"737311735308091423":true,
	"949245624094687283":true,
	[CHANNEL_CLOSA_CAFE]:true
}
let closaCafe = {

}

let meetup = {}
module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldMember,newMember,focusRoomUser) {
		if(oldMember.member.user.bot) return
		let totalOldMember = oldMember.channel? oldMember.channel.members.size : 0
		let totalNewMember = newMember.channel? newMember.channel.members.size : 0

		const channelSessionLog = oldMember.guild.channels.cache.get(CHANNEL_SESSION_LOG)
		const userId = newMember.member.id || oldMember.member.id

		if(newMember?.channel?.name.includes("Party")){
			const channelId = newMember.channel.id
			const partyId = newMember.channel.name.split(' ')[1]
			if(!meetup[channelId]) meetup[channelId] = {}
			if (!meetup[channelId][userId]) {
				meetup[channelId][userId] = "Join"
				supabase.from("WeeklyMeetups")
					.update({isAttendMeetup:true})
					.eq("UserId",userId)
					.eq("PartyRoomId",partyId)
					.gte("meetupDate",new Date().toUTCString())
					.then()
			}
			if(newMember.channel.members.size >= 2 && !meetup[channelId].status){
				meetup[channelId].status = 'start'
				supabase.from("PartyRooms")
					.select('msgId')
					.eq('id',partyId)
					.single()
					.then(async data=>{
						const channelParty = ChannelController.getChannel(newMember.client,CHANNEL_PARTY_ROOM)
						const threadParty = await ChannelController.getThread(channelParty,data.body.msgId)
						const dataParty = await supabase.from("PartyRooms")
							.select()
							.eq('id',partyId)
							.single()
						const voiceChannelId = dataParty.body.voiceChannelId
						const voiceChannel = ChannelController.getChannel(newMember.client,voiceChannelId)
						let totalExtendTime = 0
						let minutes = 30

						Promise.all([
							threadParty.send(RecurringMeetupMessage.countdownMeetup(minutes,voiceChannelId)),
							voiceChannel.send(RecurringMeetupMessage.countdownMeetupVoiceChat(minutes))
						])
						.then(([msgThreadParty,msgVoiceChat])=>{
							const timerMeetup = setInterval(async () => {
								if(minutes <= 5){
									const temporaryVoice = await supabase.from("TemporaryVoices")
										.select()
										.eq('id',voiceChannelId)
										.single()
									const extendTime = temporaryVoice.body?.extendTime
									if(extendTime){
										minutes += extendTime
										totalExtendTime += extendTime
										RecurringMeetupController.resetExtendTime(voiceChannelId)
										msgVoiceChat.reply(RecurringMeetupMessage.successExtendTime(extendTime))
									}
								}
								if (minutes > 0) {
									minutes--
									msgThreadParty.edit(RecurringMeetupMessage.countdownMeetup(minutes,voiceChannelId))
									msgVoiceChat.edit(RecurringMeetupMessage.countdownMeetupVoiceChat(minutes))
								}
								if (minutes === 0) {
									voiceChannel.send(RecurringMeetupMessage.reminderFifteenSecondsBeforeEnded())
									setTimeout(async () => {
										if(voiceChannel?.id !== CHANNEL_CLOSA_CAFE) await voiceChannel.delete()
										delete meetup[channelId]
										RecurringMeetupController.updateTotalExtendTime(voiceChannelId,totalExtendTime)
									}, 1000 * 15);
									clearInterval(timerMeetup)
								}else if(minutes === 2){
									voiceChannel.send(RecurringMeetupMessage.reminderTwoMinutesBeforeEnded())
								}else if(minutes === 5){
									voiceChannel.send(RecurringMeetupMessage.reminderFiveMinutesBeforeEnded(voiceChannelId))
								}
							}, 1000 * 60);
						})
					})
			}
		}
		


		
		if(oldMember.channelId !== newMember.channelId && newMember.channel !== null){
			supabase.from("Users")
			.update({
				lastActive:Time.getTodayDateOnly()
			})
			.eq('id',userId)
			.then()
		}
		
		if(oldMember.channel === null){
			closaCafe[userId] = Time.getDate()
		}else if (newMember.channel === null) {
			const {totalInMinutes}= Time.getGapTime(closaCafe[userId],true)
			await DailyReport.activeMember(oldMember.client,userId)
			if(!focusRoomUser[userId]) PointController.addPoint(userId,'voice',totalInMinutes)

			delete closaCafe[userId]
		}

		if(listFocusRoom[newMember.channelId] && !focusRoomUser[userId]){
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
						
						CoworkingController.handleStartCoworkingSession(oldMember.client)
						const data = await FocusSessionController.getDetailFocusSession(userId)
						const taskName = data?.taskName
						const projectName = data.Projects.name
						thread.send(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId))
						.then(async msgFocus=>{
							FocusSessionController.countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,userId,'voice')						
						})
						focusRoomUser[userId].firstTime = false
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
			const thread = await channel.threads.fetch(focusRoomUser[userId].threadId);
			if (!focusRoomUser[userId].selfVideo && !focusRoomUser[userId].streaming) {
				if (focusRoomUser[userId].status !== 'processed' ) {
					focusRoomUser[userId].status === 'processed'
					kickUser(userId,newMember.member.user,thread,focusRoomUser)
						.then(()=>{		
							newMember.disconnect()	
						})
						.catch(()=>{
							focusRoomUser[userId].status = 'done'
						})
				}
			}else if (focusRoomUser[userId].firstTime){
				CoworkingController.handleStartCoworkingSession(oldMember.client)
				const data = await FocusSessionController.getDetailFocusSession(userId)
				const taskName = data?.taskName
				const projectName = data.Projects.name
				thread.send(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId))
					.then(async msgFocus=>{
						FocusSessionController.countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,userId,'voice')						
					})
				focusRoomUser[userId].firstTime = false
			}
		}else if(listFocusRoom[oldMember.channelId] && !listFocusRoom[newMember.channelId] && focusRoomUser[userId] ){
			if (totalOldMember === 0 && !focusRoomUser[userId].firstTime) {
				setTimeout(() => {
					CoworkingController.handleLastUserLeaveEvent(oldMember.client)
				}, 1000 * 60);
			}
			const {totalTime,focusTime,breakTime} = focusRoomUser[userId]
			const data = await FocusSessionController.getDetailFocusSession(userId)
			const taskName = data?.taskName
			const projectName = data.Projects.name
			FocusSessionController.updateTime(userId,totalTime,focusTime,breakTime,projectName)
				.then(async response=>{
					if (totalTime >= 5) {
						await FocusSessionController.updateCoworkingPartner(userId)
						const incrementVibePoint = totalTime * 2
						PointController.addPoint(userId,'voice',totalTime)
						const {coworkingPartner,dailyWorkTime,totalPoint,projectThisWeek,tasks} = await FocusSessionController.getRecapFocusSession(newMember.client,userId)
						
						const buffer = await GenerateImage.dailySummary({
							user:newMember.member.user,
							coworkingFriends:coworkingPartner,
							dailyWorkTime,
							projects:projectThisWeek,
							tasks
						})

						const attachment = new AttachmentBuilder(buffer,{name:`daily_summary${newMember.member.username}.png`})
						channelSessionLog.send({
							content:`Here's your recap ${newMember.member.user}`, 
							files:[
								attachment
							],
							embeds:[
								FocusSessionMessage.embedPointReward(incrementVibePoint,totalPoint,newMember.member.user)
							]
						})
					}
					const {msgIdFocusRecap,channelIdFocusRecap} = focusRoomUser[userId]
					const channel = await ChannelController.getChannel(oldMember.client,channelIdFocusRecap)
					const msgFocus = await ChannelController.getMessage(channel,msgIdFocusRecap)
					msgFocus.edit(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId,false))
					delete focusRoomUser[userId]
				})
		}

		if (oldMember.channel !== null) {
			let data = oldMember.channel.members.filter(user=>!user.bot)
			totalOldMember = data.size
		}
		if (newMember.channel !== null) {
			let data = newMember.channel.members.filter(user=>!user.bot)
			totalNewMember = data.size
			if (totalNewMember === 5 && totalNewMember !== totalOldMember && newMember.channelId === CHANNEL_CLOSA_CAFE) {
				let msg = `@here there are 5 people in <#${CHANNEL_CLOSA_CAFE}> right now, let's vibin :beers:`
				const channelGeneral = oldMember.guild.channels.cache.get(CHANNEL_GENERAL)
				channelGeneral.send(msg)
			}
		}
	},
};


async function kickUser(userId,user,thread,focusRoomUser) {					
	const time = 1000 * 120
	return new Promise((resolve,reject)=>{
		setTimeout(() => {
			let {selfVideo,streaming} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
			if (!selfVideo && !streaming) {
				if (focusRoomUser[userId] !== undefined) {
					thread.send(`**Hi ${user}, please do one of these following:**
:video_camera:  \`\`turn on your video\`\` 
or
:computer:  \`\`screenshare to show accountability. \`\`

Please do it within __2 minute__ before you get auto-kick from closa café. `)
					setTimeout(() => {
						let {selfVideo,streaming} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
						if (!selfVideo && !streaming) {
							resolve("user didn't open camera or sharescreen")
						}else{
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