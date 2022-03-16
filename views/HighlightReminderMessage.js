const { MessageEmbed } = require("discord.js")
const { CHANNEL_HIGHLIGHT } = require("../helpers/config")

class HighlightReminderMessage{
    static highlightReminder(userId){
        return `Hi <@${userId}>, let's start your day and do what matters by writing your <#${CHANNEL_HIGHLIGHT}> today`
    }
    static embedMessage(text){
        return new MessageEmbed()
        .setColor('#fefefe')
        .setDescription(text)
    }
}

module.exports = HighlightReminderMessage