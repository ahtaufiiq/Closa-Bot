const RequestAxios = require('../helpers/axios');
const {CHANNEL_REMINDER} = require('../helpers/config');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time')
let listFocusRoom = {
	"737311735308091423":true,
	"949245624094687283":true
}
let focusRoomUser = {

}
module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldMember,newMember,tes) {
		const channelReminder = oldMember.guild.channels.cache.get(CHANNEL_REMINDER)
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
		}else if(listFocusRoom[oldMember.channelId] && !listFocusRoom[newMember.channelId] ){
			delete focusRoomUser[userId]

			supabase.from('FocusSessions')
				.select()
				.eq('UserId',userId)
				.is('session',null)
				.single()
				.then(response=>{
					const {totalInMinutes} = getGapTime(response.data.createdAt)

						RequestAxios.get(`voice/daily/${userId}`)
							.then((data)=>{
								if (totalInMinutes >= 5) {
									channelReminder.send(`${newMember.member.user} has stayed in ${oldMember.channel.name} for ${Time.convertTime(totalInMinutes)}
-
⌛️Daily focus time: ${Time.convertTime(data[0].total)}.`)
								}

							})
						supabase.from("FocusSessions")
							.update({
								'session':totalInMinutes
							})
							.eq('id',response.data.id)
							.then()
				})
		}
	},
};


function kickUser(userId,channelReminder,user) {
	const time = 1000 * 120
	const time2 = 1000 * 60
	return new Promise((resolve,reject)=>{
		setTimeout(() => {
			let {selfVideo,streaming} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
			if (!selfVideo && !streaming) {
				if (focusRoomUser[userId] !== undefined) {
					channelReminder.send(`Hi ${user}, **__please turn on your camera or screenshare__** to keep accountable. 
Please do it within 1 minute before you get auto-kick from the call.`)
					setTimeout(() => {
						let {selfVideo,streaming} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
						if (!selfVideo && !streaming) {
							resolve("user didn't open camera or sharescreen")
						}else{
							reject('user already open camera or sharescreen')
						}
					}, time2);
				}
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