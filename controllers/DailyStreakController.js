const schedule = require('node-schedule');
const DailyStreakMessage = require('../views/DailyStreakMessage');
const MemberController = require('./MemberController');
const {ROLE_7STREAK,ROLE_30STREAK,ROLE_100STREAK,ROLE_365STREAK, CHANNEL_GOALS, CHANNEL_STREAK} = require('../helpers/config');
const Time = require('../helpers/time');
const supabase = require('../helpers/supabaseClient');
const ChannelController = require('./ChannelController');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const RequestAxios = require('../helpers/axios');
const InfoUser = require('../helpers/InfoUser');
const GenerateImage = require('../helpers/GenerateImage');
const { MessageAttachment } = require('discord.js');
class DailyStreakController {
    
    static achieveDailyStreak(bot,ChannelReminder,dailyStreak,longestStreak,author){
        if (dailyStreak === 7 && dailyStreak === longestStreak) {
            ChannelReminder.send({content:`Welcome to <@&${ROLE_7STREAK}> ${author}! :partying_face: :tada: `,embeds:[DailyStreakMessage.notifyDailyStreak(7)]})
            MemberController.addRole(bot, author.id, ROLE_7STREAK)
        }else if (dailyStreak === 30 && dailyStreak === longestStreak) {
            ChannelReminder.send({content:`Welcome to <@&${ROLE_30STREAK}> ${author}! :partying_face: :tada: `,embeds:[DailyStreakMessage.notifyDailyStreak(30)]})
            MemberController.addRole(bot, author.id, ROLE_30STREAK)
        }else if (dailyStreak === 100 && dailyStreak === longestStreak) {
            ChannelReminder.send({content:`Welcome to <@&${ROLE_100STREAK}> ${author}! :partying_face: :tada: `,embeds:[DailyStreakMessage.notifyDailyStreak(100)]})
            MemberController.addRole(bot, author.id, ROLE_100STREAK)
        }else if (dailyStreak === 365 && dailyStreak === longestStreak) {
            ChannelReminder.send({content:`Welcome to <@&${ROLE_365STREAK}> ${author}! :partying_face: :tada: `,embeds:[DailyStreakMessage.notifyDailyStreak(365)]})
            MemberController.addRole(bot, author.id, ROLE_365STREAK)
        }
    }

    static remindMissOneDay(client){
        let ruleReminderMissOneDay = new schedule.RecurrenceRule();
		ruleReminderMissOneDay.hour = Time.minus7Hours(6)
		ruleReminderMissOneDay.minute = 0
		schedule.scheduleJob(ruleReminderMissOneDay,function(){
			if (!Time.isCooldownPeriod()) {
				supabase.from("Users")
					.select('id,name,notificationId')
					.gte('currentStreak',2)
					.eq('lastDone',Time.getDateOnly(Time.getNextDate(-2)))
					.then(data=>{
						if (data.body) {
							data.body.forEach(async member=>{
								const notificationThread = await ChannelController.getNotificationThread(client,member.id,member.notificationId)
								notificationThread.send(DailyStreakMessage.missYesterdayProgress(member.id))
							})
						}
				})
			}
		})
    }

    static notifyActivateSafetyDot(client){
        let ruleReminderMissOneDay = new schedule.RecurrenceRule();
		ruleReminderMissOneDay.hour = Time.minus7Hours(23)
		ruleReminderMissOneDay.minute = 59
		schedule.scheduleJob(ruleReminderMissOneDay,function(){
			if (!Time.isCooldownPeriod()) {
				supabase.from("Users")
					.select()
					.gte('currentStreak',2)
					.eq('lastDone',Time.getDateOnly(Time.getNextDate(-1)))
					.then(data=>{
						if (data.body) {
							const channelStreak = ChannelController.getChannel(client,CHANNEL_STREAK)
							data.body.forEach(async member=>{
								const {goalId,currentStreak,longestStreak,totalDay,totalPoint} = member
								
								let goalName = 'Consistency'
								if (goalId) {
									const channelGoal = ChannelController.getChannel(client,CHANNEL_GOALS)
									const thread = await ChannelController.getThread(channelGoal,goalId)
									goalName = thread.name.split('by')[0]
								}
								const {user} = await MemberController.getMember(client,member.id)
								RequestAxios.get('todos/tracker/'+user.id)
								.then(async progressRecently=>{
									progressRecently.push({
										type:'safety',
										createdAt:Time.getDate()
									})
									const avatarUrl = InfoUser.getAvatar(user)
									const buffer = await GenerateImage.tracker(user.username,goalName,avatarUrl,progressRecently,longestStreak,totalDay,totalPoint)
									const attachment = new MessageAttachment(buffer,`progress_tracker_${user.username}.png`)
									channelStreak.send(DailyStreakMessage.activateSafetyDot(user.id,currentStreak,attachment))
								})
							})
						}
				})
			}
		})
    }

    static remindAboutToLoseStreak(client){
        let ruleReminderAboutToLoseStreak = new schedule.RecurrenceRule();
		ruleReminderAboutToLoseStreak.hour = Time.minus7Hours(22)
		ruleReminderAboutToLoseStreak.minute = 30
		schedule.scheduleJob(ruleReminderAboutToLoseStreak,function(){
			if (!Time.isCooldownPeriod()) {
				supabase.from("Users")
					.select('id,name,notificationId')
					.gte('currentStreak',2)
					.eq('lastDone',Time.getDateOnly(Time.getNextDate(-2)))
					.then(data=>{
						if (data.body) {
							data.body.forEach(async member=>{
								const notificationThread = await ChannelController.getNotificationThread(client,member.id,member.notificationId)
								notificationThread.send(DailyStreakMessage.remindUserAboutToLoseStreak(member.id))
							})
						}
				})
			}
		})
    }

	static addSafetyCooldown(){
		supabase.from("Users")
			.select('id,lastDone')
			.gte('endMembership',Time.getDateOnly(Time.getDate()))
			.then(data=>{
				if (data.body.length > 0) {
					data.body.forEach(async member=>{
						DailyStreakController.updateLastSafety(Time.getDateOnly(Time.getNextDate(6)),member.id)

						const safetyCooldown = []
						if(member.lastDone === Time.getDateOnly(Time.getNextDate(-2))){
							safetyCooldown.push({
								createdAt:Time.getNextDate(-1),
								updatedAt:Time.getNextDate(-1),
								type:'safety',
								UserId:member.id
							})
						}
						for (let i = 0; i < 7; i++) {
							safetyCooldown.push({
								createdAt:Time.getNextDate(i),
								updatedAt:Time.getNextDate(i),
								type:'safety',
								UserId:member.id
							})
						}

						supabase.from("Todos")
						.insert(safetyCooldown).then()
					})
				}
			})
	}

	static async updateLastSafety(dateOnly,userId){
		supabase.from("Users")
		.update({'lastSafety':dateOnly})
		.eq('id',userId)
		.then()
	}

	static async addSafetyDot(userId,date){
		return await supabase.from("Todos")
			.insert({
				createdAt:date,
				updatedAt:date,
				UserId:userId,
				type:'safety'
			})
	}
}

module.exports = DailyStreakController
