const schedule = require('node-schedule');
const { GUILD_ID, CHANNEL_CLOSA_CAFE, ROLE_MORNING_CLUB, ROLE_NIGHT_CLUB, MY_ID, CHANNEL_WEEKLY_SCYNC_CATEGORY, CHANNEL_UPCOMING_SESSION, ROLE_MEMBER, ROLE_NEW_MEMBER, CHANNEL_CREATE_YOUR_ROOM } = require('../helpers/config');
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
const DiscordWebhook = require('../helpers/DiscordWebhook');


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
                    const duration = Time.convertTime(totalMinute, "short")
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

    static getStartTimeCoworkingSession(){
        const date = new Date()
        date.setMinutes(date.getMinutes() + 15)
        return date
    }

    static async createEventDiscord(client){
        let name = "coworking 👩‍💻🧑‍💻✅"
        let description = `• Feel free to drop in anytime.
• Before leaving, say good bye in voice chat.
• follow coworking rules: turn on camera 📸 or sharescreen 🖥️
• if you're turning on camera, make sure others can see you :)
• if you're sharing screen, don't share any sensitive data 🚫`
        let scheduledStartTime = CoworkingController.getStartTimeCoworkingSession()
        
        return await CoworkingController.scheduleEvent(client,{
            name,
            description,
            scheduledStartTime,
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
                 return await event.setStatus(GuildScheduledEventStatus.Active)
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

        ChannelController.createThread(msg,name,true)
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

    static async coworkingEventIsLive(eventId){
        const dataEvent = await CoworkingController.getCoworkingEvent(eventId)
        if(!dataEvent.body) return null //handle kalau data event udah dihapus
        return dataEvent.body?.status === 'live'  
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
        const permissionOverwrites = [
            {
                id:guild.roles.everyone,
                deny:[
                    PermissionFlagsBits.ViewChannel
                ]
            },
        ]
        if(!isImmeadiatelyStart) {
            for (let i = 0; i < dataEvent.body.CoworkingAttendances.length; i++) {
                const userId = dataEvent.body.CoworkingAttendances[i].UserId;
                const {user} = await MemberController.getMember(client,userId)
                permissionOverwrites.push({
                    id:user.id,
                    allow:[
                        PermissionFlagsBits.ViewChannel
                    ]
                })
            }
            const {user} = await MemberController.getMember(client,dataEvent.body.HostId)
            permissionOverwrites.push({
                id:user.id,
                allow:[
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.ManageChannels,
                ]
            })
        }else{
            permissionOverwrites.push(
                {
                    id:guild.roles.everyone,
                    allow:[
                        PermissionFlagsBits.ViewChannel
                    ]
                }
            )
            
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
                voiceChannel.permissionOverwrites.edit(guild.roles.everyone,{
                    ViewChannel:true
                })
            }, Time.oneMinute() * 5);
        }else{
            CoworkingController.handleHowToStartSession(client,eventId,voiceChannel,dataEvent.body.HostId)
        }
        supabase.from("CoworkingEvents")
            .update({status:'upcoming',voiceRoomId:voiceChannel.id})
            .eq('id',eventId)
            .then()
        return voiceChannel
    }

    static async updateFocusRoom(client,user,voiceRoomId){
        const voiceChannel = ChannelController.getChannel(client,voiceRoomId)
        voiceChannel.permissionOverwrites.edit(user.id,{
            ViewChannel:true
        })
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
                const {user} = await MemberController.getMember(client,newEvent.body.HostId)
                dataAttendances.body.forEach(async attendance=>{
                    ChannelController.sendToNotification(
                        client,
                        CoworkingMessage.remindFiveMinutesBeforeCoworking(attendance.UserId,channel.id,UserController.getNameFromUserDiscord(user)),
                        attendance.UserId
                    )
                })
                const msg = await CoworkingController.handleHowToStartSession(client,eventId,channel,newEvent.body.HostId)
                ChannelController.sendToNotification(
                    client,
                    CoworkingMessage.remindFiveMinutesBeforeCoworking(newEvent.body.HostId,channel.id,null,msg.id),
                    user.id
                )
			}
		})
	}

    static async handleHowToStartSession(client,eventId,voiceChannel,HostId){
        let minuteToStartSession = 10
        const msg = await voiceChannel.send(CoworkingMessage.howToStartSession(HostId,eventId,minuteToStartSession))
        const countdownStartSession = setInterval(async () => {
            minuteToStartSession--
            const coworkingEventIsLive = await CoworkingController.coworkingEventIsLive(eventId)
            if(coworkingEventIsLive === null) return clearInterval(countdownStartSession)
            if(coworkingEventIsLive){
                clearInterval(countdownStartSession)
                return msg.edit(CoworkingMessage.howToStartSession(HostId,eventId,0,true))
            }
            msg.edit(CoworkingMessage.howToStartSession(HostId,eventId,minuteToStartSession))
            if(minuteToStartSession === 0){
                clearInterval(countdownStartSession)
                let minuteAssignNewHost = 5
                const msgAssignNewHost = await msg.channel.send(CoworkingMessage.askNewHostCoworking(minuteAssignNewHost,eventId))
                const countdownAssignNewHost = setInterval(async () => {
                    minuteAssignNewHost--
                    const dataEvent = await CoworkingController.getCoworkingEvent(eventId)
                    if(dataEvent.body.HostId !== HostId){
                        clearInterval(countdownAssignNewHost)
                        return ChannelController.deleteMessage(msgAssignNewHost)
                    }
                    msgAssignNewHost.edit(CoworkingMessage.askNewHostCoworking(minuteAssignNewHost,eventId))
                    if(minuteAssignNewHost === 0) {
                        clearInterval(countdownAssignNewHost)
                        voiceChannel.delete()
                        supabase.from("CoworkingEvents")
                        .delete()
                        .eq('id',eventId)
                        .then()

                        const channelUpcomingSession = ChannelController.getChannel(client,CHANNEL_UPCOMING_SESSION)
                        const [msgEvent,threadEvent] = await Promise.all([
                            ChannelController.getMessage(
                                channelUpcomingSession,eventId
                            ),
                            ChannelController.getThread(
                                channelUpcomingSession,eventId
                            )
                        ])
                        msgEvent.delete()
                        threadEvent.delete()
                    }
                }, Time.oneMinute());
            }else if(minuteToStartSession === 2){
                msg.channel.send(CoworkingMessage.lastReminderHostToStartSession(HostId))
            }
        }, Time.oneMinute());
        return msg
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

    static async addCoworkingRoomToListFocusRoom(listFocusRoom,joinedChannelId){
        if(!listFocusRoom[joinedChannelId]){
            const event = await supabase.from("CoworkingEvents")
                .select()
                .eq('voiceRoomId',joinedChannelId)
            if(event.body.length > 0) listFocusRoom[joinedChannelId] = {
                status:'upcoming'
            }
        }
    }

    static isDeleteQuickRoom(oldMember,listFocusRoom,totalOldMember,){
        return oldMember.channelId !== CHANNEL_CREATE_YOUR_ROOM && listFocusRoom[oldMember.channelId]?.type === 'quickRoom' && totalOldMember === 0 && oldMember?.channel?.parentId === CHANNEL_WEEKLY_SCYNC_CATEGORY
    }

    static async handleQuickCreateRoom(oldMember,newMember,listFocusRoom,totalOldMember,listCafeTable){
        try {
            if(CoworkingController.isDeleteQuickRoom(oldMember,listFocusRoom,totalOldMember)){
                oldMember.channel.delete()
                setTimeout(() => {
                    listCafeTable.push(listFocusRoom[oldMember.channelId].tableNumber)
                    delete listFocusRoom[oldMember.channelId]
                }, Time.oneMinute() * 5);
            }
            if(oldMember.channelId !== CHANNEL_CREATE_YOUR_ROOM && newMember.channelId === CHANNEL_CREATE_YOUR_ROOM){
                const tableNumber = listCafeTable.shift()
                const guild = newMember.client.guilds.cache.get(GUILD_ID)
                const permissionOverwrites = [
                    {
                        id:newMember.member.id,
                        allow:[
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.ManageChannels
                        ]
                    },
                    {
                        id:guild.roles.everyone,
                        allow:[
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Connect
                        ]
                    },
                ]
                const voiceChannel = await guild.channels.create({
                    name:`table ${tableNumber}`,
                    permissionOverwrites,
                    parent:ChannelController.getChannel(newMember.client,CHANNEL_WEEKLY_SCYNC_CATEGORY),
                    type:ChannelType.GuildVoice,
                    userLimit:9
                })
                listFocusRoom[voiceChannel.id] = {
                    tableNumber,
                    type:'quickRoom',
                    HostId:newMember.member.id
                }
                await newMember.member.voice.setChannel(voiceChannel)
                
                voiceChannel.send(CoworkingMessage.successCreateQuickRoom(newMember.member.id,tableNumber))

            }
        } catch (error) {
            DiscordWebhook.sendError(error,'quick create room '+newMember.member.id)
        }
    }

    static showModalEditQuickRoom(interaction){
        let [commandButton,targetUserId=interaction.user.id,value] = interaction.customId.split("_")
        if(commandButton === 'editQuickRoom'){
            if(targetUserId !== interaction.user.id) return interaction.reply({ephemeral:true,content:"⚠️ you're a guest, only host can edit the channel."})
			const modal = new ModalBuilder()
			.setCustomId(interaction.customId)
			.setTitle("Edit channel")

            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel("Name").setStyle(TextInputStyle.Short).setValue(interaction.channel.name).setPlaceholder('type your room name (max 2x edit)').setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('limit').setLabel("User limit (min 1 & max 25)").setStyle(TextInputStyle.Short).setValue(`${interaction.channel.userLimit}`).setPlaceholder('e.g. 9').setRequired(true)),
            )
            
			interaction.showModal(modal);
			return true
		}
        return false
    }

    static async handleStartCoworkingTimer(interaction,listFocusRoom){
        const userId = interaction.user.id
        const joinedChannelId = interaction.message.channelId
        const dataEvent = await CoworkingController.isHostCoworking(userId,joinedChannelId)
            
        if(dataEvent.body){
            const {id,rules,totalMinute,voiceRoomName} = dataEvent.body
            const hostname = voiceRoomName.split('—')[1]
            supabase.from("CoworkingEvents")
                .update({status:'live'})
                .eq('voiceRoomId',joinedChannelId)
                .then()
            listFocusRoom[joinedChannelId].status = 'live'
            const channel = ChannelController.getChannel(interaction.client,CHANNEL_UPCOMING_SESSION)
            const coworkingEventMessage = await ChannelController.getMessage(channel,dataEvent.body.id)
            CoworkingController.updateCoworkingMessage(coworkingEventMessage,true)
            let currentMin = totalMinute
            const voiceChat = await ChannelController.getChannel(interaction.client,joinedChannelId)
            const sessionGuests = await CoworkingController.getSessionGuests(dataEvent.body.id)
            voiceChat.send(CoworkingMessage.countdownCoworkingSession(userId,rules,totalMinute,currentMin,sessionGuests))
                .then(msg=>{
                    const tagPeople = `${MessageFormatting.tagUser(userId)} ${sessionGuests.join(' ')}`
                    const countdownCoworkingSession = setInterval(() => {
                        currentMin--
                        msg.edit(CoworkingMessage.countdownCoworkingSession(userId,rules,totalMinute,currentMin,sessionGuests))
                        if(currentMin === 10) msg.reply(CoworkingMessage.remindSessionEnded(tagPeople,10))
                        else if(currentMin === 5) msg.reply(CoworkingMessage.remindSessionEnded(tagPeople,5))
                        else if(currentMin === 2) msg.reply(CoworkingMessage.remindSessionEnded(tagPeople,2))
                        else if(currentMin === 0){
                            clearInterval(countdownCoworkingSession)
                            msg.reply(CoworkingMessage.remindSessionEnded(tagPeople))
                            setTimeout(() => {
                                voiceChat.delete()
                                coworkingEventMessage.delete()
                                ChannelController.getThread(channel,dataEvent.body.id)
                                    .then(coworkingEventThread =>{
                                        coworkingEventThread.delete()
                                    })
                                supabase.from("CoworkingEvents")
                                    .delete()
                                    .eq('voiceRoomId',joinedChannelId)
                                    .then()
                            }, 1000 * 15);
                        }
                    }, Time.oneMinute());
                })

                //notify session just started to attendee who booked the session & haven't joined yet to join the session:
                supabase.from("CoworkingAttendances")
                    .select()
                    .eq('EventId',id)
                    .is('alreadyJoined',false)
                    .then(data => {
                            data.body.forEach(attendance=>{
                            ChannelController.sendToNotification(
                                interaction.client,
                                CoworkingMessage.notifySessionJustStarted(attendance.UserId,hostname,joinedChannelId),
                                attendance.UserId
                            )
                            })
                    })
        }
    }

    static isValidToStartCoworkingTimer(focusRoomUser,userId){
        if(!focusRoomUser[userId]) return false
        let {selfVideo,streaming,firstTimeCoworkingTimer,threadId,statusSetSessionGoal} = focusRoomUser[userId]
        return (selfVideo || streaming) && firstTimeCoworkingTimer && threadId && statusSetSessionGoal === 'done'
    }

    static async isAlreadyBookCoworkingEvent(UserId,EventId){
        const data = await supabase.from('CoworkingAttendances')
            .select()
            .eq('UserId',UserId)
            .eq("EventId",EventId)
        return data.body.length > 0
    }

    static async updateHostId(newHostId,EventId){
        return await supabase.from("CoworkingEvents")
            .update({HostId:newHostId})
            .eq("id",EventId)
    }

    static isWeeklyEventClosa(){
        const date = Time.getDate()
        const time = date.getTime()
        if(date.getDay() === 2){
            const startEventClosa = Time.getDate()
            startEventClosa.setHours(20)
            startEventClosa.setMinutes(0)

            const endEventClosa = Time.getDate()
            endEventClosa.setHours(21)
            endEventClosa.setMinutes(0)

            return time >= startEventClosa.getTime() && time <= endEventClosa.getTime()
        }
        return false
    }

    static async handleStartEvent(client){
        const data = LocalData.getData()
        if (!CoworkingController.isWeeklyEventClosa()) {
            const event = await CoworkingController.getDetailEvent(client,data.coworking)
            const isActive = event.status === GuildScheduledEventStatus.Active
            if (!isActive) {
                const event = await CoworkingController.createEventDiscord(client)
                data.coworking = event.id
                LocalData.writeData(data)
                CoworkingController.startEvent(client,event.id)
            }
        }
    }

    static handleLastUserLeaveEvent(client){
        setTimeout(async () => {
            const data = LocalData.getData()
            const event = await CoworkingController.getDetailEvent(client,data.coworking)
            const isFinished = event.status === GuildScheduledEventStatus.Active
            if(!isFinished) this.stopEvent(client,data.coworking)
        }, 1000 * 5);
    }
}

module.exports = CoworkingController