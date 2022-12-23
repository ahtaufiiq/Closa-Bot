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
let listFocusRoom = {
	"737311735308091423":true,
	"949245624094687283":true,
	[CHANNEL_CLOSA_CAFE]:true
}
let focusRoomUser = {

}

let closaCafe = {

}

let meetup = {}
module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldMember,newMember) {
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
						
						threadParty.send(RecurringMeetupMessage.countdownMeetup(30,voiceChannelId))
						.then(async msg=>{
								let minutes = 30
								const timerMeetup = setInterval(() => {
									if (minutes > 0) {
										minutes--
										msg.edit(RecurringMeetupMessage.countdownMeetup(minutes,voiceChannelId))
									}
									if (minutes === 0) {
										clearInterval(timerMeetup)
										setTimeout(() => {
											newMember.channel.delete()
											delete meetup[channelId]
										}, 1000 * 15);
									}
								}, 1000 * 60);
							})


						voiceChannel.send(RecurringMeetupMessage.countdownMeetupVoiceChat(30))
							.then(async msg=>{
								let minutes = 30
								const timerMeetup = setInterval(() => {
									if (minutes > 0) {
										minutes--
										msg.edit(RecurringMeetupMessage.countdownMeetupVoiceChat(minutes))
									}
									if (minutes === 0) {
										voiceChannel.send(RecurringMeetupMessage.reminderFifteenSecondsBeforeEnded())
										clearInterval(timerMeetup)
									}else if(minutes === 5){
										voiceChannel.send(RecurringMeetupMessage.reminderFiveMinutesBeforeEnded())
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
			const {totalInMinutes}= getGapTime(closaCafe[userId],true)
			await DailyReport.activeMember(oldMember.client,userId)
			if(totalInMinutes >= 20) PointController.addPoint(userId,'cafe',totalInMinutes)

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
					focusRoomUser[userId] = {
						selfVideo : newMember.selfVideo,
						streaming : newMember.streaming,
						threadId:data.threadId,
						status : 'processed',
						firstTime:true
					}
					
					const channel = oldMember.client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_SESSION_GOAL)
					const thread = await channel.threads.fetch(data.threadId);
					if (newMember.selfVideo || newMember.streaming ){
						CoworkingController.handleStartCoworkingSession(oldMember.client)
						let minute = 0
						thread.send(FocusSessionMessage.messageTimer(minute,thread.name))
							.then(msgFocus=>{
								const timerFocus = setInterval(() => {
									if (!focusRoomUser[userId]) {
										msgFocus.edit(FocusSessionMessage.messageTimer(minute,thread.name,false))
										clearInterval(timerFocus)
									}else{
										minute++
										msgFocus.edit(FocusSessionMessage.messageTimer(minute,thread.name))
									}
								}, 1000 * 60);
							})
						focusRoomUser[userId].firstTime = false
					}
					kickUser(userId,newMember.member.user,thread)
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
					kickUser(userId,newMember.member.user,thread)
						.then(()=>{		
							newMember.disconnect()	
						})
						.catch(()=>{
							focusRoomUser[userId].status = 'done'
						})
				}
			}else if (focusRoomUser[userId].firstTime){
				let minute = 0
				CoworkingController.handleStartCoworkingSession(oldMember.client)
				thread.send(FocusSessionMessage.messageTimer(minute,thread.name))
					.then(msgFocus=>{
						const timerFocus = setInterval(() => {
							if (!focusRoomUser[userId]) {
								msgFocus.edit(FocusSessionMessage.messageTimer(minute,thread.name,false))
								clearInterval(timerFocus)
							}else{
								minute++
								msgFocus.edit(FocusSessionMessage.messageTimer(minute,thread.name))
							}
						}, 1000 * 60);
					})
				focusRoomUser[userId].firstTime = false
			}
		}else if(listFocusRoom[oldMember.channelId] && !listFocusRoom[newMember.channelId] && focusRoomUser[userId] ){
			if (totalOldMember === 0 && !focusRoomUser[userId].firstTime) {
				setTimeout(() => {
					CoworkingController.handleLastUserLeaveEvent(oldMember.client)
				}, 1000 * 5);
			}
			delete focusRoomUser[userId]
			supabase.from('FocusSessions')
				.select()
				.eq('UserId',userId)
				.is('session',null)
				.single()
				.then(response=>{
					const {totalInMinutes} = getGapTime(response.data.createdAt)
						if (totalInMinutes >= 5) {
							RequestAxios.get('voice/report/'+userId)
								.then(async data=>{
									channelSessionLog.send({
										content:`${newMember.member.user} just done focus session for **${Time.convertTime(totalInMinutes)}**\n:arrow_right: ${response.data.taskName}`, 
										embeds:[FocusSessionMessage.report(oldMember.member.user,data)]
									})
								})
						}

						supabase.from("FocusSessions")
							.update({
								'session':totalInMinutes
							})
							.eq('id',response.data.id)
							.then()
				})
		}

		if (oldMember.channel !== null) {
			let data = oldMember.channel.members.filter(user=>!user.bot)
			totalOldMember = data.size
		}
		if (newMember.channel !== null) {
			let data = newMember.channel.members.filter(user=>!user.bot)
			totalNewMember = data.size
			if (totalNewMember === 4 && totalNewMember !== totalOldMember && newMember.channelId === CHANNEL_CLOSA_CAFE) {
				let msg = `@here there are 4 people in <#${CHANNEL_CLOSA_CAFE}> right now, let's vibin :beers:`
				const channelGeneral = oldMember.guild.channels.cache.get(CHANNEL_GENERAL)
				channelGeneral.send(msg)
			}
		}
	},
};


async function kickUser(userId,user,thread) {					
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


function getGapTime(date,isFormatDate = false) {
	const todayDateInMinutes = Math.floor(Time.getDate().getTime() / 1000 / 60)
	const joinedDate = isFormatDate ? date : Time.getDate(date)
	const joinedDateInMinutes = Math.floor(joinedDate?.getTime() / 1000 / 60)
	const diff = Math.floor(todayDateInMinutes - joinedDateInMinutes)
	return {totalInMinutes:diff}
}
