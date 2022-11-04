const { PermissionFlagsBits, ChannelType } = require("discord-api-types/v9");
const { GUILD_ID, CATEGORY_CHAT } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const ChannelController = require("./ChannelController");
const MemberController = require("./MemberController");
const schedule = require('node-schedule');

class RecurringMeetupController {
	static async createPrivateVoiceChannel(client,channelName,allowedUsers=[]){
		const guild = client.guilds.cache.get(GUILD_ID)
        
		const permissionOverwrites = [
			{
				id:guild.roles.everyone.id,
				deny:[
					PermissionFlagsBits.Connect
				]
			}
		]

		for (let i = 0; i < allowedUsers.length; i++) {
			const userId = allowedUsers[i];
			const {user} = await MemberController.getMember(client,userId)
			permissionOverwrites.push({
				id:user.id,
				allow:[
					PermissionFlagsBits.Connect
				]
			})
		}
		
		const voiceChannel = await guild.channels.create(channelName,{
			permissionOverwrites,
			parent:ChannelController.getChannel(client,CATEGORY_CHAT),
			type:ChannelType.GuildVoice,
		})
		setTimeout(() => {
			if(voiceChannel.members.size < 2){
				voiceChannel.delete()
			}
		}, 1000 * 60 * 35);
		return voiceChannel.id
	}

	static async getTotalResponseMemberMeetup(partyId,acceptMeetup=true){
		const {count} = await supabase.from("WeeklyMeetups")
			.select('id',{count:'exact'})
			.eq("PartyRoomId",partyId)
			.gte('meetupDate',new Date().toISOString())
			.eq('isAcceptMeetup',acceptMeetup)
		return count
	}

	static async createChannel5MinutesBeforeSchedule(){
		schedule.scheduleJob(reminder.time,async function() {
			const notificationThread = await ChannelController.getNotificationThread(client,reminder.UserId,reminder.Users.notificationId)
			notificationThread.send(`Hi <@${reminder.UserId}> reminder: ${reminder.message} `)
		})
	}
}

module.exports = RecurringMeetupController