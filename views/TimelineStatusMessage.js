const { MessageActionRow, MessageButton } = require("discord.js")
const ChannelController = require("../controllers/ChannelController")
const { CHANNEL_CELEBRATE } = require("../helpers/config")

class TimelineStatusMessage{
    static notificationBeforeCelebrationDay(userId,dayLeft = 2){
        const message = dayLeft === 2 ? "tomorrow is our celebration day! 🎉" : `it's ${dayLeft} days before celebration day! 🎉`
        return {
            content:`Hi <@${userId}>, ${message}
Let's prepare your 10 slides story format before our celebration day.`,
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setLabel('learn more')
                            .setURL("https://closa.notion.site/Celebration-Day-5c1aa3ea23b349db8b23b80b5c59db40")
                            .setStyle('LINK')
                    )
            ] 
        }
    }
    static notificationShareStory(userId){
        
        return `Hi <@${userId}>, Let's ${ChannelController.getStringChannel(CHANNEL_CELEBRATE)} your progress & share your story with the community :smile:
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
2. Submit to ${ChannelController.getStringChannel(CHANNEL_CELEBRATE)}`
    }
    static notificationKickoffDay(userId){
        
        return {
            content:`Hi <@${userId}>, Closa **next kick-off day will start in 2 days.** :arrow_upper_right:

\`\`Fill the form below to join accountability group on next cohort.\`\``,
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setLabel('Join group')
                            .setURL("https://tally.so/r/mVLN8y")
                            .setStyle('LINK')
                    )
            ] 
        }
    }
}

module.exports = TimelineStatusMessage