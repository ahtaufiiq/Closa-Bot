const { MessageEmbed } = require("discord.js")
const { CHANNEL_ANNOUNCEMENT } = require("../helpers/config")
const FormatString = require("../helpers/formatString")
const getRandomValue = require("../helpers/getRandomValue")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")


class CelebrationMessage {
    static announcement(time,participants=[]){
        const celebrationGIF = [
            "https://media.giphy.com/media/oF5oUYTOhvFnO/giphy.gif",
            "https://media.giphy.com/media/FlWgXEtj5aM5G/giphy.gif",
            "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
            "https://media.giphy.com/media/RzQwk7l0zQnfAbSpCw/giphy.gif",
            "https://media.giphy.com/media/IoMkSXKHQIDVm/giphy.gif",
            "https://media.tenor.com/08Kt2oRDVaAAAAAC/sad-emoji.gif",
            "https://media.tenor.com/v--7gprq4NgAAAAC/spongebob-birthday.gif",
        ]
        const randomGif = getRandomValue(celebrationGIF)
        const isEnded = time === 'ended'
        return {
            content:`🎉 **It's Celebration Day!**
            
> **Let's take time share the story about your passion-project in this cohort! @everyone**

\`\`\`fix
Reward: 300+ points
\`\`\`
Participated (${participants.length}): :red_circle: ${time}
${participants.join('\n')}`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('writeCelebration',`${isEnded ? "Ended" : "Join"}`).setDisabled(isEnded),
                MessageComponent.addLinkButton('Learn more','https://closa.notion.site/Celebration-Day-5c1aa3ea23b349db8b23b80b5c59db40').setEmoji('💡')
            )],
            embeds: [
                new MessageEmbed()
                .setColor(isEnded ? "#888888" : "#00B264")
                .setImage(randomGif)
            ]

        }
    }

    static writeCelebration(userId){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)},
**Let's share your moments and celebrate together 🎉**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton('writeCelebration','Write Celebration','🎉')
            )]
        }
    }

    static postCelebration({projectName,story,linkProject,linkDeck,metatagImage,user}){
        return {
            content:`Celebration by ${user}`,
            embeds:[CelebrationMessage.embedMessageCelebration({projectName,story,linkProject,linkDeck,metatagImage,user})],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`editCelebration_${user.id}_${projectName}`,"Edit","SECONDARY")
            )]
        }
    }

    static embedMessageCelebration({projectName,story,linkProject,linkDeck,metatagImage,user}){
        const celebration = []
        if(projectName) celebration.push({name:CelebrationMessage.titleField.project,value:FormatString.truncateString( projectName,1020)})
        if(story) celebration.push({name:CelebrationMessage.titleField.story,value:FormatString.truncateString( story,1020)})
        if(linkProject) celebration.push({name:CelebrationMessage.titleField.linkProject,value:FormatString.truncateString( linkProject,1020)})
        if(linkDeck) celebration.push({name:CelebrationMessage.titleField.linkDeck,value:FormatString.truncateString( linkDeck,1020)})
        return new MessageEmbed()
        .setColor("#ffffff")
        .setTitle(FormatString.truncateString(`🎉 Celebration by ${user.username}`,250))
        .setThumbnail(InfoUser.getAvatar(user))
        .setImage(metatagImage)
        .addFields(
            ...celebration
        )
    }

    static replySuccessSubmitCelebration(totalPoint,incrementPoint){
        return `Your celebration has been submitted! :white_check_mark:

:coin: **${totalPoint} (+${incrementPoint} points)**`
    }

    static replySubmissionClosed(){
        return `**The submission has been closed.**`
    }

    static labelModal = {
        'project':"My latest project",
        'story':'Story about my project',
        'linkProject':'Link to my project (optional)',
        'linkDeck':'Link to celebration slides'
    }

    static titleField = {
            'project':"My latest project",
            'story':'Story about my project',
            'linkProject':'Link to my project',
            'linkDeck':'Celebration Slides'
    }
}

module.exports = CelebrationMessage