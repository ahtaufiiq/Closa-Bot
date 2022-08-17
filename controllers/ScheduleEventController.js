const schedule = require('node-schedule');
const { GUILD_ID, CHANNEL_CLOSA_CAFE } = require('../helpers/config');
const Time = require('../helpers/time');
const ChannelController = require('./ChannelController');
class ScheduleEventController {
    static recurringCoworkingSession(client){
        let ruleCoworkingSession = new schedule.RecurrenceRule();
        
        ruleCoworkingSession.hour = Time.minus7Hours(5)
        ruleCoworkingSession.minute = 0
        schedule.scheduleJob(ruleCoworkingSession,function(){

            ScheduleEventController.scheduleEvent(client,{
                name:"Closa: Co-working Morning 🧑‍💻👩‍💻☕️🔆 ",
                description:`Feel free to join at anytime!\n07.00 — Start \n11.30 — Ended`,
                scheduledStartTime:ScheduleEventController.getStartTimeMorningSession(),
                scheduledEndTime:ScheduleEventController.getEndTimeMorningSession(),
                entityType:"VOICE",
                channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
            })
            ScheduleEventController.scheduleEvent(client,{
                name:"Closa: Co-working Night 🧑‍💻👩‍💻☕️🌙 ",
                description:`Feel free to join at anytime!\n20.00 — Start \n22.00 — Ended`,
                scheduledStartTime:ScheduleEventController.getStartTimeNightSession(),
                scheduledEndTime:ScheduleEventController.getEndTimeNightSession(),
                entityType:"VOICE",
                channel:ChannelController.getChannel(client,CHANNEL_CLOSA_CAFE)
            })
        
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

    static scheduleEvent(client,{
        name,
        description,
        scheduledStartTime,
        scheduledEndTime,
        entityType,
        location,
        channel
    }){

        client.guilds.cache.get(GUILD_ID).scheduledEvents.create({
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

    static async startEvent(client,idEvent){
       const event =  await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch(idEvent)	
       event.setStatus("ACTIVE")
    }
    static async stopEvent(client,idEvent){
       const event =  await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch(idEvent)	
       event.setStatus("COMPLETED")
    }

    static getStartTimeMorningSession(){
        const date = Time.getDate()
        date.setHours(Time.minus7Hours(7))
        date.setMinutes(0)
        return date
    }
    static getEndTimeMorningSession(){
        const date = Time.getDate()
        date.setHours(Time.minus7Hours(11))
        date.setMinutes(30)
        return date
    }
    static getStartTimeNightSession(){
        const date = Time.getDate()
        date.setHours(Time.minus7Hours(20))
        date.setMinutes(0)
        return date
    }
    static getEndTimeNightSession(){
        const date = Time.getDate()
        date.setHours(Time.minus7Hours(22))
        date.setMinutes(0)
        return date
    }
}

module.exports = ScheduleEventController