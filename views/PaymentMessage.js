const { userMention } = require("discord.js")
const { CHANNEL_REGISTRATION } = require("../helpers/config")
const MessageComponent = require("../helpers/MessageComponent")
class PaymentMessage{
    static remindEndedMembership(userId,endedMembership,remindDay,membershipType='pro'){
        let reminder = `within the next ${remindDay} day`
        if (remindDay === 0) {
            reminder = "Today"
        }else if(remindDay === 1){
            reminder = "Tomorrow"
        }
        return { 
            content:`Hi <@${userId}, a friendly reminder that your ${membershipType} membership will be ended ${reminder} on ${endedMembership}

You can continue supporting us as a ${membershipType} member via the button below.
the fund will help us building a sustainable community for you.

I hope you have a productive day ahead!`, 
            components: PaymentMessage.buttonLinkExtendMembership()
        }
    }

    static remindMembershipLateOneDay(userId,membershipType='pro'){
        return { 
            content:`Hi <@${userId}>, we know you are busy. 
So, you'll have 3 more days to keep your ${membershipType} membership.

Your support will help us building a sustainable home for builders & passion projects.` , 
            components: PaymentMessage.buttonLinkExtendMembership()
        }
    }
    static remindMembershipLateThreeDay(userId,membershipType='pro'){
        return { 
            content:`Hi <@${userId}>, it's been +3 days since since your ${membershipType} membership ended.

You can continue supporting us as a ${membershipType} member via the button below,
or Your will be revert back to free membership plan.

I hope you have a productive day ahead!` , 
            components: PaymentMessage.buttonLinkExtendMembership()
        }
    }
    static remindJoinNextCohort(userId){
        return { 
            content:`Hi <@${userId}>, we just restrict your access from closa community. 
Feel free to come back when you are ready! 

Thank you for giving us a chance.

Click reminder below if you want to join in the next cohort
We will send you notification when the next cohort is coming.` , 
            components: PaymentMessage.buttonRemindJoinNextCohort(userId)
        }
    }

    static replySetReminderJoinNextCohort(){
        return `✅ Your reminder already set.
We'll notify you when the next cohort is coming.`
    }

    static remind5DaysBeforeKickoff(userId,kickoffDate){
        return { 
            content:`**Hi <@${userId}>, the closa next cohort is coming** :fire:
If you want to get back on your passion project feel free to join cohort!

next cohort: \`\`${kickoffDate}\`\`` , 
            components: PaymentMessage.buttonLinkExtendMembership("Join the cohort")
        }
    }
    static remind1DayBeforeKickoff(userId){
        return { 
            content:`**Hi <@${userId}>, the closa next cohort is coming tomorrow** :fire:
feel free to join cohort if you want to get back on track!`, 
            components: PaymentMessage.buttonLinkExtendMembership("Join the cohort")
        }
    }

    static remindBeforeKickoffCohort(kickoffDate,day = 5){
        if (day === 5) {
            return `Hi @here!

**the closa next cohort is coming** :fire:
If you want to get back on your passion project feel free to join cohort!

next cohort: \`\`${kickoffDate}\`\`

learn more → <#${CHANNEL_REGISTRATION}>`
        }else{
            return `**Hi @here, the closa next cohort is coming tomorrow** :fire:
feel free to join cohort if you want to get back on track!

learn more → <#${CHANNEL_REGISTRATION}>`
        }
    }

    static  buttonLinkExtendMembership(label="Extend membership"){
        return [
            MessageComponent.createComponent(
                MessageComponent.addLinkEmojiButton(label,"https://closa.me/pricing",'💎')
            )
        ]
    }

    static  buttonBecomeProMember(){
        return [
            MessageComponent.createComponent(
                MessageComponent.addLinkEmojiButton("Become pro member","https://closa.me/pricing",'💎')
            )
        ]
    }
    static buttonRemindJoinNextCohort(userId){
        return [
            MessageComponent.createComponent(
                MessageComponent.addButton(`remindJoinNextCohort_${userId}`,"🔔 Remind me","PRIMARY")
            )
        ]
    }

    static successExtendMembership(UserId,formattedDate,membershipType){
        return `Hi ${userMention(UserId)}, your ${membershipType} membership status active until ${formattedDate}`
    }
    static notEligibleGenerateAdvanceReport(){
        return {
            ephemeral:true,
            content:`Advance report is a pro feature.

Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +

here's the sample analytics:`,
            files:['./assets/images/sampleAdvanceReport.png'],
            components:[PaymentMessage.buttonBecomeProMember()]
        }
    }
    
}

module.exports = PaymentMessage