const { MessageEmbed } = require("discord.js")
const { CHANNEL_TODO, CHANNEL_GOALS, CHANNEL_SOLO_MODE, CHANNEL_PARTY_MODE } = require("../helpers/config")
const MessageFormatting = require("../helpers/MessageFormatting")

class TodoReminderMessage{
    static progressReminder(userId){
        return `Hi <@${userId}>, how is your progress today? don't forget to share it on <#${CHANNEL_TODO}> channel!`
    }

    static warningNeverSetGoal(userId){
        return `**Unable to post your progress** :warning: 

Hi ${MessageFormatting.tagUser(userId)}, you haven't set your project ${MessageFormatting.tagChannel(CHANNEL_GOALS)} yet.

Please \`\`select\`\` your accountability mode first to continue to the next step
${MessageFormatting.tagChannel(CHANNEL_SOLO_MODE)} — *do your passion project alone.*
${MessageFormatting.tagChannel(CHANNEL_PARTY_MODE)} — *build alongside with other.*`
    }
}

module.exports = TodoReminderMessage