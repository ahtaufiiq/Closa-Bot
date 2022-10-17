const { CHANNEL_BOOST } = require("../helpers/config");
const ChannelController = require("./ChannelController");
const schedule = require('node-schedule');
const Time = require("../helpers/time");
const supabase = require("../helpers/supabaseClient");
const BoostMessage = require("../views/BoostMessage");
const MemberController = require("./MemberController");
const PointController = require("./PointController");
const DailyReport = require("./DailyReport");
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
				.eq('last_done',Time.getDateOnly(Time.getNextDate(-3)))
				.gte('end_membership',Time.getDateOnly(Time.getDate()))
				.then(data=>{
					if (data.body.length > 0) {
						data.body.forEach(async member=>{
                            const {user} = await MemberController.getMember(client,member.id)
							channelBoost.send(BoostMessage.notMakingProgress2Days(user))
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

	static async interactionBoostBack(interaction,targetUser){
		
		PointController.addPoint(interaction.user.id,'boost')
		DailyReport.activeMember(interaction.client,interaction.user.id)
		const isMoreThanOneMinute = await BoostController.isPreviousBoostMoreThanOneMinute(interaction.user.id,targetUser.user.id)
		if (isMoreThanOneMinute) {
			PointController.incrementTotalPoints(5,interaction.user.id)
			const totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
			notificationThreadTargetUser.send(BoostMessage.boostBack(targetUser.user,interaction.user,totalBoost))
			await interaction.editReply(BoostMessage.successBoostBack(targetUser.user))
		}else{
			await interaction.editReply(BoostMessage.warningSpamBoost())
		}

	}

	static async interactionBoostInactiveMember(interaction,targetUser){
		PointController.addPoint(interaction.user.id,'boost')
		DailyReport.activeMember(interaction.client,interaction.user.id)
		const isMoreThanOneMinute = await BoostController.isPreviousBoostMoreThanOneMinute(interaction.user.id,targetUser.user.id)
		if (isMoreThanOneMinute) {
			PointController.incrementTotalPoints(5,interaction.user.id)
			const totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
			notificationThreadTargetUser.send(BoostMessage.sendBoostToInactiveMember(targetUser.user,interaction.user,totalBoost))
			await interaction.editReply({embeds:[BoostMessage.successSendBoost(targetUser.user)]})
		}else {
			await interaction.editReply(BoostMessage.warningSpamBoost())
		}
	}
	static async incrementTotalBoost(senderId,targetUserId){
		const id = `${senderId}_${targetUserId}`
		let data = await supabase.from("Boosts")
			.select('total')
			.eq('id',id)
			.single()

		let totalBoost = data.body ? data.body.total + 1 : 1
		if (data.body) {
			supabase.from("Boosts")	
				.update({
					total:totalBoost,
					last_boost:Time.getDate()
				})
				.eq('id',id)
				.then()
		}else{
			supabase.from("Boosts")
				.insert({
					id,
					senderId,
					targetUserId,
					total:1,
					last_boost:Time.getDate(),
				})
				.then()
		}

		supabase.from("Users")
			.update({last_active:Time.getTodayDateOnly()})
			.eq('id',senderId)
			.then()

		return totalBoost
	}

	static remindUserAboutToLoseStreak(client){
		const channelBoost = ChannelController.getChannel(client,CHANNEL_BOOST)
		let ruleRemindBoost = new schedule.RecurrenceRule();
		ruleRemindBoost.hour = Time.minus7Hours(20)
		ruleRemindBoost.minute = 15
		schedule.scheduleJob(ruleRemindBoost,function(){
			supabase.from("Users")
			.select("id,current_streak")
			.eq('last_done',Time.getDateOnly(Time.getNextDate(-2)))
			.gte('current_streak',5)
			.then(data =>{
				if (data.body.length > 0) {
					data.body.forEach(async member=>{
						const {user} = await MemberController.getMember(client,member.id)
						channelBoost.send(BoostMessage.aboutToLoseStreak(user,member.current_streak))
					})
				}
			})
		})
		
	}

	static async isPreviousBoostMoreThanOneMinute(senderId,targetUserId){
		const id = `${senderId}_${targetUserId}`
		let data = await supabase.from("Boosts")
			.select()
			.eq("id",id)
			.single()
		let isMoreThanOneMinute = false

		if(data?.body){
			if (Time.isMoreThanOneMinute(data.body.last_boost)) {
				isMoreThanOneMinute = true
			}
		}else{
			isMoreThanOneMinute = true
		}
		return isMoreThanOneMinute
	}
}

module.exports = BoostController