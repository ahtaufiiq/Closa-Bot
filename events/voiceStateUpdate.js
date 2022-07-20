const PointController = require('../controllers/PointController');
const RequestAxios = require('../helpers/axios');
const {CHANNEL_REMINDER, CHANNEL_SESSION_LOG, CHANNEL_GENERAL, CHANNEL_CLOSA_CAFE, GUILD_ID, CHANNEL_SESSION_GOAL, CHANNEL_TODO} = require('../helpers/config');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const FocusSessionMessage = require('../views/FocusSessionMessage');
let listFocusRoom = {
	"737311735308091423":true,
	"949245624094687283":true,
	[CHANNEL_CLOSA_CAFE]:true
}
let focusRoomUser = {

}

let closaCafe = {

}
module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldMember,newMember,tes) {
		let totalOldMember = oldMember.channel? oldMember.channel.members.size : 0
		let totalNewMember = newMember.channel? newMember.channel.members.size : 0

		const channelReminder = oldMember.guild.channels.cache.get(CHANNEL_REMINDER)
		const channelSessionLog = oldMember.guild.channels.cache.get(CHANNEL_SESSION_LOG)
		const userId = newMember.member.id || oldMember.member.id

		if(oldMember.channelId !== newMember.channelId && newMember.channel !== null){
			channelReminder.send(`${newMember.member.user} joined ${newMember.channel.name}`)
			supabase.from("Users")
			.update({
				last_active:Time.getTodayDateOnly()
			})
			.eq('id',userId)
			.then()
		}

		if(oldMember.channel === null){
			closaCafe[userId] = new Date()
		}else if (newMember.channel === null) {
			const {totalInMinutes}= getGapTime(closaCafe[userId])
			PointController.addPoint(userId,'cafe',totalInMinutes)
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
						threadId:data.thread_id,
						status : 'processed',
						firstTime:true
					}
					
					const channel = oldMember.client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_SESSION_GOAL)
					const thread = await channel.threads.fetch(data.thread_id);
					if (newMember.selfVideo || newMember.streaming ){
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
			delete focusRoomUser[userId]
			supabase.from('FocusSessions')
				.select()
				.eq('UserId',userId)
				.is('session',null)
				.single()
				.then(response=>{
					const {totalInMinutes} = getGapTime(response.data.createdAt)
					PointController.addPoint(userId,'focus',totalInMinutes)
					
						if (totalInMinutes >= 5) {
							RequestAxios.get('voice/report/'+userId)
								.then(async data=>{
									channelSessionLog.send({
										content:`${newMember.member.user} just done focus session for **${Time.convertTime(totalInMinutes)}**\n:arrow_right: ${response.data.task_name}`, 
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
			if (totalNewMember === 3 && totalNewMember !== totalOldMember && newMember.channelId === CHANNEL_CLOSA_CAFE) {
				let msg = `@here there are 3 people in <#${CHANNEL_CLOSA_CAFE}> right now, let's vibin :beers:`
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


function getGapTime(date) {
	const todayDateInMinutes = Math.floor(Time.getDate().getTime() / 1000 / 60)
	const joinedDateInMinutes = Math.floor(Time.getDate(date).getTime() / 1000 / 60)
	const diff = Math.floor(todayDateInMinutes - joinedDateInMinutes)
	return {totalInMinutes:diff}
}
