const schedule = require('node-schedule');
const { CHANNEL_STATUS, ROLE_INACTIVE_MEMBER, ROLE_ACTIVE_MEMBER } = require('../helpers/config');
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
				.eq('lastActive',Time.getDateOnly(Time.getNextDate(-6)))
				.gte('endMembership',Time.getDateOnly(Time.getDate()))
				.then(data=>{
					if (data.body.length > 0) {
						data.body.forEach(member=>{
							MemberController.changeRole(client,member.id,ROLE_ACTIVE_MEMBER,ROLE_INACTIVE_MEMBER)
							channelStatus.send(StatusReportMessage.inactiveMemberReport(member.id,member.email,member.goalId))
						})
					}
				})
		})

    }
    static async activeMember(client,userId){
        // const hasRole = await MemberController.hasRole(client,userId,ROLE_INACTIVE_MEMBER)
		// if (hasRole) {
		// 	const channelStatus = ChannelController.getChannel(client,CHANNEL_STATUS)
		// 	MemberController.changeRole(client,userId,ROLE_INACTIVE_MEMBER,ROLE_ACTIVE_MEMBER)
		// 	const data = await supabase.from("Points")
		// 		.select("*,Users(id,email,goalId)")
		// 		.eq('UserId',userId)
		// 		.single()
				
		// 	if(data.body){
		// 		channelStatus.send(StatusReportMessage.activeMemberReport(data.body.Users.id,data.body.Users?.email,data.body.Users.goalId,data.body.updatedAt))
		// 	}
		// }

    }
}

module.exports = DailyReport