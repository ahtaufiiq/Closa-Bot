const { MessageActionRow, MessageButton } = require("discord.js")
const ChannelController = require("../controllers/ChannelController")
const { CHANNEL_CELEBRATE, CHANNEL_PARTY_MODE } = require("../helpers/config")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class TimelineStatusMessage{
    static notificationBeforeCelebrationDay(userId,dayLeft = 1){
        const message = dayLeft === 1 ? "tomorrow is our celebration day! 🎉" : `it's ${dayLeft} days before celebration day! 🎉`
        return {
            content:`Hi <@${userId}>, ${message}
Let's prepare your 10 slides story format before our celebration day.`,
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addLinkButton('learn more',"https://closa.notion.site/Celebration-Day-5c1aa3ea23b349db8b23b80b5c59db40")
                )
            ] 
        }
    }
    static notificationShareStory(userId){
        
        return `Hi <@${userId}>, Let's ${MessageFormatting.tagChannel(CHANNEL_CELEBRATE)} your progress & share your story with the community :smile:
Let people know a brief of your progress & story.

1. Copy the template below to join the vibe:
\`\`\`
Hi everyone! It's celebration time 🎉

My latest project.
↳ **Name of the project**

Here is my story about this project:
↳ . . .

Link to my project (optional)
↳ . . .

Story deck → link

Thank you for reading, have a great day!
\`\`\`
2. Submit to ${MessageFormatting.tagChannel(CHANNEL_CELEBRATE)}`
    }
    static notificationBeforeKickoffDay(userId){
        
        return {
            content:`**Hi ${MessageFormatting.tagUser(userId)}, closa's next kick-off day will start in 2 days ✌️**

Join your accountability group before the kick-off started → ${MessageFormatting.tagChannel(CHANNEL_PARTY_MODE)}`
        }
    }
}

module.exports = TimelineStatusMessage