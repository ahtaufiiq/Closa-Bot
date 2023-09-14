const { userMention } = require("discord.js")
const MessageComponent = require("../helpers/MessageComponent")
const Time = require("../helpers/time")
const { truncateString } = require("../helpers/formatString")

class UsageMessage{
    static getLimitedUsage(membershipType,{totalCoworking,totalProgress}){
        let usage = `👩‍💻 ${totalCoworking}/20 coworking session
✅ ${totalProgress}/20 progress shared`        
        if(membershipType === 'lite'){
            usage = `👩‍💻 ${totalCoworking} coworking session
✅ ${totalProgress}/30 progress shared`
        }
        return usage
    }
    static remindAboutToReachLimitUsage(UserId,{totalCoworking,totalProgress},membershipType){
        const nextResetDay = Time.getNextResetDay()

        return {
            content:`Hi ${userMention(UserId)}, you're about to reach your free monthly usage:

\`\`\`
${UsageMessage.getLimitedUsage(membershipType,{totalCoworking,totalProgress})}
——
⏳ next reset in ${nextResetDay} day${nextResetDay>1?'s':''}
\`\`\`
Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +

the fund will help closa running sustainably.`,
            components:[MessageComponent.buttonBecomeProMember()]
        }
    }

    static alreadyReachedLimit(UserId,{totalCoworking,totalProgress,membershipType},type='coworking'){
        const nextResetDay = Time.getNextResetDay()
        return {
            content:`You've reached your free monthly ${type} usage ${userMention(UserId)}
\`\`\`
${UsageMessage.getLimitedUsage(membershipType,{totalCoworking,totalProgress})}
——
⏳ next reset in ${nextResetDay} day${nextResetDay>1?'s':''}
\`\`\`
Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +

the fund will help closa running sustainably.

${type === 'progress' ? "this post will auto-delete in **2 min**.":""}`,
            components:[MessageComponent.buttonBecomeProMember()]
        }
    }

    static checkMonthlyUsage(UserId,{totalCoworking,totalProgress},membershipType){
        const nextResetDay = Time.getNextResetDay()
        if(membershipType !== 'pro'){
            return {
                content:`Here are your monthly usage ${userMention(UserId)}
\`\`\`
${UsageMessage.getLimitedUsage(membershipType,{totalCoworking,totalProgress})}
——
⏳ next reset in ${nextResetDay} day${nextResetDay>1?'s':''}
\`\`\`
Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +

the fund will help closa running sustainably.`,
                components:[MessageComponent.buttonBecomeProMember()]
            }
        }else{
            return `Here are your monthly usage ${userMention(UserId)}
\`\`\`
👩‍💻 ${totalCoworking} coworking session
✅ ${totalProgress} progress shared
——
you're on ${membershipType} membership plan.
enjoy your unlimited usage ✨
\`\`\``
        }
    }

    static notEligibleUseCustomReminder(){
        return {
            content:`\`\`/remind me/\`\` command is pro feature.

Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +

the fund will help closa running sustainably.`,
            components:[MessageComponent.buttonBecomeProMember()]
        }
    }
    static notEligibleJoinSixWeekChallenge(){
        return {
            content:`6-week challenge is a pro feature.

Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +

the fund will help closa running sustainably.`,
            components:[MessageComponent.buttonBecomeProMember()]
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

the fund will help closa running sustainably.

here's the sample analytics:`,
            files:['./assets/images/sampleAdvanceReport.png'],
            components:[MessageComponent.buttonBecomeProMember()]
        }
    }

    static notifResetUsage(UserId){
        return `Your closa monthly free usage is here ${userMention(UserId)} 🎁
\`\`\`
👩‍💻 0/20 coworking session
✅ 0/20 progress shared
——
enjoy your free usage ✨
\`\`\``
    }

    static notifyDeleteProgress(UserId,{totalCoworking,totalProgress,progressContent},isFreeUser){
        const nextResetDay = Time.getNextResetDay()
        return {
            content:`Hi ${userMention(UserId)}, we just deleted your recent progress due to you've reached your monthly free usage.
You can share your progress again once you become pro member or your monthly free usage got reset.

Your recent progress:
\`\`\`
${truncateString(progressContent,1200)}
\`\`\`
here's your usage this month:
\`\`\`
👩‍💻 ${totalCoworking}${isFreeUser ? '/20':''} coworking session
✅ ${totalProgress}/20 progress shared 
——
⏳ next reset in ${nextResetDay} day${nextResetDay>1?'s':''}
\`\`\`
Support the community by becoming a pro member & get:
✓ Unlimited coworking session
✓ Unlimited active projects
✓ Unlimited progress
✓ Advance report
✓ Pro-only channel
✓ Many more +

the fund will help closa running sustainably`,
            components:[MessageComponent.buttonBecomeProMember()]
        }
    }

}

module.exports = UsageMessage