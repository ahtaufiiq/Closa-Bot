const { EmbedBuilder } = require("discord.js")
const { CHANNEL_GUIDELINE, CHANNEL_COMMAND } = require("../helpers/config")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class GuidelineInfoMessage {
    static guideline(userId,membership,isHaveProfile,isHaveReferral,showButtonTestimonial){
        const buttons = []
        if(!isHaveProfile) buttons.push(MessageComponent.addEmojiButton(`writeIntro_${userId}`,'Make an intro','👋'))
        if(isHaveReferral) buttons.push(MessageComponent.addEmojiButton(`claimReferral_${userId}`,'Refer Friends','🎁',"PRIMARY"))
        if(showButtonTestimonial) buttons.push(MessageComponent.addEmojiButton(`submitTestimonialGuideline_${userId}`,'Testimonial','💌'))
        buttons.push(
            MessageComponent.addLinkEmojiButton("Community playbook",'https://closa.notion.site/Closa-f3937e68c57e46c4b028b69e8f1412b2','📒'),
            MessageComponent.addLinkEmojiButton("Extend membership",'https://tally.so/r/wbRa2w','💳'),
        )
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)} welcome to closa! please follow the guideline below to begin`,
            embeds:[
                new EmbedBuilder()
                    .setColor('fafafb')
                    .setThumbnail('https://pbs.twimg.com/profile_images/1497990921874403329/qLmIBav9_400x400.jpg')
                    .setTitle("🗒 Closa Guidelines ")
                    .setDescription(`**New to Closa? **
Start here → ${MessageFormatting.tagChannel(CHANNEL_GUIDELINE)}

**Command Guides** 
try to type "/" to see what bot can do for you on channel: ${MessageFormatting.tagChannel(CHANNEL_COMMAND)}

**Official links**
Website → https://closa.me
Twitter → https://twitter.com/joinclosa
Instagram → https://twitter.com/joinclosa
Newsletter → https://closa.substack.com

**Membership Status**
${membership ? `Active until → ${membership}` : 'Not started yet'}`)
            ],
            components:[MessageComponent.createComponent(
                ...buttons
            )]
        }
    }
    
}

module.exports = GuidelineInfoMessage