const schedule = require('node-schedule');
const { GUILD_ID, CHANNEL_CLOSA_CAFE, ROLE_MORNING_CLUB, ROLE_NIGHT_CLUB, MY_ID, CHANNEL_WEEKLY_SCYNC_CATEGORY, CHANNEL_UPCOMING_SESSION } = require('../helpers/config');
const LocalData = require('../helpers/LocalData.js');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const CoworkingMessage = require('../views/CoworkingMessage');
const ChannelController = require('./ChannelController');
const { GuildScheduledEventPrivacyLevel, GuildScheduledEvent, GuildScheduledEventEntityType,GuildScheduledEventStatus, ModalBuilder, TextInputBuilder, ActionRowBuilder, AttachmentBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { TextInputStyle } = require('discord.js');
const MemberController = require('./MemberController');
const UserController = require('./UserController');
const GenerateImage = require('../helpers/GenerateImage');
const InfoUser = require('../helpers/InfoUser');
const MessageFormatting = require('../helpers/MessageFormatting');


class CoworkingController {
    static showModalScheduleCoworking(interaction){
        if(interaction.customId === 'scheduleCoworking'){
			const modal = new ModalBuilder()
			.setCustomId(interaction.customId)
			.setTitle("Schedule a session 👨‍💻👩‍💻")

            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel("Event Title").setStyle(TextInputStyle.Short).setValue('Virtual Coworking').setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel("Date & Time (e.g. 28 apr at 20.00 wib)").setStyle(TextInputStyle.Short).setPlaceholder('today at 20.00 wib').setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('duration').setLabel("Duration (e.g. 50 min / 1 hr)").setStyle(TextInputStyle.Short).setPlaceholder('min or hr format').setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('totalSlot').setLabel("How many people (max 25)").setStyle(TextInputStyle.Short).setValue('9').setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rules').setLabel("Agenda & rules").setStyle(TextInputStyle.Paragraph).setPlaceholder(`5 min goal / 50 min focus / 5 min celebrate \n(feel free to delete or add based on your rules)`).setRequired(true))
            )
            
			interaction.showModal(modal);
			return true
		}
        return false
    }

    static showModalEditCoworking(interaction){
        const [commandButton,userId] = interaction.customId.split('_')
        if(commandButton === 'editCoworking'){
            if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't edit someone else session.`})
			const modal = new ModalBuilder()
			.setCustomId(interaction.customId)
			.setTitle("Edit Schedule a session 👨‍💻👩‍💻")

            CoworkingController.getCoworkingEvent(interaction.message.id)
                .then(data=>{
                    const {name,rules,date,totalMinute,totalSlot} = data.body
                    const duration = Time.convertTime(totalMinute)
                    const dateString = CoworkingController.formatDateToString(Time.getDate(date))
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel("Event Title").setStyle(TextInputStyle.Short).setValue(name).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel("Date & Time (e.g. 28 apr at 20.00 wib)").setStyle(TextInputStyle.Short).setValue(dateString).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('duration').setLabel("Duration (e.g. 50 min / 1 hr)").setStyle(TextInputStyle.Short).setValue(duration).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('totalSlot').setLabel("How many people (max 25)").setStyle(TextInputStyle.Short).setValue(`${totalSlot}`).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rules').setLabel("Agenda & rules").setStyle(TextInputStyle.Paragraph).setValue(rules).setRequired(true))
                    )
                    
                    interaction.showModal(modal);
                })

			return true
		}
        return false
    }

    static recurringCoworkingSession(client){

        let ruleCoworkingSession = new schedule.RecurrenceRule();
        
        ruleCoworkingSession.hour = 22
        ruleCoworkingSession.minute = 0
        schedule.scheduleJob(ruleCoworkingSession,function(){
            if(CoworkingController.isNotTuesday()){
                Promise.all([
                    CoworkingController.createEventDiscord(client,'morning','tomorrow'),
                    CoworkingController.createEventDiscord(client,'night','tomorrow'),
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
    static async createEventDiscord(client,type='morning',startTime){
        let name = type === 'morning' ? CoworkingMessage.titleCoworkingMorning() : CoworkingMessage.titleCoworkingNight()
        let description = type === 'morning' ? CoworkingMessage.descriptionCoworkingMorning() : CoworkingMessage.descriptionCoworkingNight()
        let scheduledStartTime = CoworkingController.getStartTimeCoworkingSession(type,startTime)
        let scheduledEndTime = CoworkingController.getEndTimeCoworkingSession(type,startTime)
        
        return await CoworkingController.scheduleEvent(client,{
            name,
            description,
            scheduledStartTime,
            scheduledEndTime,
            entityType:GuildScheduledEventEntityType.Voice,
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
            privacyLevel:GuildScheduledEventPrivacyLevel.GuildOnly,
        })
    }

    static async startEvent(client,eventId){
        try {
            const event =  await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch(eventId)	
            if (!event.isActive()) {
                 event.setStatus(GuildScheduledEventStatus.Active)
            }
        } catch (error) {
            
        }
      
    }
    static async stopEvent(client,eventId){
        try {
            const event =  await client.guilds.cache.get(GUILD_ID).scheduledEvents.fetch(eventId)	
            if (!event.isCompleted() && event.isActive()) {
                 event.setStatus(GuildScheduledEventStatus.Completed)
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
            const isCompleted = event.status === GuildScheduledEventStatus.Completed
            let isScheduled = event.status === GuildScheduledEventStatus.Scheduled
            if (isCompleted) {
                const event = await CoworkingController.createEventDiscord(client,'morning','now')
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
            const isCompleted = event.status === GuildScheduledEventStatus.Completed
            let isScheduled = event.status === GuildScheduledEventStatus.Scheduled
            if (isCompleted) {
                const event = await CoworkingController.createEventDiscord(client,'night','now')
                    
                isScheduled = event.status === GuildScheduledEventStatus.Scheduled
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

    static formatDateToString(date){
        let [weekday,month,day] = date.toLocaleDateString("en-US", { weekday: 'short', day:'2-digit',month:'short',}).split(/[, ]+/)
        let hours = date.getHours()
        let minutes = Time.getMinutesFromDate(date)
        if(day == Time.getDate().getDate()){
            return `today at ${hours}.${minutes} WIB`
        }else if(day == Time.getNextDate(-1).getDate()){
            return `tomorrow at ${hours}.${minutes} WIB`
        }else{
            return `${day} ${month} at ${hours}.${minutes} WIB`
        }
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
            CoworkingController.createEventDiscord(client,'morning','now').then((morning) => {
                const data = LocalData.getData()
                data.morning = morning.id
                LocalData.writeData(data)
            })
        }else if(this.isRangeNightSession()){
            this.stopEvent(client,data.night)
            CoworkingController.createEventDiscord(client,'night','now').then((night)=>{
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
                                const notificationId = data.body?.notificationId
                                ChannelController.sendToNotification(
                                    client,
                                    CoworkingMessage.notifCoworkingStarted(type,data.body.id,eventId),
                                    member.id,
                                    notificationId
                                )
                            })
                    }
                })
            }
        })
    }

    static async getSessionGuests(eventId){
        const data = await supabase.from("CoworkingAttendances")
            .select("UserId")
            .eq('EventId',eventId)
        const sessionGuests = []
        for (let i = 0; i < data.body?.length; i++) {
            const {UserId} = data.body[i];
            sessionGuests.push(MessageFormatting.tagUser(UserId))
        }
        return sessionGuests
    }

    static async updateCoworkingMessage(msg,isLive=false){
        const eventId = msg.id
        const [dataEvent,dataAttendances] = await Promise.all([
            supabase.from('CoworkingEvents')
            .select('*')
            .eq('id',eventId).single(),
            supabase.from("CoworkingAttendances")
                .select()
                .eq('EventId',eventId)
        ])

        
        const {name,totalSlot,rules,totalMinute,date,HostId,voiceRoomId} = dataEvent.body
        const {user} = await MemberController.getMember(msg.client,HostId)
        const files = await CoworkingController.generateImageCoworking(user,dataAttendances,date,totalMinute,name,isLive)
        msg.edit(CoworkingMessage.coworkingEvent(eventId,name,user,totalSlot,dataAttendances.body.length,rules,totalMinute,Time.getDate(date),files,isLive,voiceRoomId))
            
    }

    static async generateImageCoworking(host,dataAttendances,date,totalMinute,name,isLive){
        const attendances = []
        for (let i = 0; i < dataAttendances?.body?.length; i++) {
            const attendance = dataAttendances.body[i].avatarUrl;
            attendances.push(attendance)
        }
        const image = await GenerateImage.coworkingEvent({
            host,
            attendances,
            coworkingDate:Time.getDate(date),
            session:totalMinute,
            title:name,
            isLive
        })
        return [new AttachmentBuilder(image,{name:`coworking_event_${UserController.getNameFromUserDiscord(host)}.png`})]
    }

    static async addReminderCoworkingEvent(coworkingDate,UserId,CoworkingEventId){
        const fiveMinutesBefore = new Date(coworkingDate.valueOf())
        fiveMinutesBefore.setMinutes(fiveMinutesBefore.getMinutes()-5)
        supabase.from("Reminders")
            .insert([
                { message:CoworkingEventId, time:fiveMinutesBefore, type:'fiveMinutesBeforeCoworking',UserId},
                { message:CoworkingEventId, time:coworkingDate, type:'CoworkingEvent',UserId}
            ]).then()
    }
    
    static async createCoworkingEvent(modal){
        const name = modal.getTextInputValue('name');
        const duration = modal.getTextInputValue('duration');
        const date = modal.getTextInputValue('date');
        const totalSlot = modal.getTextInputValue('totalSlot');
        const rules = modal.getTextInputValue('rules');
        let totalMinute = Time.getTotalMinutes(duration)
        let {error,data:coworkingDate} = Time.convertToDate(date)
        if(error) return modal.editReply('invalid format date')

        const fiveMinutesBefore = new Date(coworkingDate.valueOf())
        fiveMinutesBefore.setMinutes(fiveMinutesBefore.getMinutes()-5)
        const files = await CoworkingController.generateImageCoworking(modal.user,null,coworkingDate,totalMinute,name,false)
        const channelUpcomingSession = ChannelController.getChannel(modal.client,CHANNEL_UPCOMING_SESSION)
        const msg = await channelUpcomingSession.send(CoworkingMessage.coworkingEvent('',name,modal.user,totalSlot,0,rules,totalMinute,Time.getDate(coworkingDate),files))
        modal.editReply(`✅ success scheduled your session → ${MessageFormatting.linkToMessage(CHANNEL_UPCOMING_SESSION,msg.id)}`)

        ChannelController.createThread(msg,name)
        msg.edit(CoworkingMessage.coworkingEvent(msg.id,name,modal.user,totalSlot,0,rules,totalMinute,Time.getDate(coworkingDate),files))
        const voiceRoomName = `${name} — ${UserController.getNameFromUserDiscord(modal.user)}`
        await supabase.from("CoworkingEvents")
        .insert({
            id:msg.id,
            rules,
            name,
            voiceRoomName,
            totalMinute,
            date:coworkingDate,
            totalSlot,
            HostId:modal.user.id
        })
        const isLessThanFiveMinutes = Time.getDiffTime(Time.getDate(),Time.getDate(coworkingDate)) < 5
        if(isLessThanFiveMinutes){
            CoworkingController.createFocusRoom(modal.client,voiceRoomName,msg.id,totalSlot,true)
        }else{
            CoworkingController.remindFiveMinutesBeforeCoworking(modal.client,fiveMinutesBefore,msg.id)
        }
        CoworkingController.addReminderCoworkingEvent(coworkingDate,modal.user.id,msg.id)
    }

    static async getCoworkingEvent(eventId){
        return await supabase.from("CoworkingEvents")
            .select()
            .eq('id',eventId)
            .single()
    }

    static async setReminderFiveMinutesBeforeCoworking(client){
		const data = await supabase.from("Reminders")
			.select()
			.eq('type',"fiveMinutesBeforeCoworking")
			.gte('time',new Date().toUTCString())
		if(data.body.length === 0 ) return
		for (let i = 0; i < data.body.length; i++) {
			const {time,message:eventId} = data.body[i];
            CoworkingController.remindFiveMinutesBeforeCoworking(client,time,eventId)
		}
	}

    static async createFocusRoom(client,roomName,eventId,totalSlot,isImmeadiatelyStart=false){
        const dataEvent = await supabase.from("CoworkingEvents")
            .select('*,CoworkingAttendances(UserId)')
            .eq('id',eventId)
            .single()
        
        const guild = client.guilds.cache.get(GUILD_ID)
        const permissionOverwrites = []
        if(!isImmeadiatelyStart) {
            permissionOverwrites.push({
                id:guild.roles.everyone.id,
                deny:[
                    PermissionFlagsBits.Connect
                ]
            })
            for (let i = 0; i < dataEvent.body.CoworkingAttendances.length; i++) {
                const userId = dataEvent.body.CoworkingAttendances[i].UserId;
                const {user} = await MemberController.getMember(client,userId)
                permissionOverwrites.push({
                    id:user.id,
                    allow:[
                        PermissionFlagsBits.Connect
                    ]
                })
            }
            const {user} = await MemberController.getMember(client,dataEvent.body.HostId)
            permissionOverwrites.push({
                id:user.id,
                allow:[
                    PermissionFlagsBits.Connect
                ]
            })
        }else{
            permissionOverwrites.push({
                id:guild.roles.everyone.id,
                allow:[
                    PermissionFlagsBits.Connect
                ]
            })
        }
        
        const voiceChannel = await guild.channels.create({
            name:roomName,
            permissionOverwrites,
            parent:ChannelController.getChannel(client,CHANNEL_WEEKLY_SCYNC_CATEGORY),
            type:ChannelType.GuildVoice,
            userLimit:totalSlot
        })
        if(!isImmeadiatelyStart){
            setTimeout(() => {
                voiceChannel.permissionOverwrites.edit(guild.roles.everyone.id,{
                    Connect:true
                })
            }, Time.oneMinute() * 5);
        }
        supabase.from("CoworkingEvents")
            .update({status:'upcoming',voiceRoomId:voiceChannel.id})
            .eq('id',eventId)
            .then()
        return voiceChannel
    }

	static async remindFiveMinutesBeforeCoworking(client,time,eventId){
		const oldEvent = await CoworkingController.getCoworkingEvent(eventId)
		schedule.scheduleJob(time,async function() {
			const newEvent = await CoworkingController.getCoworkingEvent(eventId)
			if(newEvent.body && newEvent.body?.updatedAt === oldEvent.body?.updatedAt && newEvent.body.voiceRoomId === null){
                const dataAttendances = await supabase.from("CoworkingAttendances")
                    .select()
                    .eq('EventId',eventId)
				const channel = await CoworkingController.createFocusRoom(client,newEvent.body.voiceRoomName,newEvent.body.id,newEvent.body.totalSlot)
                const msg = await channel.send(CoworkingMessage.howToStartSession(newEvent.body.HostId))
                const {user} = await MemberController.getMember(client,newEvent.body.HostId)
                ChannelController.sendToNotification(client,CoworkingMessage.remindFiveMinutesBeforeCoworking(newEvent.body.HostId,channel.id,null,msg.id),user.id)
                dataAttendances.body.forEach(async attendance=>{
                    ChannelController.sendToNotification(client,CoworkingMessage.remindFiveMinutesBeforeCoworking(attendance.UserId,channel.id,UserController.getNameFromUserDiscord(user),msg.id),attendance.UserId)
                })

			}
		})
	}

    static async haveCoworkingEvent(userId){
        const [dataAttendance,dataHost] = await Promise.all([
            supabase.from('CoworkingAttendances')
                .select('*,CoworkingEvents(status,voiceRoomId)')
                .eq("UserId",userId),
            supabase.from("CoworkingEvents")
                .select()
                .eq('HostId',userId)
                .or('status.eq.upcoming,status.eq.live')
                .limit(1)
                .single()
        ])

        if(dataHost.body){
            return {voiceRoomId: dataHost.body.voiceRoomId}
        }

        for (let i = 0; i < dataAttendance.body.length; i++) {
            const {status,voiceRoomId} = dataAttendance.body[i]?.CoworkingEvents;
            if(status === 'upcoming' || status === 'live'){
                return {voiceRoomId}
            }
        }
        return false
    }

    static async isHostCoworking(HostId,voiceRoomId){
        return await supabase.from('CoworkingEvents')
            .select()
            .eq("HostId",HostId)
            .eq('voiceRoomId',voiceRoomId)
            .eq('status','upcoming')
            .limit(1)
            .single()
    }
}

module.exports = CoworkingController