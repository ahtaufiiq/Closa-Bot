const schedule = require('node-schedule');
const { CHANNEL_WELCOME, ROLE_NEW_MEMBER, ROLE_MEMBER } = require('../helpers/config');
const Email = require('../helpers/Email');
const LocalData = require('../helpers/LocalData.js');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const PaymentMessage = require('../views/PaymentMessage');
const ChannelController = require('./ChannelController');
const MemberController = require('./MemberController');

class PaymentController{

    static getEndedMembership(dayLeft=0){
        return supabase.from('Users')
        .select('id,endMembership,notificationId')
        .eq('endMembership',Time.getReminderDate(dayLeft))
    }
    static async remindMember(client){
        let rulePaymentReminder = new schedule.RecurrenceRule();
		rulePaymentReminder.hour = Time.minus7Hours(19)
		rulePaymentReminder.minute = 30
		schedule.scheduleJob(rulePaymentReminder,function(){
            
            PaymentController.getEndedMembership(5)
                .then(async data=>{
                    if (data.body) {
                        data.body.forEach(dataUser=>{
                            PaymentController.sendMembershipReminder(client,dataUser,5)
                        })
                    }
                })

			PaymentController.getEndedMembership(1)
                .then(async data=>{
                    if (data.body) {
                        data.body.forEach(dataUser=>{
                            PaymentController.sendMembershipReminder(client,dataUser,1)
                        })
                    }
                })
			PaymentController.getEndedMembership()
                .then(async data=>{
                    if (data.body) {
                        data.body.forEach(dataUser=>{
                            PaymentController.sendMembershipReminder(client,dataUser)
                        })
                    }
                })
		})

        let ruleLatePaymentReminder = new schedule.RecurrenceRule();
		ruleLatePaymentReminder.hour = Time.minus7Hours(19)
		ruleLatePaymentReminder.minute = 30
		schedule.scheduleJob(rulePaymentReminder,function(){
            PaymentController.getEndedMembership(-1)
                .then(async data=>{
                    if (data.body) {
                        data.body.forEach(async dataUser=>{
                            const {id,endMembership,notificationId} = dataUser
                            const user = await MemberController.getMember(client,id)
                            const notificationThread = await ChannelController.getNotificationThread(client,id,notificationId)
                            user.send(PaymentMessage.remindMembershipLateOneDay(id))
                                .catch(err=>console.log("Cannot send message to user"))
                            notificationThread.send(PaymentMessage.remindMembershipLateOneDay(id))
                        })
                    }
                })
            PaymentController.getEndedMembership(-3)
                .then(async data=>{
                    if (data.body) {
                        data.body.forEach(async dataUser=>{
                            const {id,endMembership,notificationId} = dataUser
                            const user = await MemberController.getMember(client,id)
                            const notificationThread = await ChannelController.getNotificationThread(client,id,notificationId)
                            user.send(PaymentMessage.remindMembershipLateThreeDay(id))
                                .catch(err=>console.log("Cannot send message to user"))
                            notificationThread.send(PaymentMessage.remindMembershipLateThreeDay(id))
                        })
                    }
                })
        })

        let ruleRemindJoinNextCohort = new schedule.RecurrenceRule();
		ruleRemindJoinNextCohort.hour = Time.minus7Hours(21)
		ruleRemindJoinNextCohort.minute = 0
		schedule.scheduleJob(rulePaymentReminder,function(){
            PaymentController.getEndedMembership(-3)
                .then(async data=>{
                    if (data.body) {
                        data.body.forEach(async dataUser=>{
                            const {id,endMembership,notificationId} = dataUser
                            const user = await MemberController.getMember(client,id)
                            user.send(PaymentMessage.remindJoinNextCohort(id))
                                .catch(err=>console.log("Cannot send message to user"))
                            MemberController.removeRole(client,id,ROLE_NEW_MEMBER)
                            MemberController.removeRole(client,id,ROLE_MEMBER)
                        })
                    }
                })
        })
    }
    static async sendMembershipReminder(client,dataUser,dayLeft=0){
        const {id,endMembership,notificationId} = dataUser
        const user = await MemberController.getMember(client,id)
        const notificationThread = await ChannelController.getNotificationThread(client,id,notificationId)
        const endMembershipDate = Time.getFormattedDate(Time.getDate(endMembership))
        user.send(PaymentMessage.remindEndedMembership(id,endMembershipDate,dayLeft))
            .catch(err=>console.log("Cannot send message to user"))
        notificationThread.send(PaymentMessage.remindEndedMembership(id,endMembershipDate,dayLeft))
    }
    static sendEmailReminder(members,dayLeft=0){
        const endedMembership = Time.getFormattedDate(Time.getNextDate(dayLeft))
        Email.sendPaymentReminder(members,`${dayLeft} ${dayLeft > 1 ?"days":"day"}`,endedMembership)
    }

