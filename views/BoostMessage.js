const { MessageEmbed, MessageActionRow, MessageButton, SelectMenuInteraction, MessageSelectMenu } = require("discord.js")
const FormatString = require("../helpers/formatString")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class BoostMessage{

    static boostBack(user,sender,totalBoost){
        return { 
            content:`**Hi ${user} someone just boosted you back **` , 
            embeds: [BoostMessage.embedMessageBoost({
                totalBoost,
                user:sender
            })]
        }
    }
    static IamBack(user,sender,message){
        return { 
            content:`${message}${user}` , 
            embeds:[
                MessageComponent.embedMessage({user:sender})
            ]
        }
    }

    static sendBoost(user,sender,totalBoost,message){
        return { 
            content:`Hi ${user} someone just boosted you ` , 
            embeds: [BoostMessage.embedMessageBoost({
                message,
                user:sender,
                totalBoost
            })], 
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addButton(`personalBoost_${sender.id}`,'🚀 Personal Boost'),
                    MessageComponent.addButton(`boostBack_${sender.id}`,'⚡️ Quick Boost',"SECONDARY")
                )
            ] 
        }
    }

    static sendBoostToInactiveMember(inactiveUser,sender,totalBoost){
        
        return { 
            content:`**Hi ${inactiveUser} someone sent you a boost.  ${MessageFormatting.customEmoji().success}**` , 
            embeds: [BoostMessage.embedMessageBoost({
                message:`Let's start tiny & get back on track!`,
                user:sender,
                totalBoost
            })], 
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addMenu( 
                        `inactiveReply_${sender.id}`,
                        "Reply",
                        [
                            {
                                label:'I am back thanks!',
                                value:'I am back thanks!'
                            },
                            {
                                label:"I'll be back tomorrow, thanks!",
                                value:"I'll be back tomorrow, thanks!"
                            },
                            {
                                label:'I still need to take a break, but thanks!',
                                value:'I still need to take a break, but thanks!'
                            },
                            {
                                label:'💬 Write personal reply..',
                                value:`personalBoost`
                            }
                        ]
                    )
                )
            ] 
        }
    }

    static notMakingProgress2Days(user){
        return { 
            content:`**IT'S TIME TO BOOST! 
it looks like ${user} is not making progress for 2 days.**` , 
            embeds: [MessageComponent.embedMessage({
                title: "Send Boost 🚀",
                description: `Show your support by sending ${user} a boost.`,
                user
            })], 
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addButton(`personalBoost_${user.id}`,'🚀 Personal Boost'),
                    MessageComponent.addButton(`boostInactiveMember_${user.id}`,'⚡️ Quick Boost',"SECONDARY")
                )
            ] 
        }
    }
    static aboutToLoseStreak(user,currentStreak){
        return { 
            content:`**${user} is about to lose ${currentStreak} streak!** 
**IT'S TIME TO BOOST!**` , 
            embeds: [MessageComponent.embedMessage({
                title: "Send Boost 🚀",
                description: `Show your support by sending ${user} a boost.`,
                user
            })], 
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addButton(`personalBoost_${user.id}`,'🚀 Personal Boost'),
                    MessageComponent.addButton(`boostInactiveMember_${user.id}`,'⚡️ Quick Boost',"SECONDARY")
                )
            ] 
        }
    }

    static notActive5Days(user){
        return { 
            content:`IT'S TIME TO BOOST! 
it's almost a week our friend ${user} not making progress` , 
            embeds: [MessageComponent.embedMessage({
                title: "Send Boost 🚀",
                description: `Show your support by sending ${user} a boost.`,
                user
            })], 
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addButton(`personalBoost_${user.id}`,'🚀 Personal Boost'),
                    MessageComponent.addButton(`boostInactiveMember_${user.id}`,'⚡️ Quick Boost',"SECONDARY")
                )
            ] 
        }
    }

    static remindToBoost(userId){
        return `Hi <@${userId}>, let's start the week by sending someone boost!
type the command below here:
\`\`\`/boost @User [your message]\`\`\``
    }
    static successSendBoost(user){
        return MessageComponent.embedMessage({
                title: "Boost sent 🚀",
                description: `You just sent boost to ${user}`,
                user
            }) 
    }

    static successBoostBack(user){
        return `boost sent to ${user}`
    }
    static successSendMessage(user){
        return `message sent to ${user}`
    }
    static warningSpamBoost(){
        return "⚠️ Can't sent multiple boost at a time to the same person."
    }
    static warningSpamMessage(){
        return "⚠️ Can't sent multiple message at a time to the same person."
    }
    static warningBoostYourself(){
        return "⚠️ Can't boost yourself. Boost other instead"
    }
    static warningReplyYourself(){
        return "⚠️ Can't reply to yourself. Boost other instead."
    }

    static embedMessageBoost({message,user,totalBoost},color="#00B264"){
        const msg = new MessageEmbed()
            .setColor(color)
            .setFooter({iconURL:InfoUser.getAvatar(user),text:`${user.username} — boosted ${totalBoost}x 🚀`})

        if(message){
            msg.setTitle(FormatString.truncateString(message,252)||"")
        }

        return msg
    }

}

module.exports=BoostMessage