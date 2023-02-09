const { MessageEmbed, MessageActionRow, MessageButton, SelectMenuInteraction, MessageSelectMenu, MessageAttachment } = require("discord.js")
const ChannelController = require("../controllers/ChannelController")
const { CHANNEL_WELCOME } = require("../helpers/config")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class ReferralCodeMessage{

    static infoRedeemReferral(){
        return {
            content:`**Redeem your referral code here:**
\`\`1 month free membership for code owner & redeemer.\`\``,
            files:[new MessageAttachment('./assets/images/redeem_cover.png','cover.png')],
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addButton("redeem","Enter Code","PRIMARY"),
                    MessageComponent.addLinkButton(
                        'Find on twitter',
                        "https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode"
                    )
                )
            ] 
        }
    }

    static reminderClaimReferral(userId,files,day=5){
        return { 
            content:`Hi <@${userId}> your referral code will be expired in ${day} days. ` , 
            files,
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addEmojiButton(`claimReferral_${userId}`,"Claim","🎁","PRIMARY"),
                    MessageComponent.addButton(`generateReferralCover_${userId}`,'Generate Invites Cover',"SECONDARY").setEmoji('✨'),
                )
            ] 
        }
    }
    static sendReferralCode(userId,totalNewReferral,isAdditionalReferral,expiredDate,files){
        return { 
            content:`**${totalNewReferral} ${isAdditionalReferral?"more ":""}referral code for you!** :gift: 

Hi <@${userId}> thank you for being active & progressive on our community!
If you find the community is valuable, help us spread it to your friends that you think also need to know closa :smile:

One of the reason we’re able to sustainably provide better experience for our community because of the referral & support from the people like you :sparkles:

**Get 1 month free membership** both you and your friends for every referral code that redeemed. ${MessageFormatting.customEmoji().stonks}

the referral code *valid until ${expiredDate}*

Share to your network or friends using the cover image below 💌: ` , 
            files,
            components: [
                MessageComponent.createComponent(MessageComponent.addEmojiButton(`claimReferral_${userId}`,`Claim`,"🎁","PRIMARY"))
            ] 
        }
    }

    static showReferralCode(userId,referralCodes,dates,totalDay){
        const content = `**Copy & share your referral** *valid until ${dates}*:
\`\`\`
${referralCodes}
\`\`\`
Your friends can redeem it via https://closa.me/referral
*p.s: existing members can't redeem referral code. the code is for newcomers*` 
        const dataReferral = []
        const referrals = referralCodes.split('\n')
        referrals.forEach(referral=>{
            if (!referral.includes("(redeemed ✅)") && referral !== '') {
                dataReferral.push(referral)
            }
        })

        return { 
            content, 
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`generateReferral_${userId}`,'Generate Ticket',"PRIMARY").setEmoji('💌'),
                MessageComponent.addButton(`generateReferralCover_${userId}`,'Generate Invites Cover',"SECONDARY").setEmoji('✨'),
                MessageComponent.addLinkButton("Share on twitter",`https://twitter.com/intent/tweet?text=${ encodeURIComponent(ReferralCodeMessage.templateShareTwitterReferralCode(dataReferral,totalDay))}`)
            )]
        }
    }

    static templateShareTwitterReferralCode(referralCodes,totalDay){
        return `I'm on day ${totalDay} of my passion projects so far.
Closa has helped me to stay consistent on it 😄

I want to share my @beclosa referral code: 

${referralCodes.join("\n")}

Get free 1-month membership & redeem it via closa.me/referral🎁`
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
            content:`**Your membership status has been extended until ${endMembership}.**
You can type \`\`/referral\`\` to check your referral status.

Let's welcome your friend! → <#${CHANNEL_WELCOME}>` , 
            embeds: [MessageComponent.embedMessage({
                title: "1 month free membership from referral 🎁",
                description: `Your friend has onboarded to closa using this referral code from you:
${referralCode}`,
                user
            })], 
        }

    }

    static notifSuccessRedeem(user,referrer,totalMember,totalInvitedByReferrer){
        return { 
            content:`${user} joined via referral code from ${referrer}` , 
            embeds: [
                new MessageEmbed()
                    .setColor('#00B264')
                    .setTitle(`Welcome to closa ${user.username}!`)
                    .setThumbnail(InfoUser.getAvatar(user))
                    .setDescription(`Members number #${totalMember}`)
                    .setFooter({
                        iconURL:InfoUser.getAvatar(referrer),
                        text:`${totalInvitedByReferrer} ${totalInvitedByReferrer > 1 ? "Friends" : "Friend"} invited by ${referrer.username}`
                    })], 
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
        return {
            content:`:warning: **can't redeem the referral code for existing members** 
↳ you're detected as existing members that have joined the community previously

\`\`To get your access back, please renew your membership status\`\``,
            components: [MessageComponent.createComponent(
                MessageComponent.addLinkButton("Renew membership","https://tally.so/r/wbRa2w").setEmoji('💳')
            )]
        }
    }
    static cannotRedeemOwnCode(){
        return `Can't redeem your own code. 
Share it to your friends to get 1 month free membership.`
    }
    static replyInvalidReferralCode(){
        return {
            content:"⚠️ Invalid referral code",
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addLinkButton("Find on twitter","https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode")
                )
            ] 
        }
    }
    static replyAlreadyRedeemedCode(){
        return {
            content:"⚠️ This code already redeemed before. Use other code.",
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addLinkButton("Find on twitter","https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode")
                )
            ] 
        }
    }
    

    static replyExpiredCode(){
        return {
            content:"This referral code has expired.",
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addLinkButton("Find on twitter","https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40beclosa+%23closacode")
                )
            ] 
        }
    }

    static achieveFirstDailyStreak(newReferral,totalStreak,userId,files){
        return {
            content:`**${newReferral} referral code for you!** :gift: 

Hi ${MessageFormatting.tagUser(userId)} 💠 as an honor of achieving **${totalStreak}-day streak**, you are eligible for ${newReferral} referral code.

If you find the community is valuable, help us spread it to your friends. :smile: 
One of the reason we’re able to sustainably provide better experience for our community because of the referral & support from the people like you :sparkles:

**Get 1 month free membership both you and your friends** for every referral code that redeemed. :stonks:`,
            files,
            components: [
                MessageComponent.createComponent(MessageComponent.addEmojiButton(`claimReferral_${userId}`,`Claim`,"🎁","PRIMARY"))
            ] 
            }
    }

    static successGenerateReferralCover(files){
        return {
            content:`**💌 Share to your friends or network using invites cover below:**`,
            files
        }
    }
}

module.exports=ReferralCodeMessage