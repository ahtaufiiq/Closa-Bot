const { CHANNEL_TIMELINE_CATEGORY, CHANNEL_TIMELINE_STATUS, CHANNEL_TIMELINE_DAY_LEFT, CHANNEL_CLOSA_CAFE, CHANNEL_GENERAL, CHANNEL_CELEBRATE } = require("../helpers/config")
const LocalData = require("../helpers/LocalData.js")
const Time = require("../helpers/time")
const ChannelController = require("./ChannelController")
const schedule = require('node-schedule');
const supabase = require("../helpers/supabaseClient");
const TimelineStatusMessage = require("../views/TimelineStatusMessage");
const DailyStreakController = require("./DailyStreakController");
const { GuildScheduledEventEntityType } = require("discord.js");
class TimelineController{
    static getDayLeft(toDate){
        const diff = Time.getDate(toDate).getTime() - Time.getDate().getTime()
        return Math.floor(diff/ 1000 / 60 /60/24)
    }

    static updateTimeline(client){
        let ruleUpdateTimeline = new schedule.RecurrenceRule();
        
        ruleUpdateTimeline.hour = 17
        ruleUpdateTimeline.minute = 1
        schedule.scheduleJob(ruleUpdateTimeline,function(){
            const todayDate = Time.getTodayDateOnly()
            const tomorrowDate = Time.getDateOnly(Time.getNextDate(1))
            const data = LocalData.getData()

            ChannelController.changeName(client,'1086508511439110266',`🍜Runway: ${TimelineController.getDayLeft('2023-06-30')} days`)
    
            if(todayDate === data.kickoffDate){
                data.celebrationDate = Time.addDateByWeek(data.kickoffDate,6)
                LocalData.writeData(data)
                ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline`)
                ChannelController.changeName(client,CHANNEL_TIMELINE_STATUS,"Kick-off day 🚀")
                ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,"Today at 20.00 WIB")

                TimelineController.updateCohort(client)
            }else if(tomorrowDate === data.kickoffDate){
                ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline`)
                ChannelController.changeName(client,CHANNEL_TIMELINE_STATUS,"Kick-off day 🚀")
                ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,"Tomorrow at 20.00 WIB")
            }else if (todayDate <= data.celebrationDate) {
                const dayLeft = TimelineController.getDayLeft(data.celebrationDate)
                if (dayLeft === 27) {
                    data.kickoffDate = Time.addDateByWeek(data.kickoffDate,7)
                    LocalData.writeData(data)
                }
                ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline`)
                ChannelController.changeName(client,CHANNEL_TIMELINE_STATUS,"Demo day 🔥")
                if (todayDate === data.celebrationDate) {
                    data.deadlineGoal = Time.addDateByWeek(data.deadlineGoal,7)
                    LocalData.writeData(data)
                    ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,"Today at 20.00 WIB")
                }else if(tomorrowDate === data.celebrationDate){
                    ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,"Tomorrow at 20.00 WIB")
                }else{
                    ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,`In ${dayLeft} ${dayLeft > 1 ? "days" : "day"} `)
                }
            }else{
                const dayLeft = TimelineController.getDayLeft(data.kickoffDate)
                if(dayLeft === 6) {
                    DailyStreakController.addSafetyCooldown()
                }
                ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline`)
                ChannelController.changeName(client,CHANNEL_TIMELINE_STATUS,"Cooldown 🏖")
                ChannelController.changeName(client,CHANNEL_TIMELINE_DAY_LEFT,`In ${dayLeft} ${dayLeft > 1 ? "days" : "day"} before kick-off`)
            }

        })
        
    }
    static updateCohort(client){
        const data = LocalData.getData()
        data.cohort ++
        ChannelController.changeName(client,CHANNEL_TIMELINE_CATEGORY,`Timeline`)
        LocalData.writeData(data)
    }

    static sendNotif2DaysBeforeKickoffDay(client){
        const {kickoffDate} = LocalData.getData()
        const date = Time.getDate(kickoffDate)
        date.setDate(date.getDate()-2)
        date.setHours(Time.minus7Hours(20))
        date.setMinutes(0)
        schedule.scheduleJob(date,function() {
            const channelGeneral = ChannelController.getChannel(client,CHANNEL_GENERAL)
            channelGeneral.send(TimelineStatusMessage.notificationBeforeKickoffDay())
        })
    }
    static sendNotifShareStoryCelebrationDay(client){
        const {celebrationDate} = LocalData.getData()
        const date = Time.getDate(celebrationDate)
        date.setHours(Time.minus7Hours(20))
        date.setMinutes(45)
        schedule.scheduleJob(date,function() {
            supabase.from("Users")
            .select('id,notificationId')
            .gte('endMembership',Time.getDateOnly(Time.getDate()))
            .then(data=>{
                if (data.body.length > 0) {
                    data.body.forEach(async member=>{
                        const {id:userId,notificationId} = member
                        ChannelController.sendToNotification(
                            client,
                            TimelineStatusMessage.notificationShareStory(userId),
                            userId,
                            notificationId
                        )
                    })
                }
            })
        })
    }
    static sendNotifBeforeCelebration(client){
        const {celebrationDate} = LocalData.getData()
        const date = Time.getDate(celebrationDate)
        date.setDate(date.getDate()-1)
        date.setHours(Time.minus7Hours(8))
        date.setMinutes(0)
        schedule.scheduleJob(date,function() {
            const channelGeneral = ChannelController.getChannel(client,CHANNEL_GENERAL)
            channelGeneral.send(TimelineStatusMessage.notificationBeforeCelebrationDay())

        })
    }
    static sendNotif5DaysBeforeCelebration(client){
        const {celebrationDate} = LocalData.getData()
        const date = Time.getDate(celebrationDate)
        date.setDate(date.getDate()-5)
        date.setHours(Time.minus7Hours(8))
        date.setMinutes(0)
        schedule.scheduleJob(date,async function() {
            ChannelController.updateChannelVisibilityForMember(client,CHANNEL_CELEBRATE,true)
            TimelineController.createCelebrationEvent(client)
            const channelGeneral = ChannelController.getChannel(client,CHANNEL_GENERAL)
            channelGeneral.send(TimelineStatusMessage.notificationBeforeCelebrationDay(5))
        })
    }

    static async createCelebrationEvent(client){
        const startCelebrationDate = Time.getDate(LocalData.getData().celebrationDate)
		startCelebrationDate.setHours(Time.minus7Hours(20))
		startCelebrationDate.setMinutes(0)

        const endCelebrationDate = Time.getDate(LocalData.getData().celebrationDate)
		endCelebrationDate.setHours(Time.minus7Hours(21))
		endCelebrationDate.setMinutes(30)
        const celebrationEvent = await ChannelController.scheduleEvent(client,{
            name:"Celebration Day 🥳🎉",
            description:`**(Mandatory event).**
Prepare 10 slides to tell your project story. Feel free to get creative with your own format!

Deck Guidelines & inspo → https://closa.notion.site/Celebration-Day-5c1aa3ea23b349db8b23b80b5c59db40

**Agenda:**
19.50 — Open Gate
20.00 — Event Started, select 1 lucky person.
20.05 — Main Stage for 1 Lucky Person
20.20 — Group Sharing Session.
21.15 — Celebrate together: Post & Share your project.
21.20 — Closing, Announcement, etc.
21.30 — Ended

**Goal of Celebration day**
The goal is to share a story about your progress & celebrate our progress together.
I hope you hit your goal before the celebration event started and try your best

**Rules:**
• Don't be late, and respect everyone's time.
• Open your camera during the session.
• Be kind.`,
            scheduledStartTime:startCelebrationDate,
            scheduledEndTime:endCelebrationDate,
            entityType:GuildScheduledEventEntityType.Voice,
            channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
        })
        const data = LocalData.getData()
        data.celebrationEventId = celebrationEvent.id
        LocalData.writeData(data)

        return celebrationEvent.id
	}
}

module.exports = TimelineController