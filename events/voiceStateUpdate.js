const RequestAxios = require('../helpers/axios');
const {CHANNEL_REMINDER, CHANNEL_SESSION_LOG, CHANNEL_GENERAL, CHANNEL_CLOSA_CAFE} = require('../helpers/config');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const FocusSessionMessage = require('../views/FocusSessionMessage');
let listFocusRoom = {
	"737311735308091423":true,
	"949245624094687283":true
}
let focusRoomUser = {

}
module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldMember,newMember,tes) {
		let totalOldMember = oldMember.channel? oldMember.channel.members.size : 0
		let totalNewMember = newMember.channel? newMember.channel.members.size : 0

		const channelReminder = oldMember.guild.channels.cache.get(CHANNEL_REMINDER)
		const channelSessionLog = oldMember.guild.channels.cache.get(CHANNEL_SESSION_LOG)
		if(oldMember.channelId !== newMember.channelId && newMember.channel !== null){
			channelReminder.send(`${newMember.member.user} joined ${newMember.channel.name}`)
		}
		const userId = newMember.member.id || oldMember.member.id
		if(listFocusRoom[newMember.channelId] && !focusRoomUser[userId]){
			supabase.from('FocusSessions')
				.insert({
					UserId:userId
				})
				.then()
			focusRoomUser[userId] = {
				selfVideo : newMember.selfVideo,
				streaming : newMember.streaming,
				status : 'processed'
			}
			kickUser(userId,channelReminder,newMember.member.user)
				.then(()=>{
					newMember.disconnect()
				})
				.catch(()=>{
					focusRoomUser[userId].status = 'done'
				})
		}else if (listFocusRoom[newMember.channelId]) {
			focusRoomUser[userId].selfVideo = newMember.selfVideo
			focusRoomUser[userId].streaming = newMember.streaming
			
			if (!focusRoomUser[userId].selfVideo && !focusRoomUser[userId].streaming) {
				if (focusRoomUser[userId].status !== 'processed' ) {
					focusRoomUser[userId].status === 'processed'
					kickUser(userId,channelReminder,newMember.member.user)
						.then(()=>{		
							newMember.disconnect()	
						})
						.catch(()=>{
							focusRoomUser[userId].status = 'done'
						})
				}
			}
		}else if(listFocusRoom[oldMember.channelId] && !listFocusRoom[newMember.channelId] ){
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
										content:`${newMember.member.user} has stayed in ${oldMember.channel.name} for ${Time.convertTime(totalInMinutes)}`, 
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


function kickUser(userId,channelReminder,user) {
	const time = 1000 * 120
	return new Promise((resolve,reject)=>{
		setTimeout(() => {
			let {selfVideo,streaming} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
			if (!selfVideo && !streaming) {
				if (focusRoomUser[userId] !== undefined) {
					channelReminder.send(`Hi ${user}, **__please turn on your camera or screenshare__** to keep accountable. 
Please do it within 2 minute before you get auto-kick from the call.`)
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
	const todayDateInMinutes = new Date().getTime() / 1000 / 60
	const joinedDateInMinutes = new Date(date).getTime() / 1000 / 60
	const diff = Math.floor(todayDateInMinutes - joinedDateInMinutes)
	return {totalInMinutes:diff}
}