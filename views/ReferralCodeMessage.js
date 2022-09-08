const { MessageEmbed, MessageActionRow, MessageButton, SelectMenuInteraction, MessageSelectMenu, MessageAttachment } = require("discord.js")
const ChannelController = require("../controllers/ChannelController")
const ReferralCodeController = require("../controllers/ReferralCodeController")
const InfoUser = require("../helpers/InfoUser")

class ReferralCodeMessage{

    static infoRedeemReferral(){
        return {
            content:`**Redeem your referral code here:**
\`\`1 month free membership for code owner & redeemer.\`\``,
            files:[new MessageAttachment('./assets/images/redeem_cover.png','cover.png')],
            components: [
                this.createComponent(
                    this.addButton("redeem","Enter Code","PRIMARY"),
                    this.addLinkButton(
                        'Find on twitter',
                        "https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode"
                    )
                )
            ] 
        }
    }

    static reminderClaimReferral(userId,day=5){
        return { 
            content:`Hi <@${userId}> your referral code will be expired in ${day} days. ` , 
            files:[new MessageAttachment('./assets/images/redeem_cover.png','cover.png')],
            components: [
                this.createComponent(
                    this.addEmojiButton(`claimNow_${userId}`,"Claim","🎁","PRIMARY")
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
            files:[new MessageAttachment('./assets/images/redeem_cover.png','cover.png')],
            components: [
                this.createComponent(this.addButton(`claimReferral_${userId}`,'Claim',"🎁"))
            ] 
        }
    }

    static showReferralCode(userId,referralCodes,dates,isClaimNow){
        const buttons = [ this.addButton(`generateReferral_${userId}`,'Generate Ticket',"PRIMARY")] 
        const content = `**Your referral code:**
\`\`\`
${referralCodes}
\`\`\`
You can type \`\`/referral\`\` to check your referral status.

*Valid until ${dates}*

Share the code to your friends & you friends can redeem it via https://closa.me/referral` 
        if(isClaimNow){
            buttons.push(
                this.addLinkButton("Tweet",`https://twitter.com/intent/tweet?text=${ encodeURI(ReferralCodeMessage.templateShareTwitterReferralCode(ReferralCodeController.getActiveReferralCodeFromMessage(content)))}`)
            )
        }
    
        return { 
            content, 
            components:[this.createComponent(...buttons)]
        }
    }

    static templateShareTwitterReferralCode(referralCodes){
        return `I have referral code for Closa membership (@beclosa):

${referralCodes.join("\n")}

You can redeem it via closa.me/referral`
    }

    static allReferralAlreadyBeenRedeemed(){
        return `All of your code has been redeemed by your friends.
We'll send the next referral code once a month based on your active participation.`
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
    static cannotRedeemMoreThanOne(){
        return "Referral code only can be use once for each user."
    }
    static cannotRedeemByExistingMember(){
        return `Existing member can't redeem referral code. 
We'll send you referral code once a month based on your activities.`
    }
    static cannotRedeemOwnCode(){
        return `Can't redeem your own code. 
Share it to your friends to get 1 month free membership.`
    }
    static replyInvalidReferralCode(){
        return {
            content:"⚠️ Invalid referral code",
            components: [
                this.createComponent(
                    this.addLinkButton("Find on twitter","https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode")
                )
            ] 
        }
    }
    static replyAlreadyRedeemedCode(){
        return {
            content:"⚠️ This code already redeemed before. Use other code.",
            components: [
                this.createComponent(
                    this.addLinkButton("Find on twitter","https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode")
                )
            ] 
        }
    }
    

    static replyExpiredCode(){
        return {
            content:"Your referral code has expired.",
            components: [
                this.createComponent(
                    this.addLinkButton("Find on twitter","https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode")
                )
            ] 
        }
    }
    static createComponent(...buttons){
        
        return new MessageActionRow()
            .addComponents(
                ...buttons
            )
    }
    static addButton(id,text,style="SUCCESS"){
        return new MessageButton()
            .setCustomId(id)
            .setLabel(text)
            .setStyle(style)
    }

    static addEmojiButton(id,text,emoji,style="SUCCESS"){
        
        return new MessageButton()
                    .setCustomId(id)
                    .setLabel(text)
                    .setStyle(style)
                    .setEmoji(emoji)
    }
    static addLinkButton(label,url){
        return new MessageButton()
        .setLabel(label)
        .setURL(url)
        .setStyle('LINK')
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