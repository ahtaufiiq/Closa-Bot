const { CHANNEL_TODO, CHANNEL_GOALS, CHANNEL_ACOUNTABILITY_MODE, CHANNEL_UPCOMING_SESSION, CHANNEL_CREATE_SESSION } = require("../helpers/config")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const GenerateLink = require("../helpers/GenerateLink")
const Time = require("../helpers/time")
class TodoReminderMessage{
    static progressReminder(userId){
        return {
            content:`Hi @${MessageFormatting.tagUser(userId)}, how's your progress today? let's share on ${MessageFormatting.tagChannel(CHANNEL_TODO)}

if you haven't work yet, join or host virtual coworking:
• Join → ${MessageFormatting.tagChannel(CHANNEL_UPCOMING_SESSION)}
• Host → ${MessageFormatting.tagChannel(CHANNEL_CREATE_SESSION)} (invite friends)

It scientifically proven to help you stay focus & get more done.`
        }
    }

    static buttonAddToCalendarShareProgress(hours,minutes){
		const startDate = new Date()
		startDate.setDate(startDate.getDate()+1)

        if(hours) startDate.setHours(Time.minus7Hours(hours))
        if(minutes) startDate.setMinutes(minutes)
        
		const endDate = new Date(startDate.valueOf())
		endDate.setHours(endDate.getHours()+1)
		const link = GenerateLink.addToCalendar(
			'Closa: Share Progress ✅',
			`PRO TIPS 💡
• Set as a recurring event to Daily 
• click location as a shortcut to #✅progress channel.`,
			MessageFormatting.linkToChannel(CHANNEL_TODO),
			startDate,
			endDate
		  )
        return MessageComponent.addLinkEmojiButton('Add to calendar',link,'🗓')
	}

    static warningNeverSetGoal(userId){
        return `**Unable to post your progress** :warning: 

Hi ${MessageFormatting.tagUser(userId)}, you haven't set your project ${MessageFormatting.tagChannel(CHANNEL_GOALS)} yet.

Please \`\`select\`\` your accountability mode first to continue to the next step
${MessageFormatting.tagChannel(CHANNEL_ACOUNTABILITY_MODE)}`
    }
}

module.exports = TodoReminderMessage