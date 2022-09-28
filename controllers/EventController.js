const schedule = require('node-schedule');
const { GUILD_ID, CHANNEL_CLOSA_CAFE, ROLE_MORNING_CLUB, ROLE_NIGHT_CLUB, MY_ID } = require('../helpers/config');
const LocalData = require('../helpers/getData');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const EventMessage = require('../views/EventMessage');
const ChannelController = require('./ChannelController');
const MemberController = require('./MemberController');

class EventController {
    static recurringCoworkingSession(client){
        let ruleCoworkingSession = new schedule.RecurrenceRule();
        
        ruleCoworkingSession.hour = 22
        ruleCoworkingSession.minute = 0
        schedule.scheduleJob(ruleCoworkingSession,function(){
            EventController.scheduleEvent(client,{
                name:EventMessage.titleCoworkingNight(),
                description:EventMessage.descriptionCoworkingNight(),
                scheduledStartTime:EventController.addOneDay(EventController.getStartTimeNightSession()),
                scheduledEndTime:EventController.addOneDay(EventController.getEndTimeNightSession()),
                entityType:"VOICE",
                channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
            })
            .then(night=>{
                const data = LocalData.getData()
                data.night = night.id
                LocalData.writeData(data)
            })
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
        try {
            const event =  await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch(eventId)	
            if (!event.isActive()) {
                 event.setStatus("ACTIVE")
            }
        } catch (error) {
            
        }
      
    }
    static async stopEvent(client,eventId){
        try {
            const event =  await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch(eventId)	
            if (!event.isCompleted() && event.isActive()) {
                 event.setStatus("COMPLETED")
            }
        } catch (error) {
            
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
            date.setHours(Time.minus7Hours(19))
            date.setMinutes(30)
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
        if(EventController.isRangeNightSession()){
            const event = await EventController.getDetailEvent(client,data.night)
            const isCompleted = event.status === "COMPLETED"
            let isScheduled = event.status === "SCHEDULED"
            if (isCompleted) {
                const event = await EventController.scheduleEvent(client,{
                        name:EventMessage.titleCoworkingNight(),
                        description:EventMessage.descriptionCoworkingNight(),
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
        if(this.isRangeNightSession()){
            this.stopEvent(client,data.night)
            EventController.scheduleEvent(client,{
                name:EventMessage.titleCoworkingNight(),
                description:EventMessage.descriptionCoworkingNight(),
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
                            .select('id,notification_id')
                            .eq('id',member.id)
                            .single()
                            .then(async data => {
                                const notificationId = data.body.notification_id
                                const notificationThread = await ChannelController.getNotificationThread(client,member.id,notificationId)
                                notificationThread.send(` ${type === "Morning" ? "🌤 Morning Club":"🌙 Night Club"} co-working hour just started at ☕️ Closa café.
Let’s join the session. <@${data.body.id}>

https://discord.com/events/${GUILD_ID}/${eventId}`)
                            })
                    }
                })
            }
        })
    }
}

module.exports = EventController