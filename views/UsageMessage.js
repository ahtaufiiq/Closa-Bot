const { userMention } = require("discord.js")
const MessageComponent = require("../helpers/MessageComponent")
const Time = require("../helpers/time")

class UsageMessage{
    static remindAboutToReachLimitUsage(UserId,totalCoworking){
        const nextResetDay = Time.getNextResetDay()
        
        return {
            content:`Hi ${userMention(UserId)}, you're about to reach your free monthly usage:

\`\`\`
👩‍💻 ${totalCoworking}/20 coworking session
——
⏳ next reset in ${nextResetDay} day${nextResetDay>1?'s':''}
\`\`\`
Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +`,
            components:[MessageComponent.buttonBecomeProMember()]
        }
    }

    static alreadyReachedLimit(UserId){
        const nextResetDay = Time.getNextResetDay()
        return {
            content:`You've reached your free monthly coworking usage ${userMention(UserId)}
\`\`\`
👩‍💻 20/20 coworking session
——
⏳ next reset in ${nextResetDay} day${nextResetDay>1?'s':''}
\`\`\`
Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +`,
            components:[MessageComponent.buttonBecomeProMember()]
        }
    }

    static checkMonthlyUsage(UserId,totalCoworking,membershipType){
        const nextResetDay = Time.getNextResetDay()
        if(!membershipType){
            return {
                content:`Here are your monthly usage ${userMention(UserId)}
\`\`\`
👩‍💻 ${totalCoworking}/20 coworking session
——
⏳ next reset in ${nextResetDay} day${nextResetDay>1?'s':''}
\`\`\`
Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +`,
                components:[MessageComponent.buttonBecomeProMember()]
            }
        }else{
            return `Here are your monthly usage ${userMention(UserId)}
\`\`\`
👩‍💻 ${totalCoworking} coworking session
——
you're on ${membershipType} membership plan.
enjoy your unlimited usage ✨
\`\`\``
        }
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
            components:[MessageComponent.buttonBecomeProMember()]
        }
    }

    static notifResetUsage(UserId){
        return `Your closa monthly free usage is here ${UserId} 🎁
\`\`\`
👩‍💻 20/20 coworking session
——
enjoy your free usage ✨
\`\`\``
    }
}

module.exports = UsageMessage