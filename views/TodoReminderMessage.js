const { MessageEmbed } = require("discord.js")
const { CHANNEL_TODO } = require("../helpers/config")

class TodoReminderMessage{
    static progressReminder(userId){
        return `Hi <@${userId}>, how is your progress today? don't forget to share it on <#${CHANNEL_TODO}> channel!`
    }
    static embedMessage(text){
        return new MessageEmbed()
        .setColor('#fefefe')
        .setDescription(text)
    }
}

module.exports = TodoReminderMessage