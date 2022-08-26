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
				.eq('last_active',Time.getDateOnly(Time.getNextDate(-6)))
				.gte('end_membership',Time.getDateOnly(Time.getDate()))
				.then(data=>{
					if (data.body.length > 0) {
						data.body.forEach(member=>{
							MemberController.changeRole(client,member.id,ROLE_ACTIVE_MEMBER,ROLE_INACTIVE_MEMBER)
							channelStatus.send(StatusReportMessage.inactiveMemberReport(member.id,member.email,member.goal_id))
						})
					}
				})
		})

    }
    static async activeMember(client,userId){
        MemberController.hasRole(client,userId,ROLE_INACTIVE_MEMBER).then(hasRole=>{
			if (hasRole) {
				const channelStatus = ChannelController.getChannel(client,CHANNEL_STATUS)
				MemberController.changeRole(client,userId,ROLE_INACTIVE_MEMBER,ROLE_ACTIVE_MEMBER)
				supabase.from("Points")
					.select("*,Users(id,email,goal_id)")
					.eq('UserId',userId)
					.lt('date',Time.getDateOnly(Time.getDate()))
					.order('date',{ascending:false})
					.limit(1)
					.single()
					.then(data => {
						channelStatus.send(StatusReportMessage.activeMemberReport(data.body.Users.id,data.body.Users.email,data.body.Users.goal_id,data.body.date))
					})
			}
		})

    }
}

module.exports = DailyReport