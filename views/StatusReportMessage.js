const Time = require("../helpers/time")
const {GUILD_ID} = require('../helpers/config')
const formatNumber = require("../helpers/formatNumber")
class StatusReportMessage{
    static inactiveMemberReport(userId,email,goalId){
        return `:rotating_light: **User not active for 5 days **
        
• User : <@${userId}>
• Last active: *${Time.getFormattedDate(Time.getNextDate(-5))}*
• Email: ${email}
• Last goal: https://discord.com/channels/${GUILD_ID}/${goalId}`
    }
    static activeMemberReport(userId,email,goalId,lastDate){
        const date = Time.getDate(lastDate)
        const diffDay = Time.getDiffDay(date,Time.getDate())

        return `:green_circle: **User comeback after ${diffDay} days of inactivity **

• User : <@${userId}>
• Last active: *${Time.getFormattedDate(date)}*
• Email: ${email}
• Last goal: https://discord.com/channels/${GUILD_ID}/${goalId}`
    }
    
    static weeklyReport(totalPreviousMembers,totalMember,totalNewMember,totalInactiveMember,previousMRR,MRR,totalRevenue,previousWeeklyStat,previousMonthlyRetentionRate,monthlyRetentionRate) {
        totalPreviousMembers -= totalNewMember
        const todayDate = Time.getDate()
        const previousDate = Time.getNextDate(-7)
        const totalActiveMember = totalMember - totalInactiveMember
        const thisMonth = Time.getThisMonth()
        const previousMonth = Time.getThisMonth(todayDate.getMonth()-1)
        const retentionRate = Number((totalActiveMember/totalMember*100).toFixed(0)) 
        const prevRetentionRate =  previousWeeklyStat?.retention_rate || 0
        
        const progressRetentionRate = retentionRate >= prevRetentionRate ? `+${retentionRate-prevRetentionRate}% 📈`:`${retentionRate-prevRetentionRate}% 📉`
        const progressMonthlyRetentionRate = monthlyRetentionRate >= previousMonthlyRetentionRate ? `+${monthlyRetentionRate-previousMonthlyRetentionRate}%`:`${monthlyRetentionRate-previousMonthlyRetentionRate}%`
        const progressMRR = this.calculateProgress(previousMRR,MRR)
        const progressMembers = this.calculateProgress(totalPreviousMembers,totalMember)
        const churn = totalPreviousMembers > totalMember ? totalPreviousMembers - totalMember : 0
        
        return `:bar_chart: **Weekly Status from ${Time.getThisMonth(previousDate.getMonth())} ${previousDate.getDate()} - ${Time.getThisMonth()} ${todayDate.getDate()}, ${todayDate.getFullYear()}**
					
**__RETENTION__** 🔁  
• This Week: **${retentionRate}% ** (${progressRetentionRate}) 
• ${thisMonth}: **${monthlyRetentionRate}%** (${progressMonthlyRetentionRate} higher than __${previousMonth}__)

__**MEMBERS**__ 👥 
• New: **+${totalNewMember}**
• Churn: **${churn}**
• Active: **${totalActiveMember}** 
• Inactive : **${totalInactiveMember}**
• Total (${thisMonth}): **${totalMember} **(${progressMembers})

**__REVENUE__** 💰  
• MRR (${thisMonth}): **IDR ${formatNumber(MRR)}** (${progressMRR}📈)
• Total Revenue:** IDR ${formatNumber(totalRevenue)}**
`
    }

    static calculateProgress(previousProgress,currentProgress){
        if(previousProgress === 0) return `+${formatNumber(currentProgress)}%`
        return currentProgress >= previousProgress ? `+${(currentProgress/previousProgress*100).toFixed(0)}%`:`-${(currentProgress/previousProgress*100).toFixed(0)}%`
    }
}

module.exports = StatusReportMessage