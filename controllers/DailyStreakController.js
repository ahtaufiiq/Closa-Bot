const schedule = require('node-schedule');
const DailyStreakMessage = require('../views/DailyStreakMessage');
const MemberController = require('./MemberController');
const {ROLE_7STREAK,ROLE_30STREAK,ROLE_100STREAK,ROLE_365STREAK, CHANNEL_GOALS} = require('../helpers/config');
const Time = require('../helpers/time');
const supabase = require('../helpers/supabaseClient');
const ChannelController = require('./ChannelController');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const AccountabilityPartnerMessage = require('../views/AccountabilityPartnerMessage');
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
        const channelGoals = ChannelController.getChannel(client,CHANNEL_GOALS)
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
								notificationThread.send(TodoReminderMessage.missYesterdayProgress(member.id))
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

    static remindMissTwoDays(client){
        const channelGoals = ChannelController.getChannel(client,CHANNEL_GOALS)

        let ruleReminderSkipTwoDays = new schedule.RecurrenceRule();
		ruleReminderSkipTwoDays.hour = Time.minus7Hours(21)
		ruleReminderSkipTwoDays.minute = 0

		schedule.scheduleJob(ruleReminderSkipTwoDays,function(){
			if (!Time.isCooldownPeriod()) {
				supabase.from("Users")
					.select('id,goalId,name')
					.eq('lastDone',Time.getDateOnly(Time.getNextDate(-3)))
					.then(dataUsers =>{
						if (dataUsers.body) {
							dataUsers.body.forEach(async data=>{
								const goalThread = await ChannelController.getThread(channelGoals,data.goalId)
								goalThread.send(AccountabilityPartnerMessage.remindPartnerAfterMissTwoDays(data.id))
							})
						}
					})
			}
		})
    }
}

module.exports = DailyStreakController
