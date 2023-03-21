const { CHANNEL_BOOST } = require("../helpers/config");
const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const ChannelController = require("./ChannelController");
const schedule = require('node-schedule');
const Time = require("../helpers/time");
const supabase = require("../helpers/supabaseClient");
const BoostMessage = require("../views/BoostMessage");
const MemberController = require("./MemberController");
const PointController = require("./PointController");
const DailyReport = require("./DailyReport");
const LocalData = require("../helpers/LocalData");
class BoostController{

	static showModalPersonalBoost(interaction){
		const [commandButton,userId] = interaction.customId.split('_')
        if(commandButton === 'personalBoost' || commandButton === 'inactiveReply'){
			if(interaction.user.id === userId) return interaction.reply({ephemeral:true,content:BoostMessage.warningBoostYourself()})

			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("📝 Send message")
			.addComponents(
				new TextInputComponent().setCustomId('message').setLabel("Message").setPlaceholder("Boost with personal message...").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

    static async remindBoostInactiveMember(client){
        const channelBoost = ChannelController.getChannel(client,CHANNEL_BOOST)
        let ruleRemindBoost = new schedule.RecurrenceRule();
		ruleRemindBoost.hour = Time.minus7Hours(8)
		ruleRemindBoost.minute = 0
		schedule.scheduleJob(ruleRemindBoost,async function(){
			if (!Time.isCooldownPeriod()) {
				const [dataSkipThreeDay,dataSkipTenDay,dataInactiveUser] = Promise.all([
					supabase.from("Users")
						.select()
						.eq('lastDone',Time.getDateOnly(Time.getNextDate(-4)))
						.eq('onVacation',false)
						.lt('lastSafety',Time.getDateOnly(Time.getNextDate(-1)))
						.gte('endMembership',Time.getDateOnly(Time.getDate())),
					supabase.from("Users")
						.select()
						.eq('lastDone',Time.getDateOnly(Time.getNextDate(-11)))
						.eq('onVacation',false)
						.lt('lastSafety',Time.getDateOnly(Time.getNextDate(-1)))
						.gte('endMembership',Time.getDateOnly(Time.getDate())),
					supabase.from("Users")
						.select()
						.eq('lastActive',Time.getDateOnly(Time.getNextDate(-7)))
						.eq('onVacation',false)
						.lt('lastSafety',Time.getDateOnly(Time.getNextDate(-1)))
						.gte('endMembership',Time.getDateOnly(Time.getDate()))
				])
				const totalBoost = dataSkipThreeDay.body.length + dataSkipTenDay.body.length + dataInactiveUser.body.length
				if(totalBoost > 0){
					await ChannelController.updateChannelVisibilityForMember(client,CHANNEL_BOOST,true)
					BoostController.incrementTotalBoostLocal(totalBoost)
				}
				if (dataSkipThreeDay.body.length > 0) {
					dataSkipThreeDay.body.forEach(async member=>{
						const {user} = await MemberController.getMember(client,member.id)
						const msg = await channelBoost.send(BoostMessage.notMakingProgress3Days(user))
						supabase.from("Reminders")
							.insert({
								message:msg.id,
								UserId:member.id,
								type:'boost'
							}).then()
					})
				}


				if(dataSkipTenDay.body.length > 0){
					dataSkipTenDay.body.forEach(async member=>{
						const {user} = await MemberController.getMember(client,member.id)
						const msg = await channelBoost.send(BoostMessage.notMakingProgress10Days(user))
						supabase.from("Reminders")
							.insert({
								message:msg.id,
								UserId:member.id,
								type:'boost'
							}).then()
					})
				}
					
				if (dataInactiveUser.body.length > 0) {
					dataInactiveUser.body.forEach(async member=>{
						const {user} = await MemberController.getMember(client,member.id)
						const msg = await channelBoost.send(BoostMessage.notActive5Days(user))
						supabase.from("Reminders")
							.insert({
								message:msg.id,
								UserId:member.id,
								type:'boost'
							}).then()
					})
				}
				
			}
		})
    }

	static remindUserAboutToLoseStreak(client){
		const channelBoost = ChannelController.getChannel(client,CHANNEL_BOOST)
		let ruleRemindBoost = new schedule.RecurrenceRule();
		ruleRemindBoost.hour = Time.minus7Hours(20)
		ruleRemindBoost.minute = 15
		schedule.scheduleJob(ruleRemindBoost,function(){
			if (!Time.isCooldownPeriod()) {
				supabase.from("Users")
					.select()
					.eq('lastDone',Time.getDateOnly(Time.getNextDate(-2)))
					.neq('lastSafety',Time.getTodayDateOnly())
					.eq('onVacation',false)
					.gte('currentStreak',4)
					.then(data =>{
						if (data.body.length > 0) {
							ChannelController.updateChannelVisibilityForMember(client,CHANNEL_BOOST,true)
							BoostController.incrementTotalBoostLocal(data.body.length)
							data.body.forEach(async member=>{
								const {user} = await MemberController.getMember(client,member.id)
								const msg = await channelBoost.send(BoostMessage.aboutToLoseStreak(user,member.currentStreak))
								supabase.from("Reminders")
									.insert({
										message:msg.id,
										UserId:member.id,
										type:'boost'
									}).then()
							})
						}
					})
			}
		})
	}

	static remindEveryMonday(client){
		schedule.scheduleJob(`1 0 ${Time.minus7Hours(7)} * * 1`,async function() {
			supabase.from("Users")
				.select('id,notificationId')
				.gte('endMembership',Time.getDateOnly(Time.getDate()))
				.then(data=>{
					if (data.body.length > 0) {
						data.body.forEach(async member=>{
							const {id:userId,notificationId} = member
							ChannelController.sendToNotification(
								client,
								BoostMessage.remindToBoost(userId),
								userId,
								notificationId
							)
						})
					}
				})
		})
	}

	static async interactionBoostBack(interaction,targetUser){
		await DailyReport.activeMember(interaction.client,interaction.user.id)
		const {isMoreThanOneMinute,isIncrementPoint} = await PointController.validateTimeBoost(interaction.user.id,targetUser.user.id)
		if(isIncrementPoint) PointController.addPoint(interaction.user.id,'boost')
		if (isMoreThanOneMinute) {
			const totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
			ChannelController.sendToNotification(
				interaction.client,
				BoostMessage.boostBack(targetUser.user,interaction.user,totalBoost),
				targetUser.user.id
			)
			await interaction.editReply(BoostMessage.successBoostBack(targetUser.user))
		}else{
			await interaction.editReply(BoostMessage.warningSpamBoost())
		}

	}

	static async interactionBoostInactiveMember(interaction,targetUser){
		await DailyReport.activeMember(interaction.client,interaction.user.id)
		const {isMoreThanOneMinute,isIncrementPoint} = await PointController.validateTimeBoost(interaction.user.id,targetUser.user.id)
		if(isIncrementPoint) PointController.addPoint(interaction.user.id,'boost')
		if (isMoreThanOneMinute) {
			const totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,targetUser.user.id)
			ChannelController.sendToNotification(
				interaction.client,
				BoostMessage.sendBoostToInactiveMember(targetUser.user,interaction.user,totalBoost),
				targetUser.user.id
			)
			await interaction.editReply(BoostMessage.successSendBoost(targetUser.user))
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
					lastBoost:new Date()
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
					lastBoost:new Date(),
				})
				.then()
		}

		supabase.from("Users")
			.update({lastActive:Time.getTodayDateOnly()})
			.eq('id',senderId)
			.then()

		return totalBoost
	}

