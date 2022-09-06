const { MessageEmbed, MessageActionRow, MessageButton, SelectMenuInteraction, MessageSelectMenu } = require("discord.js")
const ChannelController = require("../controllers/ChannelController")
const InfoUser = require("../helpers/InfoUser")

class ReferralCodeMessage{

    static sendReferralCode(userId){
        return { 
            content:`**3 referral code for you!** :gift: 

Hi <@${userId}> thank you for being active & progressive on our community!.
If you find the community is valuable, help us spread it to your friends. :smile: 

**Get 1 month free membership** both you and your friends for every referral code that redeemed. :stonks:` , 
            components: [this.createButton(
                `claimReferral_${userId}`,
                'Claim'
            )] 
        }
    }
    static showReferralCode(userId,referralCodes,dates){
        return { 
            content:`**Your referral code:**
\`\`\`
${referralCodes}
\`\`\`
*Valid until ${dates}*

Share the code to your friends & you friends can redeem it via https://closa.me/referral` , 
            components: [this.createButton(
                `generateReferral_${userId}`,
                'Generate Ticket'
            )] 
        }
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

module.exports=ReferralCodeMessage