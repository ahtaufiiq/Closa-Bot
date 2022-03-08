const {CHANNEL_REMINDER} = require('../helpers/config');
const supabase = require('../helpers/supabaseClient');
let listFocusRoom = {
	"949245624094687283":true,
	"949245665601552395":true
}
let focusRoomUser = {

}
module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldMember,newMember,tes) {
		const channelReminder = oldMember.guild.channels.cache.get(CHANNEL_REMINDER)
		let userId = newMember.member.id
		if(oldMember.channel === null ){
			
			channelReminder.send(`${newMember.member.user} joined ${newMember.channel.name}`)
			if (listFocusRoom[newMember.channelId]) {
				supabase.from('FocusSessions')
					.insert({
						UserId:oldMember.member.user.id
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
			}
		}else if (listFocusRoom[newMember.channelId]) {
			focusRoomUser[userId] = {
				selfVideo : newMember.selfVideo,
				streaming : newMember.streaming,
			}
			
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
		}else if(newMember.channel === null){
			if (listFocusRoom[oldMember.channelId]) {
				delete focusRoomUser[userId]
				supabase.from('FocusSessions')
					.select()
					.eq('UserId',userId)
					.is('session',null)
					.single()
					.then(response=>{
                    console.log("🚀 ~ file: voiceStateUpdate.js ~ line 67 ~ execute ~ response", response)
						const {hours, minutes,totalInMinutes} = getGapTime(response.data.createdAt)
						if (totalInMinutes < 5) {
							supabase.from('FocusSessions')
								.delete()
								.eq('id',response.data.id)
								.then()
						}else{
							supabase.from("FocusSessions")
								.update({
									'session':totalInMinutes
								})
								.eq('id',response.data.id)
								.then()
						}
					})
			}
		}
	},
};


function kickUser(userId,channelReminder,user) {
	const time = 1000 * 60
	return new Promise((resolve,reject)=>{
		setTimeout(() => {
			let {selfVideo,streaming} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
			if (!selfVideo && !streaming) {
				if (focusRoomUser[userId] !== undefined) {
					channelReminder.send(`${user}  I see you joined the focus-room a minute ago but haven't turned on your camera or screenshare yet. Please do this within 1 minute or you will be kicked from the focus room call.`)
					setTimeout(() => {
						let {selfVideo,streaming} = focusRoomUser[userId] || {selfVideo:false,streaming:false}
						if (!selfVideo && !streaming) {
							resolve("user didn't open camera or sharescreen")
						}else{
							reject('user already open camera or sharescreen')
						}
					}, time);
				}
			}
		}, time);
	})
	
}

function getGapTime(date) {
	const todayDateInMinutes = new Date().getTime() / 1000 / 60
	const joinedDateInMinutes = new Date(date).getTime() / 1000 / 60
	const diff = Math.floor(todayDateInMinutes - joinedDateInMinutes)
	const hours = Math.floor(diff / 60)
	const minutes = diff % 60
	return {hours,minutes,totalInMinutes:diff}
}