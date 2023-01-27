const schedule = require('node-schedule');
const { GUILD_ID, CHANNEL_CLOSA_CAFE, ROLE_MORNING_CLUB, ROLE_NIGHT_CLUB, MY_ID } = require('../helpers/config');
const LocalData = require('../helpers/LocalData.js');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const CoworkingMessage = require('../views/CoworkingMessage');
const ChannelController = require('./ChannelController');

class CoworkingController {
    static recurringCoworkingSession(client){

        let ruleCoworkingSession = new schedule.RecurrenceRule();
        
        ruleCoworkingSession.hour = 22
        ruleCoworkingSession.minute = 0
        schedule.scheduleJob(ruleCoworkingSession,function(){
            if(CoworkingController.isNotTuesday()){
                Promise.all([
                    CoworkingController.createCoworkingEvent(client,'morning','tomorrow'),
                    CoworkingController.createCoworkingEvent(client,'night','tomorrow'),
                ])
                .then(([morning,night])=>{
                    const data = LocalData.getData()
                    data.night = night.id
                    data.morning = morning.id
                    LocalData.writeData(data)
                })
            }
        })

        let ruleStopMorningSession = new schedule.RecurrenceRule();
        
        ruleStopMorningSession.hour = Time.minus7Hours(11)
        ruleStopMorningSession.minute = 30
        schedule.scheduleJob(ruleStopMorningSession,function(){
            const data = LocalData.getData()
            CoworkingController.stopEvent(client ,data.morning)
        })

        let ruleStopNightSession = new schedule.RecurrenceRule();
        
        ruleStopNightSession.hour = Time.minus7Hours(22)
        ruleStopNightSession.minute = 0
        schedule.scheduleJob(ruleStopNightSession,function(){
            const data = LocalData.getData()
            CoworkingController.stopEvent(client, data.night)
        })
    }

    //startTime = 'now' || 'tomorrow'
    static async createCoworkingEvent(client,type='morning',startTime){
        let name = type === 'morning' ? CoworkingMessage.titleCoworkingMorning() : CoworkingMessage.titleCoworkingNight()
        let description = type === 'morning' ? CoworkingMessage.descriptionCoworkingMorning() : CoworkingMessage.descriptionCoworkingNight()
        let scheduledStartTime = CoworkingController.getStartTimeCoworkingSession(type,startTime)
        let scheduledEndTime = CoworkingController.getEndTimeCoworkingSession(type,startTime)
        
        return await CoworkingController.scheduleEvent(client,{
            name,
            description,
            scheduledStartTime,
            scheduledEndTime,
            entityType:"VOICE",
            channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
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

    static getStartTimeCoworkingSession(type='morning',startTime){
        const date = new Date()
        const isStartNow = startTime === 'now'
        if(type === 'morning'){
            if (isStartNow) {
                date.setMinutes(date.getMinutes() + 15)
                if (date.getTime() > this.getEndTimeCoworkingSession("morning").getTime()) {
                    date.setMinutes(this.getEndTimeCoworkingSession("morning").getMinutes()-1)
                }
            }else{
                date.setHours(Time.minus7Hours(7))
                date.setMinutes(0)
            }
        }else{
            if (isStartNow) {
                date.setMinutes(date.getMinutes() + 15)
                if (date.getTime() > this.getEndTimeCoworkingSession('night').getTime()) {
                    date.setMinutes(this.getEndTimeCoworkingSession('night').getMinutes()-1)
                }
            }else{
                date.setHours(Time.minus7Hours(20))
                date.setMinutes(0)
            }
        }

        if(startTime === 'tomorrow') CoworkingController.addOneDay(date)
        
        return date
    }
    static getEndTimeCoworkingSession(type ='morning',startTime){
        const date = new Date()
        if(type==='morning'){
            date.setHours(Time.minus7Hours(11))
            date.setMinutes(30)
        }else{
            date.setHours(Time.minus7Hours(22))
            date.setMinutes(0)
        }

        if(startTime === 'tomorrow') CoworkingController.addOneDay(date)
        return date
    }

    static async handleStartCoworkingSession(client){
        const data = LocalData.getData()
        if (CoworkingController.isRangeMorningSession()) {
            const event = await CoworkingController.getDetailEvent(client,data.morning)
            const isCompleted = event.status === "COMPLETED"
            let isScheduled = event.status === "SCHEDULED"
            if (isCompleted) {
                const event = await CoworkingController.createCoworkingEvent(client,'morning','now')
                isScheduled = event.status === "SCHEDULED"
                data.morning = event.id
                LocalData.writeData(data)
            }
            if(isScheduled) {
                CoworkingController.startEvent(client,data.morning)
                CoworkingController.sendNotificationStartEvent(client,"Morning",data.morning)
            }
        }else if(CoworkingController.isRangeNightSession()){
            const event = await CoworkingController.getDetailEvent(client,data.night)
            const isCompleted = event.status === "COMPLETED"
            let isScheduled = event.status === "SCHEDULED"
            if (isCompleted) {
                const event = await CoworkingController.createCoworkingEvent(client,'night','now')
                    
                isScheduled = event.status === "SCHEDULED"
                data.night = event.id
                LocalData.writeData(data)
            }
            if(isScheduled) {
                CoworkingController.startEvent(client,data.night)
            }
        }
    }

    static isNotTuesday(){
        return Time.getDay() !== "Tuesday"
    }

    static isRangeMorningSession(){
        const time = new Date().getTime()
        return time > CoworkingController.getStartTimeCoworkingSession().getTime() && time < CoworkingController.getEndTimeCoworkingSession().getTime() && CoworkingController.isNotTuesday()
    }
    static isRangeNightSession(){
        const time = new Date().getTime()
        return time >= CoworkingController.getStartTimeCoworkingSession('night').getTime() && time < CoworkingController.getEndTimeCoworkingSession('night').getTime() && CoworkingController.isNotTuesday()
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
            CoworkingController.createCoworkingEvent(client,'morning','now').then((morning) => {
                const data = LocalData.getData()
                data.morning = morning.id
                LocalData.writeData(data)
            })
        }else if(this.isRangeNightSession()){
            this.stopEvent(client,data.night)
            CoworkingController.createCoworkingEvent(client,'night','now').then((night)=>{
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
                            .select('id,notificationId')
                            .eq('id',member.id)
                            .single()
                            .then(async data => {
                                const notificationId = data.body.notificationId
                                const notificationThread = await ChannelController.getNotificationThread(client,member.id,notificationId)
                                notificationThread.send(CoworkingMessage.notifCoworkingStarted(type,data.body.id,eventId))
                            })
                    }
                })
            }
        })
    }
}

module.exports = CoworkingController