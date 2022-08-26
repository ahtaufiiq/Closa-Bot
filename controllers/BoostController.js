const { CHANNEL_BOOST } = require("../helpers/config");
const ChannelController = require("./ChannelController");
const schedule = require('node-schedule');
const Time = require("../helpers/time");
const supabase = require("../helpers/supabaseClient");
const BoostMessage = require("../views/BoostMessage");
const MemberController = require("./MemberController");
class BoostController{
    static remindBoostInativeMember(client){
        const channelBoost = ChannelController.getChannel(client,CHANNEL_BOOST)
        let ruleRemindBoost = new schedule.RecurrenceRule();
		ruleRemindBoost.hour = Time.minus7Hours(8)
		ruleRemindBoost.minute = 0
		schedule.scheduleJob(ruleRemindBoost,function(){
			supabase.from("Users")
				.select()
				.eq('last_active',Time.getDateOnly(Time.getNextDate(-6)))
				.gte('end_membership',Time.getDateOnly(Time.getDate()))
				.then(data=>{
					if (data.body.length > 0) {
						data.body.forEach(async member=>{
                            const {user} = await MemberController.getMember(client,member.id)
							channelBoost.send(BoostMessage.notActive5Days(user))
						})
					}
				})
		})
    }
    static remindBoostNotMakingProgress3Days(client){
        const channelBoost = ChannelController.getChannel(client,CHANNEL_BOOST)
        let ruleRemindBoost = new schedule.RecurrenceRule();
		ruleRemindBoost.hour = Time.minus7Hours(8)
		ruleRemindBoost.minute = 0
		schedule.scheduleJob(ruleRemindBoost,function(){
			supabase.from("Users")
				.select()
				.eq('last_done',Time.getDateOnly(Time.getNextDate(-4)))
				.gte('end_membership',Time.getDateOnly(Time.getDate()))
				.then(data=>{
					if (data.body.length > 0) {
						data.body.forEach(async member=>{
                            const {user} = await MemberController.getMember(client,member.id)
							channelBoost.send(BoostMessage.notMakingProgress3Days(user))
						})
					}
				})
		})
    }

	static remindEveryMonday(client){
		schedule.scheduleJob(`1 0 ${Time.minus7Hours(7)} * * 1`,async function() {
			supabase.from("Users")
				.select('id,notification_id')
				.gte('end_membership',Time.getDateOnly(Time.getDate()))
				.then(data=>{
					if (data.body.length > 0) {
						data.body.forEach(async member=>{
							const notificationThread = await ChannelController.getNotificationThread(client,member.id,member.notification_id)
							notificationThread.send(BoostMessage.remindToBoost(member.id))
						})
					}
				})
		})
	}
}

module.exports = BoostController