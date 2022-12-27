const { MessageEmbed } = require("discord.js")
const { CHANNEL_HIGHLIGHT } = require("../helpers/config")

class HighlightReminderMessage{
    static highlightReminder(userId){
        return `Hi <@${userId}>, let's start your day and do what matters by writing your <#${CHANNEL_HIGHLIGHT}> today`
    }

    static wrongFormat(author){
        return `Hi ${author} please __add a specific time__ to your highlight to stay accountable!
For example: 🔆 read 25 page of book **at 19.00**`
    }

    static remindHighlightUser(author,task){
        return `Hi ${author} reminder: ${task} `
    }

    static successScheduled(highlight){
        return `**Your highlight has been scheduled ✅**
↳ ${highlight}`
    }
}

module.exports = HighlightReminderMessage