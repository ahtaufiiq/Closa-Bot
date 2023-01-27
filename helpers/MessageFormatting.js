const { GUILD_ID } = require("./config")

class MessageFormatting{
    static tagUser(userId){
        return `<@${userId}>`
    }

    static tagChannel(channelId){
        return `<#${channelId}>`
    }

    static tagRole(roleId){
        return `<@&${roleId}>`
    }

    static linkToEvent(eventId){
        return `https://discord.com/events/${GUILD_ID}/${eventId}`
    }

    static linkToChannel(channelId){
        return `https://discord.com/channels/${GUILD_ID}/${channelId}`
    }

    static linkToInsideThread(msgId){
        return `https://discord.com/channels/${GUILD_ID}/${msgId}`
    }
    static linkToMessage(channelId,msgId){
        return `https://discord.com/channels/${GUILD_ID}/${channelId}/${msgId}`
    }

    static customEmoji(){
        return {
            thumbsupkid:'<:thumbsupkid:1000911696031924275>',
            stonks:'<:stonks:741455081106309131>',
            success:'<:success:741455081009840128>',
        }
    }
    static customEmojiAnimated(){
        return {}
    }
}

module.exports = MessageFormatting