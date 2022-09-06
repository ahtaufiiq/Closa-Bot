const { MessageEmbed, MessageActionRow, MessageButton, SelectMenuInteraction, MessageSelectMenu } = require("discord.js")
const ChannelController = require("../controllers/ChannelController")
const InfoUser = require("../helpers/InfoUser")

class ReferralCodeMessage{

    static infoRedeemReferral(){
        return {
            content:"**Redeem your referral code here:**",
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                        .setCustomId("redeem")
                        .setLabel("Redeem")
                        .setStyle("PRIMARY")
                        .setEmoji("🎁"),
                        new MessageButton()
                            .setLabel('Find on twitter')
                            .setURL("https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode")
                            .setStyle('LINK')
                    )
            ] 
        }
    }

    static sendReferralCode(userId,total){
        return { 
            content:`**${total} referral code for you!** :gift: 

Hi <@${userId}> thank you for being active & progressive on our community!
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
you can use /referral to check your referral status.

*Valid until ${dates}*

Share the code to your friends & you friends can redeem it via https://closa.me/referral` , 
            components: [this.createButton(
                `generateReferral_${userId}`,
                'Generate Ticket'
            )] 
        }
    }
    static dontHaveReferralCode(){
        return `You don't have any referral code right now.
We'll send you once a month based on your active participation at closa.`
    }

    static successRedeemYourReferral(referralCode,endMembership,user){
        return { 
            content:`Your referral code has been redeemed!
\`\`Your membership status has been extended until ${endMembership}.\`\`

Let's welcome your friend!` , 
            embeds: [this.embedMessage(
                "1 month free membership from referral 🎁",
                `Your friend has onboarded to closa using this referral code from you:
${referralCode}`,
                user
            )], 
        }

    }

    static successRedeemReferral(endMembership){
        return `Your closa membership status active until ${endMembership}`
    }

    static replySuccessRedeem(){
        return "Your code has successfully redeemed ✅"
    }
    static replyInvalidReferralCode(){
        return "Invalid referral code ⚠️"
    }
    static replyAlreadyRedeemedCode(){
        return " ⚠️ This code already redeemed before. Use other code."
    }
    

    static replyExpiredCode(){
        return {
            content:"Your referral code has expired. Find another one on twitter.",
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setLabel('Find on twitter')
                            .setURL("https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode")
                            .setStyle('LINK')
                    )
            ] 
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