    static async setReminderJoinNextCohort(client,userId){
        const {kickoffDate} = LocalData.getData()
        const diffDay = Time.getDiffDay(Time.getDate(),Time.getDate(kickoffDate))
        let dateOnly = diffDay >= 7 ? kickoffDate : Time.addDateByWeek(kickoffDate,5);
        const formattedDateKickoffCohort = Time.getFormattedDate(Time.getDate(dateOnly))

        const reminder5daysBeforeCohort = Time.getNextDate(-5,dateOnly)
        reminder5daysBeforeCohort.setHours(Time.minus7Hours(19))
        reminder5daysBeforeCohort.setMinutes(0)

        const reminder1dayBeforeCohort = Time.getNextDate(-1,dateOnly)
        reminder1dayBeforeCohort.setHours(Time.minus7Hours(19))
        reminder1dayBeforeCohort.setMinutes(0)
        const data = await supabase.from("Reminders")
            .select()
            .eq('type',"joinNextCohort")
            .eq('UserId',userId)
            .eq('time',reminder5daysBeforeCohort.toUTCString())
        
        if (data.body.length === 0) {
            supabase.from('Reminders')
            .insert([
                {
                    time:reminder5daysBeforeCohort,
                    UserId:userId,
                    type:'joinNextCohort',
                    message:'5'
                },
                {
                    time:reminder1dayBeforeCohort,
                    UserId:userId,
                    type:'joinNextCohort',
                    message:'1'
                }
            ])
            .then()

            schedule.scheduleJob(reminder5daysBeforeCohort,async function () {
                const user = await MemberController.getMember(client,userId)
                user.send(PaymentMessage.remind5DaysBeforeKickoff(userId,formattedDateKickoffCohort))
                    .catch(err=>console.log("Cannot send message to user"))
            })
            schedule.scheduleJob(reminder1dayBeforeCohort,async function () {
                const user = await MemberController.getMember(client,userId)
                user.send(PaymentMessage.remind1DayBeforeKickoff(userId))
                    .catch(err=>console.log("Cannot send message to user"))
            })
        }
    }

    static async remindJoinCohort(client){
        supabase.from('Reminders')
			.select('UserId,time,message')
			.gte('time',new Date().toUTCString())
			.eq('type',"joinNextCohort")
			.then(data=>{
				if (data.body) {
                    data.body.forEach(reminder=>{
                        schedule.scheduleJob(reminder.time,async function() {
                            const user = await MemberController.getMember(client,reminder.UserId)
                            if (reminder.message === "5") {
                                const {kickoffDate} = LocalData.getData()
                                user.send(PaymentMessage.remind5DaysBeforeKickoff(reminder.UserId,Time.getFormattedDate(Time.getDate(kickoffDate))))
                                    .catch(err=>console.log("Cannot send message to user"))
                            }else if(reminder.message === '1'){
                                user.send(PaymentMessage.remind1DayBeforeKickoff(reminder.UserId))
                                    .catch(err=>console.log("Cannot send message to user"))
                            }
                        })
                    })
                }
			})
    }
    

    static async remindBeforeKickoffCohort(client){
        const {kickoffDate} = LocalData.getData()
        const formattedKickoffDate = Time.getFormattedDate(Time.getDate(kickoffDate))
        const remind1DayBeforeKickoff = Time.getNextDate(-1,kickoffDate)
        remind1DayBeforeKickoff.setHours(Time.minus7Hours(20))
        remind1DayBeforeKickoff.setMinutes(0)

        const remind5DaysBeforeKickoff = Time.getNextDate(-5,kickoffDate)
        remind5DaysBeforeKickoff.setHours(Time.minus7Hours(20))
        remind5DaysBeforeKickoff.setMinutes(0)
        const channelWelcome = await  ChannelController.getChannel(client,CHANNEL_WELCOME)
        schedule.scheduleJob(remind1DayBeforeKickoff,function() {
           channelWelcome.send(PaymentMessage.remindBeforeKickoffCohort(formattedKickoffDate,1))
        })
        schedule.scheduleJob(remind5DaysBeforeKickoff,function() {
           channelWelcome.send(PaymentMessage.remindBeforeKickoffCohort(formattedKickoffDate,5))
        })
    }
    

    static async sendDiscordReminder(client, members,dayLeft){
        const endedMembership = Time.getFormattedDate(Time.getNextDate(dayLeft))
        for (let i = 0; i < members.length; i++) {
            const {id} = members[i];
            const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(id)
            user.send(PaymentMessage.remindEndedMembership(user,endedMembership))
                .catch(err=>console.log("Cannot send message to user"))
        }
    }
}

module.exports = PaymentController