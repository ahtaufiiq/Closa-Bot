const { CHANNEL_HIGHLIGHT, CHANNEL_UPCOMING_SESSION, CHANNEL_CREATE_SESSION } = require("../helpers/config")
const GenerateLink = require("../helpers/GenerateLink")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")

class HighlightReminderMessage{
    static highlightReminder(userId){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)} it's time to work on your project!
what 1 important thing you want to get done today?

\`\`💡\`\`*\`\`scheduling your task will increase your chance by 91% to complete the task of the day.\`\`*
Reward: Up to 50 points :coin:`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`setReminderHighlight_${userId}`,'Set reminder')
            )]
        }
    }

    static successSetHighlightReminder(taskName,userId){
        return {
            content:`** ${MessageFormatting.tagUser(userId)} your reminder has been scheduled** :white_check_mark: 
↳ ${taskName}

**:arrow_right: Next**: join or host virtual coworking to boost your productivity.
\`\`Join\`\` → ${MessageFormatting.tagChannel(CHANNEL_UPCOMING_SESSION)}
\`\`Host\`\` → ${MessageFormatting.tagChannel(CHANNEL_CREATE_SESSION)} (invite your friends)

:coin: **48** earned`
        }
    }

    static buttonAddToCalendarSetHighlight(hours,minutes){
		const startDate = new Date()
		startDate.setDate(startDate.getDate()+1)
        
        if(hours) startDate.setHours(Time.minus7Hours(hours))
        if(minutes) startDate.setMinutes(minutes)

		const endDate = new Date(startDate.valueOf())
		endDate.setHours(endDate.getHours()+1)
		const link = GenerateLink.addToCalendar(
			'Closa: Set Highlight 🔆',
			`PRO TIPS 💡
• Set as a recurring event to Daily 
• click location as a shortcut to #🔆highlight channel.`,
			MessageFormatting.linkToChannel(CHANNEL_HIGHLIGHT),
			startDate,
			endDate
		  )

        return MessageComponent.addLinkEmojiButton('Add to calendar',link,'🗓')
	}


    static wrongFormat(author){
        return `Hi ${author} please __add a specific time__ to your highlight to stay accountable!
For example: design exploration **at 19.00**`
    }

    static remindHighlightUser(userId,task){
        return `Hi ${MessageFormatting.tagUser(userId)} reminder: ${task} `
    }

    static successScheduled(highlight){
        return `**Your highlight has been scheduled ✅**
↳ ${highlight}`
    }
}

module.exports = HighlightReminderMessage