const schedule = require('node-schedule');
const { GUILD_ID, CHANNEL_CLOSA_CAFE, ROLE_MORNING_CLUB, ROLE_NIGHT_CLUB } = require('../helpers/config');
const LocalData = require('../helpers/getData');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const ChannelController = require('./ChannelController');
class EventController {
    static recurringCoworkingSession(client){
        let ruleCoworkingSession = new schedule.RecurrenceRule();
        
        ruleCoworkingSession.hour = 22
        ruleCoworkingSession.minute = 0
        schedule.scheduleJob(ruleCoworkingSession,function(){
            Promise.all([
                EventController.scheduleEvent(client,{
                    name:"Closa: Co-working Morning 🧑‍💻👩‍💻☕️🔆 ",
                    description:`Feel free to join at anytime!\n07.00 — Start \n11.30 — Ended`,
                    scheduledStartTime:EventController.addOneDay(EventController.getStartTimeMorningSession()),
                    scheduledEndTime:EventController.addOneDay(EventController.getEndTimeMorningSession()),
                    entityType:"VOICE",
                    channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
                }),
                EventController.scheduleEvent(client,{
                    name:"Closa: Co-working Night 🧑‍💻👩‍💻☕️🌙 ",
                    description:`Feel free to join at anytime!\n20.00 — Start \n22.00 — Ended`,
                    scheduledStartTime:EventController.addOneDay(EventController.getStartTimeNightSession()),
                    scheduledEndTime:EventController.addOneDay(EventController.getEndTimeNightSession()),
                    entityType:"VOICE",
                    channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
                })
            ])
            .then(([morning,night])=>{
                const data = LocalData.getData()
                data.morning = morning.id
                data.night = night.id
                LocalData.writeData(data)
            })
        })

        let ruleStopMorningSession = new schedule.RecurrenceRule();
        
        ruleStopMorningSession.hour = Time.minus7Hours(11)
        ruleStopMorningSession.minute = 30
        schedule.scheduleJob(ruleStopMorningSession,function(){
            const data = LocalData.getData()
            EventController.stopEvent(client ,data.morning)
        })
        let ruleStopNightSession = new schedule.RecurrenceRule();
        
        ruleStopNightSession.hour = Time.minus7Hours(22)
        ruleStopNightSession.minute = 0
        schedule.scheduleJob(ruleStopNightSession,function(){
            const data = LocalData.getData()
            EventController.stopEvent(client, data.night)
        })
    }

    /**
     * 
     * @param {*} client 
     * @param {*} {
        name: string;
        scheduledStartTime: DateResolvable;
        scheduledEndTime?: DateResolvable;
        entityType:  "EXTERNAL" || VOICE || STAGE_INSTANCE
        description?: string;
        channel?: GuildVoiceChannelResolvable;
        entityMetadata?: GuildScheduledEventEntityMetadataOptions;
        reason?: string;
     * } 
     */

    static async scheduleEvent(client,{
        name,
        description,
        scheduledStartTime,
        scheduledEndTime,
        entityType,
        location,
        channel
    }){
        return client.guilds.cache.get(GUILD_ID).scheduledEvents.create({
            name,
            description,
            scheduledStartTime,
            scheduledEndTime,
            entityType,
            entityMetadata:{location},
            channel,
            privacyLevel:"GUILD_ONLY",
        })
    }

    static async startEvent(client,eventId){
       const event =  await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch(eventId)	
       if (!event.isActive()) {
            event.setStatus("ACTIVE")
       }
    }
    static async stopEvent(client,eventId){
       const event =  await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch(eventId)	
       if (!event.isCompleted()) {
            event.setStatus("COMPLETED")
       }
    }

    static addOneDay(date){
        date.setDate(date.getDate()+1)
        return date
    }

    static getStartTimeMorningSession(isStartNow){
        const date = new Date()
        if (isStartNow) {
            date.setMinutes(date.getMinutes() + 15)
            if (date.getTime() > this.getEndTimeMorningSession().getTime()) {
                date.setMinutes(this.getEndTimeMorningSession().getMinutes()-1)
            }
        }else{
            date.setHours(Time.minus7Hours(7))
            date.setMinutes(0)
        }
        
        return date
    }
    static getEndTimeMorningSession(){
        const date = new Date()
        date.setHours(Time.minus7Hours(11))
        date.setMinutes(30)
        return date
    }
    static getStartTimeNightSession(isStartNow){
        const date = new Date()
        if (isStartNow) {
            date.setMinutes(date.getMinutes() + 15)
            if (date.getTime() > this.getEndTimeNightSession().getTime()) {
                date.setMinutes(this.getEndTimeNightSession().getMinutes()-1)
            }
        }else{
            date.setHours(Time.minus7Hours(20))
            date.setMinutes(0)
        }
        return date
    }
    static getEndTimeNightSession(){
        const date = new Date()
        date.setHours(Time.minus7Hours(22))
        date.setMinutes(0)
        return date
    }

