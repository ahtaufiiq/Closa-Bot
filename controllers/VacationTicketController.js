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
			.select("id,currentStreak,notificationId")
			.eq('lastDone',Time.getDateOnly(Time.getNextDate(-2)))
			.gte('currentStreak',2)
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