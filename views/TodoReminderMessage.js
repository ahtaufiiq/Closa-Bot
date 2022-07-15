const { MessageEmbed } = require("discord.js")
const { CHANNEL_TODO } = require("../helpers/config")

class TodoReminderMessage{
    static progressReminder(userId){
        return `Hi <@${userId}>, how is your progress today? don't forget to share it on <#${CHANNEL_TODO}> channel!`
    }

    static missYesterdayProgress(userId){
        return 	`Hi <@${userId}> you forgot to update your  <#${CHANNEL_TODO}> yesterday
But don't worry—you are not losing your #🔥streaks ✌️

**Don't forget to update your progress today, so you can keep your streaks.**

but if you want to take a break just post on the progress you need to take a break today`
    }
    static embedMessage(text){
        return new MessageEmbed()
        .setColor('#fefefe')
        .setDescription(text)
    }
}

module.exports = TodoReminderMessage