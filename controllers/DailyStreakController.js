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
			supabase.from("Users")
				.select('id,name,goal_id')
				.gte('current_streak',3)
				.eq('last_done',Time.getDateOnly(Time.getNextDate(-2)))
				.then(data=>{
					data.body.forEach(async member=>{
						if (member.goal_id) {
							const thread = await ChannelController.getThread(channelGoals,member.goal_id)
							thread.send(TodoReminderMessage.missYesterdayProgress(member.id))
						}
					})
			})
		})
    }

    static remindMissTwoDays(client){
        const channelGoals = ChannelController.getChannel(client,CHANNEL_GOALS)

        let ruleReminderSkipTwoDays = new schedule.RecurrenceRule();
		ruleReminderSkipTwoDays.hour = Time.minus7Hours(21)
		ruleReminderSkipTwoDays.minute = 0

		schedule.scheduleJob(ruleReminderSkipTwoDays,function(){
			const date = Time.getDate()
			if(date.getDay() == 0 && date.getDay() == 6) return
			
			let lastDone = Time.getDateOnly(Time.getNextDate(-3))
			supabase.from("Users")
			.select('id,goal_id,name')
			.eq('last_done',lastDone)
			.then(dataUsers =>{
				dataUsers.body.forEach(async data=>{
					if (data.goal_id) {
						const thread = await ChannelController.getThread(channelGoals,data.goal_id);
						thread.send(AccountabilityPartnerMessage.remindPartnerAfterMissTwoDays(data.id))
					}
				})
			})
			
		})
    }
}

module.exports = DailyStreakController
