const { CHANNEL_TIMELINE_CATEGORY, CHANNEL_TIMELINE_STATUS, CHANNEL_TIMELINE_DAY_LEFT } = require("../helpers/config")
const LocalData = require("../helpers/getData")
const Time = require("../helpers/time")
const ChannelController = require("./ChannelController")
const schedule = require('node-schedule');
const supabase = require("../helpers/supabaseClient");
const TimelineStatusMessage = require("../views/TimelineStatusMessage");
class TimelineController{
    static getDayLeft(toDate){
        const diff = Time.getDate(toDate).getTime() - Time.getDate().getTime()
        return Math.ceil(diff/ 1000 / 60 /60/24)
    }

    static updateTimeline(client){
        let ruleUpdateTimeline = new schedule.RecurrenceRule();
        
        ruleUpdateTimeline.hour = 17
        ruleUpdateTimeline.minute = 1
        schedule.scheduleJob(ruleUpdateTimeline,function(){
            const todayDate = Time.getTodayDateOnly()
            const tomorrowDate = Time.getDateOnly(Time.getNextDate(1))
            const data = LocalData.getData()
    
            if(todayDate === data.kickoffDate){
                data.celebrationDate = TimelineController.addDate(data.celebrationDate,4)
                LocalData.writeData(data)
                ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline: Cohort ${data.cohort}`)
                ChannelController.changeName(client,CHANNEL_TIMELINE_STATUS,"Kick-off day 🚀")
                ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,"Today at 20.00 WIB")

                const updateCohortDate =  Time.getDate()
                updateCohortDate.setHours(Time.minus7Hours(20))
                updateCohortDate.setMinutes(30)
                TimelineController.updateCohort(client,updateCohortDate)
            }else if(tomorrowDate === data.kickoffDate){
                ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline: Cohort ${data.cohort}`)
                ChannelController.changeName(client,CHANNEL_TIMELINE_STATUS,"Kick-off day 🚀")
                ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,"Tomorrow at 20.00 WIB")
            }else if (todayDate <= data.celebrationDate) {
                if (data.kickoffDate < data.celebrationDate) {
                    data.kickoffDate = TimelineController.addDate(data.kickoffDate,5)
                    LocalData.writeData(data)
                }
                const dayLeft = this.getDayLeft(data.celebrationDate)
                ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline: Cohort ${data.cohort}`)
                ChannelController.changeName(client,CHANNEL_TIMELINE_STATUS,"Celebration day 🎉")
                if (todayDate === data.celebrationDate) {
                    ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,"Today at 20.00 WIB")
                }else if(tomorrowDate === data.celebrationDate){
                    ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,"Tomorrow at 20.00 WIB")
                }else{
                    ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,`In ${dayLeft} ${dayLeft > 1 ? "days" : "day"} `)
                }
            }else{
                const dayLeft = this.getDayLeft(data.celebrationDate)
                ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline: Cohort ${data.cohort}`)
                ChannelController.changeName(client,CHANNEL_TIMELINE_STATUS,"Cooldown 🏖")
                ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,`In ${dayLeft} ${dayLeft > 1 ? "days" : "day"} before kick-off`)
            }

        })
        
    }
    static updateCohort(client,date){
        schedule.scheduleJob(date,function(){
            const data = LocalData.getData()
            data.cohort ++
            ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline: Cohort ${data.cohort}`)
            LocalData.writeData(data)
        })
    }

    static addDate(dateOnly,totalweek){
        const date = Time.getDate(dateOnly)
        date.setDate(date.getDate() + (totalweek * 7))
        return Time.getDateOnly(date)
    }

    static sendNotif2DaysBeforeKickoffDay(client){
        const {kickoffDate} = LocalData.getData()
        const date = Time.getDate(kickoffDate)
        date.setDate(date.getDate()-2)
        date.setHours(Time.minus7Hours(20))
        date.setMinutes(0)
        schedule.scheduleJob(date,function() {
            supabase.from("Users")
            .select('id,notification_id')
            .gte('end_membership',Time.getDateOnly(Time.getDate()))
            .then(data=>{
                if (data.body.length > 0) {
                    data.body.forEach(async member=>{
                        const notificationThread = await ChannelController.getNotificationThread(client,member.id,member.notification_id)
                        notificationThread.send(TimelineStatusMessage.notificationKickoffDay(member.id))
                    })
                }
            })
        })
    }
    static sendNotifShareStoryCelebrationDay(client){
        const {celebrationDate} = LocalData.getData()
        const date = Time.getDate(celebrationDate)
        date.setHours(Time.minus7Hours(20))
        date.setMinutes(45)
        schedule.scheduleJob(date,function() {
            supabase.from("Users")
            .select('id,notification_id')
            .gte('end_membership',Time.getDateOnly(Time.getDate()))
            .then(data=>{
                if (data.body.length > 0) {
                    data.body.forEach(async member=>{
                        const notificationThread = await ChannelController.getNotificationThread(client,member.id,member.notification_id)
                        notificationThread.send(TimelineStatusMessage.notificationShareStory(member.id))
                    })
                }
            })
        })
    }
    static sendNotif2DaysBeforeCelebration(client){
        const {celebrationDate} = LocalData.getData()
        const date = Time.getDate(celebrationDate)
        date.setDate(date.getDate()-2)
        date.setHours(Time.minus7Hours(8))
        date.setMinutes(0)
        schedule.scheduleJob(date,function() {
            supabase.from("Users")
            .select('id,notification_id')
            .gte('end_membership',Time.getDateOnly(Time.getDate()))
            .then(data=>{
                if (data.body.length > 0) {
                    data.body.forEach(async member=>{
                        const notificationThread = await ChannelController.getNotificationThread(client,member.id,member.notification_id)
                        notificationThread.send(TimelineStatusMessage.notificationBeforeCelebrationDay(member.id))
                    })
                }
            })
        })
    }
    static sendNotif5DaysBeforeCelebration(client){
        const {celebrationDate} = LocalData.getData()
        const date = Time.getDate(celebrationDate)
        date.setDate(date.getDate()-5)
        date.setHours(Time.minus7Hours(8))
        date.setMinutes(0)
        schedule.scheduleJob(date,function() {
            supabase.from("Users")
            .select('id,notification_id')
            .gte('end_membership',Time.getDateOnly(Time.getDate()))
            .then(data=>{
                if (data.body.length > 0) {
                    data.body.forEach(async member=>{
                        const notificationThread = await ChannelController.getNotificationThread(client,member.id,member.notification_id)
                        notificationThread.send(TimelineStatusMessage.notificationBeforeCelebrationDay(member.id,5))
                    })
                }
            })
        })
    }
}

module.exports = TimelineController