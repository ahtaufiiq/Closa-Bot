const { MessageActionRow, MessageButton} = require("discord.js")
const { CHANNEL_REGISTRATION } = require("../helpers/config")
const MessageComponent = require("../helpers/MessageComponent")
class PaymentMessage{
    static remindEndedMembership(userId,endedMembership,remindDay){
        let reminder = `within the next ${remindDay} day`
        if (remindDay === 0) {
            reminder = "Today"
        }else if(remindDay === 1){
            reminder = "Tomorrow"
        }
        return { 
            content:`Hi <@${userId}> :wave:,
Thank you for being part of Closa Community :sparkles:.

**A friendly reminder that your Closa membership will be ended ${reminder} on ${endedMembership}.**` , 

            components: PaymentMessage.buttonLinkExtendMembership()
        }
    }

    static remindMembershipLateOneDay(userId){
        return { 
            content:`Hi <@${userId}>, we know you are busy. 
So, we give you 3 more days for you to extend your membership.` , 
            components: PaymentMessage.buttonLinkExtendMembership()
        }
    }
    static remindMembershipLateThreeDay(userId){
        return { 
            content:`Hi <@${userId}>, today is the final call to extend your membership. 
After that your community access will be restricted.` , 
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

    static buttonLinkExtendMembership(label="Extend membership"){
        return [
            MessageComponent.createComponent(
                MessageComponent.addLinkButton(label,"https://tally.so/r/wbRa2w")
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

    static successExtendMembership(formattedDate){
        return `Your closa membership status active until ${formattedDate}`
    }
    
}

module.exports = PaymentMessage