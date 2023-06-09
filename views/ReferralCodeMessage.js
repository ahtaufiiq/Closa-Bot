const { EmbedBuilder, MessageActionRow, SelectMenuInteraction, MessageSelectMenu, AttachmentBuilder } = require("discord.js")
const ChannelController = require("../controllers/ChannelController")
const { CHANNEL_WELCOME } = require("../helpers/config")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class ReferralCodeMessage{

    static infoRedeemReferral(){
        return {
            content:`**Redeem your referral code to early get access here:**`,
            files:[new AttachmentBuilder('./assets/images/redeem_cover.png',{name:'cover.png'})],
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addButton("redeem","Enter Code","PRIMARY"),
                    MessageComponent.addLinkButton(
                        'Find on twitter',
                        "https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40joinclosa+%23closacode"
                    )
                )
            ] 
        }
    }

    static sendReferralCode(userId,totalNewReferral,isAdditionalReferral,files){
        return { 
            content:`**${totalNewReferral} ${isAdditionalReferral?"more ":""}referral code for you!** :gift: 

Hi <@${userId}> thank you for being active & progressive on our community!
Feel free to invite a friends that might valuable for our community :smile:

this will help us grow & provide better experience for you.` , 
            files,
            components: [
                MessageComponent.createComponent(MessageComponent.addEmojiButton(`claimReferral_${userId}`,`Claim`,"🎁","PRIMARY"))
            ] 
        }
    }

    static showReferralCode(userId,referralCodes){
        const content = `**Copy & share your referral**:
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
                MessageComponent.addEmojiButton(`generateReferral_${userId}`,'Ticket','💌',"PRIMARY"),
                MessageComponent.addEmojiButton(`generateReferralCover_${userId}`,'Invites Cover','✨',"SECONDARY"),
                MessageComponent.addLinkButton("Share on twitter",`https://twitter.com/intent/tweet?text=${ encodeURIComponent(ReferralCodeMessage.templateShareTwitterReferralCode(dataReferral))}`)
            )]
        }
    }

    static templateShareTwitterReferralCode(referralCodes){
        return `I have a referral code to @joinclosa discord server!

Get early access & stay productive together:
${referralCodes.join("\n").substring(0,208)}

Redeem it here → https://closa.me/referral🎁`
    }

    static allReferralAlreadyBeenRedeemed(){
        return `All of your code has been redeemed by your friends.
We'll send the next referral code once a month based on your active participation.`
    }
    static dontHaveReferralCode(){
        return `You don't have any referral code right now.
We'll send you once a month based on your active participation at closa.`
    }

    static successRedeemYourReferral(referralCode,user,referrerId){
        
        return { 
            content:`Hi ${MessageFormatting.tagUser(referrerId)}, let's welcome your friend! → <#${CHANNEL_WELCOME}>` , 
            embeds: [MessageComponent.embedMessage({
                title: "Your friends just redeemed your referral code",
                description: `${referralCode}`,
                user
            })], 
        }

    }

    static notifSuccessRedeem(user,referrer,totalMember,totalInvitedByReferrer){
        return { 
            embeds: [
                new EmbedBuilder()
                    .setColor('#00B264')
                    .setTitle(`Welcome to closa ${user.username}!`)
                    .setThumbnail(InfoUser.getAvatar(user))
                    .setDescription(`Members number #${totalMember} \n${user}`)
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
        return `Your code has successfully redeemed ✅
        
if you're on mobile please move to desktop to have better onboarding tour.`
    }
    static cannotRedeemMoreThanOne(){
        return "Referral code only can be use once for each user."
    }
    static cannotRedeemByExistingMember(){
        return {
            content:`:warning: **can't redeem the referral code for existing members** 
↳ you're detected as existing members that have joined the community previously`,
            // components: [MessageComponent.createComponent(
            //     MessageComponent.addLinkEmojiButton("Renew membership","https://tally.so/r/wbRa2w",'💳')
            // )]
        }
    }
    static cannotRedeemOwnCode(){
        return `Can't redeem your own code. 
Share it to your friends instead 😄`
    }
    static replyInvalidReferralCode(){
        return {
            content:"⚠️ Invalid referral code",
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addLinkButton("Find on twitter","https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40joinclosa+%23closacode")
                )
            ] 
        }
    }
    static replyAlreadyRedeemedCode(){
        return {
            content:"⚠️ This code already redeemed before. Use other code.",
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addLinkButton("Find on twitter","https://twitter.com/intent/tweet?text=Hi+I+am+looking+for+Closa+referral+code.%0D%0Ais+anyone+mind+to+share+the+code%3F%0D%0A%0D%0Acc%3A+%40joinclosa+%23closacode")
                )
            ] 
        }
    }
    
    static achieveFirstDailyStreak(newReferral,totalStreak,userId,files){
        return {
            content:`**${newReferral} referral code for you!** :gift: 

Hi ${MessageFormatting.tagUser(userId)} 💠 as an honor of achieving **${totalStreak}-day streak**, you are eligible for ${newReferral} referral code.
Feel free to invite a friends that might valuable for our community :smile:

this will help us grow & provide better experience for you.`,
            files,
            components: [
                MessageComponent.createComponent(MessageComponent.addEmojiButton(`claimReferral_${userId}`,`Claim`,"🎁","PRIMARY"))
            ] 
            }
    }

    static successGenerateReferralCover(files){
        return {
            content:`**💌 Share to your friends or network using invites cover below:**\nalso feel free to tag \`\`@joinclosa\`\`, we will help you spread your referral.`,
            files
        }
    }
}

module.exports=ReferralCodeMessage