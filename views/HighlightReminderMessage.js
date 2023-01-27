const { CHANNEL_HIGHLIGHT } = require("../helpers/config")
const GenerateLink = require("../helpers/GenerateLink")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")

class HighlightReminderMessage{
    static highlightReminder(userId){
        return {
            content:`Hi <@${userId}>, let's start your day and do what matters by writing your <#${CHANNEL_HIGHLIGHT}> today`,
            components:[MessageComponent.createComponent(
                HighlightReminderMessage.buttonAddToCalendarSetHighlight()
            )]
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

        return MessageComponent.addLinkButton('Add to calendar: highlight reminder',link).setEmoji('🗓')
	}


    static wrongFormat(author){
        return `Hi ${author} please __add a specific time__ to your highlight to stay accountable!
For example: 🔆 read 25 page of book **at 19.00**`
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