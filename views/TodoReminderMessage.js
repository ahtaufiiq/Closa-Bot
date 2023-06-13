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

    static warningMinimalWords(userId){
        return `Hi ${MessageFormatting.tagUser(userId)} please write a longer story in ${MessageFormatting.tagChannel(CHANNEL_TODO)} like you talk with your friends.

so, you can learn or sharing from each others. Write a story, not just tasks done.

**copy, read, & follow the template & guideline below:**
\`\`\`
✅ Today:  *short title of what you've done today*

> replace this section with your all of your progress recap of the day:
> *Recap all of your progress in 1 post, it's enough, no need to post multiple times a day.*
> *Post in a story telling format—like you talk with your friends*
> *Don't just posting a list of task done without context/story format*
> *You can attach image/gif/video to show more about your progress.*

➡️ Next → *write your next plan*
\`\`\``
    }
}

module.exports = TodoReminderMessage