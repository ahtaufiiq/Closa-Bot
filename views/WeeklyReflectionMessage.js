const { MessageEmbed } = require("discord.js")
const FormatString = require("../helpers/formatString")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")


class WeeklyReflectionMessage {
    static announcement(time,participants=[]){
        return {
            content:`**📝 WEEKLY REFLECTION** 

> **Let's take a break & do a quick reflection! @everyone ** :red_circle: ${time}

\`\`\`fix
Reward: 100+ points
\`\`\`
Participated (${participants.length}):
${participants.join('\n')}`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('joinWeeklyReflection',"Join").setDisabled(time==='ended'),
                MessageComponent.addLinkButton('Learn more','https://closa.notion.site/Reflection-9d7c976982954e43960fc0af7a58b68e').setEmoji('💡')
            )]

        }
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

    static reviewReflection({highlight,lowlight,actionPlan,note,user}){
        return {
            embeds:[WeeklyReflectionMessage.embedMessageReflection({highlight,lowlight,actionPlan,note,user})],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`submitReflection_${user.id}`,"Submit"),
                MessageComponent.addButton(`editReflection_${user.id}`,"Edit","SECONDARY"),
            )]
        }
    }

    static embedMessageReflection({highlight,lowlight,actionPlan,note,user}){
        const reflection = []
        if(highlight) reflection.push({name:"Went well?",value:FormatString.truncateString( highlight,1020)})
        if(lowlight) reflection.push({name:"Didn't go weel?",value:FormatString.truncateString( lowlight,1020)})
        if(actionPlan) reflection.push({name:"Next action plan for improvements",value:FormatString.truncateString( actionPlan,1020)})
        if(note) reflection.push({name:"Additional Notes / Key learnings",value:FormatString.truncateString( note,1020)})
        return new MessageEmbed()
        .setColor("#ffffff")
        .setTitle(FormatString.truncateString(`Reflection by ${user.username}`,250))
        .setThumbnail(InfoUser.getAvatar(user))
        .addFields(
            ...reflection
        )
    }

    static replySuccessSubmitReflection(totalPoint){
        return `Your reflection notes has been submitted! :white_check_mark:

:coin: **${totalPoint} (+100 points)**`
    }

}

module.exports = WeeklyReflectionMessage