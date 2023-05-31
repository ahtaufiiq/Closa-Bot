const schedule = require('node-schedule');
const DailyStreakMessage = require('../views/DailyStreakMessage');
const MemberController = require('./MemberController');
const {ROLE_7STREAK,ROLE_30STREAK,ROLE_100STREAK,ROLE_365STREAK, CHANNEL_GOALS, CHANNEL_STREAK, TIMEZONE, ROLE_200STREAK, CHANNEL_ACHIEVEMENTS} = require('../helpers/config');
const Time = require('../helpers/time');
const supabase = require('../helpers/supabaseClient');
const ChannelController = require('./ChannelController');
const RequestAxios = require('../helpers/axios');
const InfoUser = require('../helpers/InfoUser');
const GenerateImage = require('../helpers/GenerateImage');
const { AttachmentBuilder } = require('discord.js');
const UserController = require('./UserController');
const PartyController = require('./PartyController');
const PartyMessage = require('../views/PartyMessage');
const MessageComponent = require('../helpers/MessageComponent');
class DailyStreakController {

    static remindMissOneDay(client){
        let ruleReminderMissOneDay = new schedule.RecurrenceRule();
		ruleReminderMissOneDay.hour = Time.minus7Hours(6)
		ruleReminderMissOneDay.minute = 0
		schedule.scheduleJob(ruleReminderMissOneDay,function(){
			if (!Time.isCooldownPeriod()) {
				supabase.from("Users")
					.select('id,name,notificationId')
					.eq('onVacation',false)
					.gte('currentStreak',2)
					.eq('lastDone',Time.getDateOnly(Time.getNextDate(-2)))
					.then(data=>{
						if (data.body) {
							data.body.forEach(async member=>{
								const {id:userId,notificationId} =  member
								ChannelController.sendToNotification(
									client,
									DailyStreakMessage.missYesterdayProgress(userId),
									userId,
									notificationId
								)
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
				const yesterdayDate =  new Date()
				yesterdayDate.setDate(yesterdayDate.getDate() - 1)
				supabase.from("Users")
					.select()
					.gte('currentStreak',2)
					.eq('onVacation',false)
					.eq('lastDone',Time.getDateOnly(yesterdayDate))
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
									const buffer = await GenerateImage.tracker(user,goalName,avatarUrl,progressRecently,longestStreak,totalDay,totalPoint)
									const attachment = new AttachmentBuilder(buffer,{name:`progress_tracker_${user.username}.png`})
									channelStreak.send(DailyStreakMessage.activateSafetyDot(user,currentStreak,longestStreak,attachment))
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
					.select('id,name,currentStreak,notificationId')
					.gte('currentStreak',2)
					.eq('onVacation',false)
					.eq('lastDone',Time.getDateOnly(Time.getNextDate(-2)))
					.then(data=>{
						if (data.body) {
							data.body.forEach(async member=>{
								const {id:userId,notificationId,currentStreak} = member
								ChannelController.sendToNotification(
									client,
									DailyStreakMessage.remindUserAboutToLoseStreak(userId,currentStreak),
									userId,
									notificationId
								)
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
						UserController.updateLastSafety(Time.getDateOnly(Time.getNextDate(6)),member.id)

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

	static async addSafetyDot(userId,date){
		return await supabase.from("Todos")
			.insert({
				createdAt:date,
				updatedAt:date,
				UserId:userId,
				type:'safety'
			})
	}

	static sendRepairStreak(client){
		let ruleReminderRepairStreak = new schedule.RecurrenceRule();
		ruleReminderRepairStreak.hour = Time.minus7Hours(6)
		ruleReminderRepairStreak.minute = 0
		schedule.scheduleJob(ruleReminderRepairStreak,function(){
			if (!Time.isCooldownPeriod()) {
				const threeDayBefore = Time.getDateOnly(Time.getNextDate(-3))
				const twoDayBefore = Time.getDateOnly(Time.getNextDate(-2))
				supabase.from("Users")
					.select('id,name,currentStreak,notificationId,lastDone,lastSafety')
					.gte('currentStreak',21)
					.or(`lastDone.eq.${threeDayBefore},lastSafety.eq.${twoDayBefore}`)
					.then(data=>{
						if (data.body) {
							data.body.forEach(async member=>{
								const {id:userId,notificationId,currentStreak,lastDone,lastSafety} = member
								if((lastDone === threeDayBefore && lastSafety <= threeDayBefore) || (lastSafety === twoDayBefore && lastDone < twoDayBefore)){
									const isValidGetRepairStreak = await DailyStreakController.isValidGetRepairStreak(userId)
									if(isValidGetRepairStreak){
										const msg = await ChannelController.sendToNotification(
											client,
											DailyStreakMessage.repairStreak(currentStreak,userId,DailyStreakController.getTimeLeftRepairStreak(Time.getTodayDateOnly())),
											userId,
											notificationId
										)
										DailyStreakController.countdownRepairStreak(msg)
										DailyStreakController.insertRepairStreak(userId,msg.id)
									}
								}
							})
						}
				})
			}
		})
	}

	static countdownRepairStreak(msg){
		const countdownRepairStreak = setInterval(async () => {
			const time = DailyStreakController.getTimeLeftRepairStreak(Time.getTodayDateOnly())
			let content = msg.content.split('Time left:')[0]
			msg.edit(`${content}Time left: \`\`${time}\`\` ⏳`)
				.catch(()=>{
					clearInterval(countdownRepairStreak)
				})
			if(time.includes('-')){
				clearInterval(countdownRepairStreak)
				msg.edit({
					components:[
						MessageComponent.createComponent(
							MessageComponent.addLinkEmojiButton('Repair for IDR 49.900','https://tally.so/r/n9BWrX','🛠️').setDisabled(true),
							MessageComponent.addEmojiButton(`repairStreak_${userId}`,'Repair for 3500 pts',"🪙","SUCCESS").setDisabled(true),
						)
					]
				})
				.catch(()=>{
					clearInterval(countdownRepairStreak)
				})
			}
		}, 1000 * 60);
	}

	static getTimeLeftRepairStreak(dateOnly){
		const endDate = Time.getNextDate(1,dateOnly)
		endDate.setHours(endDate.getHours() - Number(TIMEZONE))
		const diffTime = Time.getDiffTime(Time.getDate(),endDate)
		return `${Time.convertTime(diffTime,'short')} left`
	}

	static async insertRepairStreak(UserId,messageNotificationId,channelDMId,msgDMId){
		return await supabase.from("RepairStreaks")
			.insert({
				UserId,messageNotificationId,channelDMId,msgDMId,date:Time.getTodayDateOnly()
			})
	}

	static async isValidGetRepairStreak(userId){

		await supabase.from("RepairStreaks")
			.delete()
			.eq('UserId',userId).is('isRepair',false)

		const data = await supabase.from("RepairStreaks")
			.select()
			.eq('UserId',userId)
			.gte('createdAt',Time.getBeginningOfTheMonth().toUTCString())
			.is('isRepair',true)
			.limit(1)
			.single()

		const alreadyBuyRepairStreak = data.body
		return !alreadyBuyRepairStreak
	}

	static async updateIsRepairStreak(userId,isRepair=true){
		
		const data = await supabase.from("RepairStreaks")
			.update({isRepair})
			.eq('UserId',userId)
			.gte('createdAt',Time.getBeginningOfTheMonth().toUTCString())
		return data
	}

	static async generateHabitBuilder(client,user){
		const {data} = await UserController.getDetail(user.id,'goalId,longestStreak,totalDay,totalPoint')
		let goalName = ''

		if (data?.goalId) {
			const channel = ChannelController.getChannel(client,CHANNEL_GOALS)
			const thread = await ChannelController.getThread(channel,data.goalId)
			goalName = thread.name.split('by')[0]
		}
		if(data){
			const progressRecently = await RequestAxios.get('todos/tracker/'+user.id)
			const avatarUrl = InfoUser.getAvatar(user)
			const buffer = await GenerateImage.tracker(user,goalName||"Consistency",avatarUrl,progressRecently,data.longestStreak,data.totalDay,data.totalPoint)
			const files = [new AttachmentBuilder(buffer,{name:`progress_tracker_${user.username}.png`})]
			return files
		}
	}

	static async applyRepairStreak(client,user){
		await Promise.all([
			DailyStreakController.addSafetyDot(user.id,Time.getNextDate(-1)),
			DailyStreakController.addSafetyDot(user.id,Time.getNextDate(-2))
		])
		UserController.updateLastSafety(Time.getDateOnly(Time.getNextDate(-1)),user.id)
		const files = await DailyStreakController.generateHabitBuilder(client,user)
		DailyStreakController.updateIsRepairStreak(user.id)
		PartyController.updateRecapAfterRepairStreak(user.id)
		return DailyStreakMessage.successRepairStreak(user,files)
	}
}

module.exports = DailyStreakController
