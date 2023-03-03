const { MessageEmbed } = require("discord.js")
const FormatString = require("../helpers/formatString")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")

class IntroMessage {
    static postIntro({name,about,expertise,needHelp,social,user}){
        return {
            content:`Welcome ${user}`,
            embeds:[IntroMessage.embedMessageIntro({name,about,expertise,needHelp,social,user})],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`editIntro_${user.id}`,"Edit","SECONDARY")
            )]
        }
        
    }

    static embedMessageIntro({name,about,expertise,needHelp,social,user}){
        return new MessageEmbed()
        .setColor("#ffffff")
        .setTitle(FormatString.truncateString(`👋 Intro by ${user.username}`,250))
        .setThumbnail(InfoUser.getAvatar(user))
        .addFields(
            {name:IntroMessage.titleField.name,value:FormatString.truncateString( name,1020)},
            {name:IntroMessage.titleField.about,value:FormatString.truncateString( about,1020)},
            {name:IntroMessage.titleField.expertise,value:FormatString.truncateString( expertise,1020)},
            {name:IntroMessage.titleField.needHelp,value:FormatString.truncateString( needHelp,1020)},
            {name:IntroMessage.titleField.social,value:FormatString.truncateString( social,1020)},
        )
    }

    static replySuccessSubmitIntro(totalPoint,incrementPoint){
        return `Your intro has been submitted! :white_check_mark:

:coin: **${totalPoint} (+${incrementPoint} points)**`
    }

    static labelModal = {
        name:"Name, Location ",
        about:'About me',
        project:'What you are currently working (project,etc)',
        expertise:'What can I help with',
        needHelp:'What I need help on',
        social:'__**Social**__'
    }

    static titleField = {
        name:"Name, Location",
        about:'About me',
        project:'What you are currently working (project,etc)',
        expertise:'What can I help with',
        needHelp:'What I need help on',
        social:'__**Social**__'
    }
    static defaultValue = {
        social:`• Twitter – https://twitter.com/
• Instagram – https://instagram.com/
• Linkedin – https://linkedin.com/in/`
    }
}

module.exports = IntroMessage