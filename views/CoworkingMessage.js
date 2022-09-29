const { CHANNEL_CLOSA_CAFE, GUILD_ID } = require("../helpers/config")

class CoworkingMessage {
    static titleCoworkingNight(){
        return `Closa: Co-working Night 🧑‍💻👩‍💻☕️🌙 `
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
• Sometimes we talk during the session, If you don't want to get interuppted turn on deafen mode.
`
    }

    static notifCoworkingStarted(type,userId,eventId){
        
        return ` ${type === "Morning" ? "🌤 Morning Club":"🌙 Night Club"} co-working hour just started at ☕️ Closa café.
Let’s join the session. <@${userId}>

https://discord.com/events/${GUILD_ID}/${eventId}`
    }

    static remind10MinutesBeforeStart(userId,eventId){
        
        return `10 min before co-working session <@${userId}>
Let's get ready & join <#${CHANNEL_CLOSA_CAFE}> 

https://discord.com/events/${GUILD_ID}/${eventId}`
    }
}
module.exports = CoworkingMessage