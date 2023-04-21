const { EmbedBuilder, ButtonStyle } = require("discord.js")
const { CHANNEL_CLOSA_CAFE, GUILD_ID, CHANNEL_UPCOMING_SESSION, CHANNEL_SESSION_GOAL } = require("../helpers/config")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const InfoUser = require("../helpers/InfoUser")
const UserController = require("../controllers/UserController")
const GenerateLink = require("../helpers/GenerateLink")
const Time = require("../helpers/time")

class CoworkingMessage {

    static initWelcomeMessage(){
        return {
            content:`**Host & schedule a coworking session 👨‍💻👩‍💻
or book available session here** → ${MessageFormatting.tagChannel(CHANNEL_UPCOMING_SESSION)}`,
            files:['./assets/images/banner_coworking_session.png'],
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton('scheduleCoworking','Schedule','🗓️'),
                // MessageComponent.addLinkButton('Learn more','')
            )]
        }
    }
    
    static coworkingEvent(eventId,eventName,author,totalSlot,totalAttendance,rule,totalMinute,coworkingDate){
        let footer = ''
        const session = Time.convertTime(totalMinute,'short')
        const endDate = new Date(coworkingDate.valueOf())
        endDate.setMinutes(endDate.getMinutes()+totalMinute)
        const availableSlot = totalSlot - 1 //author
        const spotLeft = availableSlot - totalAttendance
        if(totalAttendance === 0){
            footer = ` · ${availableSlot} spots left `
        }else if(availableSlot === totalAttendance){
            if(totalAttendance === 1) footer = ` and other `
            else footer = ` and ${totalAttendance} others `
        }else{
            if(totalAttendance === 1) footer = ` and other · ${spotLeft} spot${spotLeft > 1 ? 's':''} left`
            else footer = ` and ${totalAttendance} others · ${spotLeft} spot${spotLeft > 1 ? 's':''} left`
        }
        const link = GenerateLink.addToCalendar(
			eventName,
			`1. Find your coworking room (click the location above).
2. Write a specific tasks on #session-goals 
3. Join you coworking room`,
			MessageFormatting.linkToMessage(CHANNEL_UPCOMING_SESSION,eventId),
			coworkingDate,
			endDate
		  )
        return {
            embeds:[
                new EmbedBuilder()
                .setColor("#FEFEFE")
                .setTitle(`${UserController.getNameFromUserDiscord(author)} wants to ${eventName} @ ${CoworkingMessage.formatCoworkingDate(coworkingDate)}`)
                .setDescription(`${session} session\n${rule}`)
                .setFooter({text:`${UserController.getNameFromUserDiscord(author)} ${footer}`, iconURL:InfoUser.getAvatar(author)})
            ],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`bookCoworking_${author.id}_${eventId}`,'Book'),
                MessageComponent.addButton(`editCoworking_${author.id}_${eventId}`,'Edit',ButtonStyle.Secondary),
                MessageComponent.addLinkEmojiButton('Add to calendar',link,'🗓'),
                MessageComponent.addButton(`cancelBookCoworking_${author.id}_${eventId}`,'Cancel',ButtonStyle.Secondary),
                // MessageComponent.addLinkButton('Learn more','')
            )]
        }
    }

    static formatCoworkingDate(date){
        let [weekday,month,day] = date.toLocaleDateString("en-US", { weekday: 'short', day:'2-digit',month:'short',}).split(/[, ]+/)
        return `${weekday} · ${date.getHours()}.${date.getMinutes()} WIB · ${day} ${month}`
    }

    static titleCoworkingNight(){
        return `Co-working Night 🧑‍💻👩‍💻☕️🌙 `
    }
    static titleCoworkingMorning(){
        return `Co-working Morning 🧑‍💻👩‍💻☕️🔆 `
    }
    static descriptionCoworkingNight(){
        return `🔔 **subscribe to** <#960785506566823946> to get co-working session notification.

**Agenda:**
• 5 minutes set session goal together
• 50 minutes co-working session
• 10 Minutes Break
• 50 minutes co-working session
• 5 minutes celebrate & show progress

**Rules:**
• Video on or Share Screen
• Sometimes we talk during the session, If you don't want to get interrupted turn on deafen mode.
`
    }
    static descriptionCoworkingMorning(){
        return `🔔 **subscribe to** <#960785506566823946> to get co-working session notification.

**Agenda:**
• 5 minutes set session goal together
• 50 minutes co-working session
• 10 Minutes Break
• 50 minutes co-working session
• 5 minutes celebrate & show progress

**Rules:**
• Video on or Share Screen
• Sometimes we talk during the session, If you don't want to get interuppted turn on deafen mode.
`
    }

    static notifCoworkingStarted(type,userId,eventId){
        
        return `co-working hour just started at ☕️ Closa café.
Let’s join the session. <@${userId}>

${MessageFormatting.linkToEvent(eventId)}`
    }

    static remind10MinutesBeforeStart(userId,eventId){
        
        return `10 min before co-working session <@${userId}>
Let's get ready & join <#${CHANNEL_CLOSA_CAFE}> 

${MessageFormatting.linkToEvent(eventId)}`
    }

    static remindFiveMinutesBeforeCoworking(userId,hostName,channelId){
        return `Hi ${MessageFormatting.tagUser(userId)}, in 5 minutes your session with ${hostName} is about to start.
Let's get ready:
1. Write a specific task on ${MessageFormatting.tagChannel(CHANNEL_SESSION_GOAL)}
2. Select your project inside your tasks thread.
3. Join → ${MessageFormatting.tagChannel(channelId)}
4. Turn on camera \`\`OR\`\` share screen to track your time.
5. Mute your mic (during focus time).`
    }
}
module.exports = CoworkingMessage