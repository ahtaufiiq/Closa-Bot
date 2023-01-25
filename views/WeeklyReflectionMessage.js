const { MessageEmbed } = require("discord.js")
const { CHANNEL_ANNOUNCEMENT } = require("../helpers/config")
const FormatString = require("../helpers/formatString")
const getRandomValue = require("../helpers/getRandomValue")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")


class WeeklyReflectionMessage {
    static announcement(time,participants=[]){
        const announcementGIF = [
            "https://media.giphy.com/media/nGtOFccLzujug/giphy.gif",
            "https://media.giphy.com/media/ISOckXUybVfQ4/giphy.gif",
            "https://media.giphy.com/media/rY6oYt4OaF59C/giphy.gif",
            "https://media.giphy.com/media/3oKIPuWNRHxeLJGgWk/giphy.gif",
            "https://media.giphy.com/media/PPxgdzGdl8BJm/giphy.gif",
            "https://media.giphy.com/media/YqJfljiG0hG7m3NAxK/giphy-downsized-large.gif",
            "https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif",
            "https://media.giphy.com/media/bPWyTsy2huZji/giphy.gif",

        ]
        const randomGif = getRandomValue(announcementGIF)
        const isEnded = time === 'ended'
        return {
            content:`**📝 WEEKLY REFLECTION** 

> **Let's take a break & do a quick reflection! @everyone ** 

\`\`\`fix
Reward: 100+ points
\`\`\`
Participated (${participants.length}): :red_circle: ${time}
${participants.join('\n')}`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('joinWeeklyReflection',`${isEnded ? "Ended" : "Join"}`).setDisabled(isEnded),
                MessageComponent.addLinkButton('Learn more','https://closa.notion.site/Reflection-9d7c976982954e43960fc0af7a58b68e').setEmoji('💡')
            )],
            embeds: [
                new MessageEmbed()
                .setColor(isEnded ? "#888888" : "#00B264")
                .setImage(randomGif)
            ]

        }
    }

    static reminderReflection(){
        return `:pencil: **Weekly Reflection**

**Hi @everyone, weekly reflection will be open in 1h on ${MessageFormatting.tagChannel(CHANNEL_ANNOUNCEMENT)}****
\`\`from 19.30 to 23.30\`\`

**Stay tuned!**`
    }


    static writeReflection(userId){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)},
**Let's do a quick reflection of what's going on this week!**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton('writeReflection','Write reflection','📝')
            )]
        }
    }

    static replySuccessJoinReflection(notificationId){
        return `**Next, check your notification :bell:**
We've sent the submission form here → ${MessageFormatting.linkToInsideThread(notificationId)}`
    }

    static postReflection({projectName,highlight,lowlight,actionPlan,note,user}){
        return {
            embeds:[WeeklyReflectionMessage.embedMessageReflection({projectName,highlight,lowlight,actionPlan,note,user})],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`editReflection_${user.id}_${projectName}`,"Edit","SECONDARY")
            )]
        }
    }

    static embedMessageReflection({projectName,highlight,lowlight,actionPlan,note,user}){
        const reflection = []
        if(projectName) reflection.push({name:"Project",value:FormatString.truncateString( projectName,1020)})
        if(highlight) reflection.push({name:"Went well?",value:FormatString.truncateString( highlight,1020)})
        if(lowlight) reflection.push({name:"Didn't go well?",value:FormatString.truncateString( lowlight,1020)})
        if(actionPlan) reflection.push({name:"Next action plan for improvements",value:FormatString.truncateString( actionPlan,1020)})
        if(note) reflection.push({name:"Additional Notes / Key learnings",value:FormatString.truncateString( note,1020)})
        return new MessageEmbed()
        .setColor("#ffffff")
        .setTitle(FormatString.truncateString(`📝 Reflection by ${user.username}`,250))
        .setThumbnail(InfoUser.getAvatar(user))
        .addFields(
            ...reflection
        )
    }

    static replySuccessSubmitReflection(totalPoint){
        return `Your reflection notes has been submitted! :white_check_mark:

:coin: **${totalPoint} (+100 points)**`
    }

    static replySubmissionClosed(){
        return `**The submission has been closed.**`
    }
}

module.exports = WeeklyReflectionMessage