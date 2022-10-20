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

    static customEmoji(){
        return {
            thumbsupkid:'<:thumbsupkid:1000911696031924275>',
            stonks:'<:stonks:741455081106309131>'
        }
    }
    static customEmojiAnimated(){
        return {}
    }
}

module.exports = MessageFormatting