	static resetChannelBoost(client){
		const channelBoost = ChannelController.getChannel(client,CHANNEL_BOOST)
		let ruleResetBoost = new schedule.RecurrenceRule();
		ruleResetBoost.hour = Time.minus7Hours(23)
		ruleResetBoost.minute = 59
		schedule.scheduleJob(ruleResetBoost,function(){
			const totalBoost = BoostController.getTotalBoost()
			if(totalBoost > 0){
				channelBoost.bulkDelete(totalBoost,true)
				BoostController.resetTotalBoost()
				ChannelController.updateChannelVisibilityForMember(client,CHANNEL_BOOST,false)
			}
		})
	}

	static getTotalBoost(){
		const {totalBoost} = LocalData.getData()
		return totalBoost
	}

	static incrementTotalBoostLocal(num){
		const data = LocalData.getData()
		data.totalBoost = BoostController.getTotalBoost() + num
		LocalData.writeData(data)
	}

	static resetTotalBoost(){
		const data = LocalData.getData()
		data.totalBoost = 0
		LocalData.writeData(data)
	}

	static async deleteBoostMessage(client,userId){
		const dataBoost = await supabase.from("Reminders")
			.select("id,message")
			.eq('type','boost')
			.eq("UserId",userId)
			.gte('createdAt',new Date(Time.getTodayDateOnly()).toUTCString())
		if(dataBoost.body?.length <= 0) return

		const channelBoost = ChannelController.getChannel(client,CHANNEL_BOOST)
		dataBoost.body.forEach(async boost=>{
			const msg = await ChannelController.getMessage(channelBoost,boost.message)
			msg.delete()
			await supabase.from('Reminders')
				.delete()
				.eq('id',boost.id)
		})
	}
}

module.exports = BoostController