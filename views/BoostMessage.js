const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js")
const InfoUser = require("../helpers/InfoUser")

class BoostMessage{

    static boostBack(user,sender,totalBoost){
        return { 
            content:`**Hi ${user} someone just boosted you back **` , 
            embeds: [this.embedMessage(
                `Boosted you ${totalBoost}x 🚀`,
                "",
                sender
            )]
        }
    }
    static IamBack(user,sender){
        return { 
            content:`I'm back! thanks ${user} 🙌` , 
            embeds:[
                this.embedMessage("","",sender)
            ]
        }
    }

    static sendBoost(user,sender,totalBoost,message){
        return { 
            content:`**Hi ${user} someone just boosted you **` , 
            embeds: [this.embedMessage(
                `Boosted you ${totalBoost}x 🚀`,
                message,
                sender
            )], 
            components: [this.createButton(
                `boostBack_${sender.id}`,
                '🚀  Boost'
            )] 
        }
    }

    static sendBoostToInactiveMember(inactiveUser,sender,totalBoost){
        return { 
            content:`**Hi ${inactiveUser} someone sent you a boost. :success: **` , 
            embeds: [this.embedMessage(
                `Boosted you ${totalBoost}x 🚀`,
                `let's get back on track!`,
                sender
            )], 
            components: [this.createButton(
                `activeAgain_${sender.id}`,
                "🙌 I'm back, thanks!"
            )] 
        }
    }

    static successSendBoost(user){
        return this.embedMessage(
                "Boost sent 🚀",
                `You just sent boost to ${user}`,
                user
            ) 
    }

    static notMakingProgress3Days(user){
        return { 
            content:"**Hi everyone, It looks like one of our members is not making progress in the past 3 days.**" , 
            embeds: [this.embedMessage(
                "Send Boost 🚀",
                `Show your support by sending ${user} a boost.`,
                user
            )], 
            components: [this.createButton(`boostInactiveMember_${user.id}`,'🚀  Boost')] 
        }
    }

    static notActive5Days(user){
        return { 
            content:"**Hi everyone, It looks like one of our members is not active in the past 5 days.**" , 
            embeds: [this.embedMessage(
                "Send Boost 🚀",
                `Show your support by sending ${user} a boost.`,
                user
            )], 
            components: [this.createButton(`boostInactiveMember_${user.id}`,'🚀  Boost')] 
        }
    }

    static remindToBoost(userId){
        return `Hi <@${userId}>, let's start the week by sending someone boost!
type the command below here:
\`\`\`/boost @User [your message]\`\`\``
    }

    static createButton(id,text,style="SUCCESS"){
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(id)
                    .setLabel(text)
                    .setStyle(style)
            )
    }

    static embedMessage(title,description,user){
        return new MessageEmbed()
        .setColor('#00B264')
        .setTitle(title)
        .setDescription(description)
        .setFooter({iconURL:InfoUser.getAvatar(user),text:user.username})
    }
}

module.exports=BoostMessage