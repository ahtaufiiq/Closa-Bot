const schedule = require('node-schedule');
const { CHANNEL_STATUS } = require('../helpers/config');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const StatusReportMessage = require('../views/StatusReportMessage');
const ChannelController = require('./ChannelController');
const MemberController = require('./MemberController');
class DailyReport {
    static inactiveMember(client){
        const channelStatus = ChannelController.getChannel(client,CHANNEL_STATUS)
        let ruleStatusReport = new schedule.RecurrenceRule();
		ruleStatusReport.hour = Time.minus7Hours(8)
		ruleStatusReport.minute = 0
		schedule.scheduleJob(ruleStatusReport,function(){
			supabase.from("Users")
				.select()
				.eq('last_active',Time.getDateOnly(Time.getNextDate(-5)))
				.then(data=>{
					if (data.body.length > 0) {
						data.body.forEach(member=>{
							MemberController.addRole(client,member.id,ROLE_INACTIVE_MEMBER)
							channelStatus.send(StatusReportMessage.inactiveMemberReport(member.id,member.email,member.goal_id))
						})
					}
				})
		})

    }
}

module.exports = DailyReport