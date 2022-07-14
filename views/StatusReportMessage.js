const formatToRupiah = require("../helpers/formatToRupiah")
const Time = require("../helpers/time")

class StatusReportMessage{
    
    static weeklyReport(totalPreviousMembers,totalMember,totalNewMember,totalInactiveMember,previousMRR,MRR,totalRevenue,previousWeeklyStat,previousMonthlyRetentionRate,monthlyRetentionRate) {
        totalPreviousMembers -= totalNewMember
        const todayDate = Time.getDate()
        const previousDate = Time.getNextDate(-7)
        const totalActiveMember = totalMember - totalInactiveMember
        const thisMonth = Time.getThisMonth()
        const previousMonth = Time.getThisMonth(todayDate.getMonth()-1)
        const retentionRate = Number((totalActiveMember/totalMember*100).toFixed(0)) 
        const prevRetentionRate =  previousWeeklyStat.retention_rate
        
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
• Total : **${totalMember} **(${progressMembers})

**__REVENUE__** 💰  
• MRR (${thisMonth}): **${formatToRupiah(MRR)}** (${progressMRR}📈)
• Total Revenue:** ${formatToRupiah(totalRevenue)}**
`
    }

    static calculateProgress(previousProgress,currentProgress){
        return currentProgress >= previousProgress ? `+${(currentProgress/previousProgress*100).toFixed(0)}%`:`-${(currentProgress/previousProgress*100).toFixed(0)}%`
    }
}

module.exports = StatusReportMessage