    static async handleStartCoworkingSession(client){
        const data = LocalData.getData()
        if (EventController.isRangeMorningSession()) {
            const event = await EventController.getDetailEvent(client,data.morning)
            const isCompleted = event.status === "COMPLETED"
            let isScheduled = event.status === "SCHEDULED"
            if (isCompleted) {
                const event = await EventController.scheduleEvent(client,{
                        name:"Closa: Co-working Morning 🧑‍💻👩‍💻☕️🔆 ",
                        description:`Feel free to join at anytime!\n07.00 — Start \n11.30 — Ended`,
                        scheduledStartTime:EventController.getStartTimeMorningSession(true),
                        scheduledEndTime:EventController.getEndTimeMorningSession(),
                        entityType:"VOICE",
                        channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
                    })
                isScheduled = event.status === "SCHEDULED"
                data.morning = event.id
                LocalData.writeData(data)
            }
            if(isScheduled) {
                EventController.startEvent(client,data.morning)
                EventController.sendNotificationStartEvent(client,"Morning",data.morning)
            }
        }else if(EventController.isRangeNightSession()){
            const event = await EventController.getDetailEvent(client,data.night)
            const isCompleted = event.status === "COMPLETED"
            let isScheduled = event.status === "SCHEDULED"
            if (isCompleted) {
                const event = await EventController.scheduleEvent(client,{
                        name:"Closa: Co-working Night 🧑‍💻👩‍💻☕️🌙 ",
                        description:`Feel free to join at anytime!\n20.00 — Start \n22.00 — Ended`,
                        scheduledStartTime:EventController.getStartTimeNightSession(true),
                        scheduledEndTime:EventController.getEndTimeNightSession(),
                        entityType:"VOICE",
                        channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
                    })
                    
                isScheduled = event.status === "SCHEDULED"
                data.night = event.id
                LocalData.writeData(data)
            }
            if(isScheduled) {
                EventController.startEvent(client,data.night)
                EventController.sendNotificationStartEvent(client,"Night",data.night)
            }
        }
    }

    static isRangeMorningSession(){
        const time = new Date().getTime()
        return time > EventController.getStartTimeMorningSession().getTime() && time < EventController.getEndTimeMorningSession().getTime()
    }
    static isRangeNightSession(){
        const time = new Date().getTime()
        return time > EventController.getStartTimeNightSession().getTime() && time < EventController.getEndTimeNightSession().getTime()
    }

    static async getAllEvent(client){
        try {
            return await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch()
        } catch (error) {
            return error
        }
    }
    static async getDetailEvent(client,eventId){
        try {
            return await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch(eventId)
        } catch (error) {
            return error
        }
    }

    static handleLastUserLeaveEvent(client){
        const data = LocalData.getData()
        if (this.isRangeMorningSession()) {
            this.stopEvent(client,data.morning)
            EventController.scheduleEvent(client,{
                name:"Closa: Co-working Morning 🧑‍💻👩‍💻☕️🔆 ",
                description:`Feel free to join at anytime!\n07.00 — Start \n11.30 — Ended`,
                scheduledStartTime:EventController.getStartTimeMorningSession(true),
                scheduledEndTime:EventController.getEndTimeMorningSession(),
                entityType:"VOICE",
                channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
            }).then((morning) => {
                console.log("🚀 ~ file: EventController.js ~ line 225 ~ EventController ~ handleLastUserLeaveEvent ~ morning", morning)
                const data = LocalData.getData()
                data.morning = morning.id
                LocalData.writeData(data)
            })
        }else if(this.isRangeNightSession()){
            this.stopEvent(client,data.night)
            EventController.scheduleEvent(client,{
                name:"Closa: Co-working Night 🧑‍💻👩‍💻☕️🌙 ",
                description:`Feel free to join at anytime!\n20.00 — Start \n22.00 — Ended`,
                scheduledStartTime:EventController.getStartTimeNightSession(true),
                scheduledEndTime:EventController.getEndTimeNightSession(),
                entityType:"VOICE",
                channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
            }).then((night)=>{
                const data = LocalData.getData()
                data.night = night.id
                LocalData.writeData(data)
            })
        }
    }
    static async sendNotificationStartEvent(client, type,eventId){
        const roleId = type === "Morning" ? ROLE_MORNING_CLUB : ROLE_NIGHT_CLUB
        const members = await client.guilds.cache.get(GUILD_ID).members.fetch()
        members.forEach(member=>{
            if (!member.user.bot) {
                member.roles.cache.forEach(role=>{
                    if (role.id === roleId) {
                        supabase.from("Users")
                            .select('notification_id')
                            .eq('id',member.id)
                            .single()
                            .then(async data => {
                                const notificationId = data.body.notification_id
                                const notificationThread = await ChannelController.getNotificationThread(client,member.id,notificationId)
                                notificationThread.send(` ${role} co-working hour just started at ☕️ Closa café.
Let’s join the session.

https://discord.com/events/${GUILD_ID}/${eventId}`)
                                // console.log(role.name,member.user.username,notificationId);
                            })
                    }
                })
            }
        })
    }
}

module.exports = EventController