const schedule = require('node-schedule');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const ChannelController = require('./ChannelController');
const MemberController = require('./MemberController');
class VacationTicketController {
    static remindAboutToLoseStreak(client){
		let ruleRemindBoost = new schedule.RecurrenceRule();
		ruleRemindBoost.hour = Time.minus7Hours(20)
		ruleRemindBoost.minute = 0
		schedule.scheduleJob(ruleRemindBoost,function(){
			supabase.from("Users")
			.select("id,current_streak,notification_id")
			.eq('last_done',Time.getDateOnly(Time.getNextDate(-2)))
			.gte('current_streak',2)
			.then(data =>{
				if (data.body.length > 0) {
					data.body.forEach(async member=>{
						const {user} = await MemberController.getMember(client,member.id)
						const notificationThread = await ChannelController.getNotificationThread(client,member.id)
					})
				}
			})
		})
    }
}

module.exports = VacationTicketController