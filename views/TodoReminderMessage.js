const { CHANNEL_TODO, CHANNEL_GOALS, CHANNEL_ACOUNTABILITY_MODE, CHANNEL_UPCOMING_SESSION, CHANNEL_CREATE_SESSION, CHANNEL_START_PROJECT, CHANNEL_CLOSA_CAFE } = require("../helpers/config")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const GenerateLink = require("../helpers/GenerateLink")
const Time = require("../helpers/time")
const { userMention, channelMention } = require("discord.js")
class TodoReminderMessage{
    static progressReminder(userId){
        return {
            content:`Hi ${userMention(userId)}, a friendly reminder to update your progress today
let's share on ${channelMention(CHANNEL_TODO)}!

if you haven't work yet, let's join coworking session
→ ${channelMention(CHANNEL_CLOSA_CAFE)} / ${channelMention(CHANNEL_CREATE_SESSION)}

*it's scienctifically proven to help you stay focus & get more done*`,
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton('Learn more','https://closa.notion.site/Daily-Coworking-80775e46f7c8440ca4b48062a6df9445')
            )]
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

    static warningNeverSetGoal(userId,content){
        return `Hi ${userMention(userId)}, **before continuing sharing your progress — let's start your project first** → ${channelMention(CHANNEL_START_PROJECT)}

you start the project you can copy & repost your progress again. 
–––
${content}`
    }

    static warningMinimalWords(userId){
        return `Hi ${MessageFormatting.tagUser(userId)} please write a longer story in ${MessageFormatting.tagChannel(CHANNEL_TODO)} like you talk with your friends.

so, you can learn from each others. Write a story, not just tasks done.

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