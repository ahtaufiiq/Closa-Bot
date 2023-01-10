const { CHANNEL_CLOSA_CAFE, GUILD_ID } = require("../helpers/config")
const MessageFormatting = require("../helpers/MessageFormatting")

class CoworkingMessage {
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
}
module.exports = CoworkingMessage