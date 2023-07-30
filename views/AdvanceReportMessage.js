const { userMention, ButtonStyle } = require("discord.js")
const Time = require("../helpers/time")
const AdvanceReportController = require("../controllers/AdvanceReportController")
const MessageComponent = require("../helpers/MessageComponent")

class AdvanceReportMessage{
    static thumbnailReport(UserId,files,dateRange,position=2){
        return {
            content:`Here's a new thumbnail for you:`,
            files,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`changeThumbnail_${UserId}_${dateRange}|1`,'1',ButtonStyle.Secondary).setEmoji('⚪'),
                MessageComponent.addButton(`changeThumbnail_${UserId}_${dateRange}|2`,'2',ButtonStyle.Secondary).setEmoji('⚪'),
                MessageComponent.addButton(`changeThumbnail_${UserId}_${dateRange}|3`,'3',ButtonStyle.Secondary).setEmoji('⚫'),
                MessageComponent.addButton(`changeThumbnail_${UserId}_${dateRange}|4`,'4',ButtonStyle.Secondary).setEmoji('⚫'),
                MessageComponent.addButton(`changeThumbnail_${UserId}_${dateRange}|5`,'5',ButtonStyle.Secondary).setEmoji('🟠'),
                MessageComponent.addButton(`changeThumbnail_${UserId}_${dateRange}|6`,'6',ButtonStyle.Secondary).setEmoji('🔴'),
                MessageComponent.addButton(`changeThumbnail_${UserId}_${dateRange}|7`,'7',ButtonStyle.Secondary).setEmoji('🟣'),
                MessageComponent.addButton(`changeThumbnail_${UserId}_${dateRange}|8`,'8',ButtonStyle.Secondary).setEmoji('🟣'),
                MessageComponent.addButton(`changeThumbnail_${UserId}_${dateRange}|9`,'9',ButtonStyle.Secondary).setEmoji('🟣'),
            )]
        }
    }
    static onlyReport(UserId,files,dateRange,action='thisWeek'){
        return {
            content:`Here's your detailed report ${userMention(UserId)}`,
            files,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`lastWeek_${UserId}_${dateRange}`,'Last week',ButtonStyle.Secondary).setEmoji('⬅️').setDisabled(action === 'lastWeek'),
                MessageComponent.addButton(`thisWeek_${UserId}_${dateRange}`,'This week',ButtonStyle.Secondary).setEmoji('➡️').setDisabled(action === 'thisWeek'),
                MessageComponent.addButton(`generateThumbnailAdvanceReport_${UserId}_${dateRange}`,'Generate thumbnail',ButtonStyle.Secondary).setEmoji('🖼️')
            )]
        }
    }
    static summaryReport({dateRange,UserId,thisWeekStats,productiveTime,tasks,lastWeekStats,totalSickTicket,totalVacationTicket,weeklyGoal},files){
        const {totalTime,focusTime,breakTime} = thisWeekStats
        let percentageFocusTime = Math.ceil(focusTime / totalTime * 100)
        let percentageBreakTime = 100 - percentageFocusTime

        const percentageReachedWeeklyGoal = Math.round(totalTime/weeklyGoal*100)
        
        const averageDailyWork = Math.floor(totalTime/7)
        let content = `Hi ${userMention(UserId)}, here's your weekly report: **${dateRange}**

- you've been working \`\`${Time.convertTime(totalTime,'short',true,true)}\`\` (\`\`${percentageReachedWeeklyGoal}%\`\` of your goal)`
        if(percentageBreakTime > 50) content += `, but had too much rest xD (\`\`${percentageBreakTime}%\`\` of work hours)\n`
        else if(percentageReachedWeeklyGoal > 150) content += ` you've worked super hard, please get enough rest.\n`
        else if(percentageReachedWeeklyGoal >= 90) content += ` a productive week, keep it up!\n`
        else content += `, I hope you have a productive session this week.\n`

        const {totalTimeLastWeek} = lastWeekStats
        content += `- with average daily work: \`\`${Time.convertTime(averageDailyWork,'short',true,true)}\`\` `
        if(totalTimeLastWeek !== null){
            const averageDailyWorkLastWeek = Math.floor(totalTimeLastWeek/7)
            const diffAverageHour = Math.abs(averageDailyWork-averageDailyWorkLastWeek)
            if(totalTime > totalTimeLastWeek){
                content += `increased (\`\`↑${diffAverageHour}% \`\`vs last week)\n`
            }else if(totalTime < totalTimeLastWeek){
                content += `decreased (\`\`↓${diffAverageHour}% \`\`vs last week)\n`
            }else content +='same with last week, keep it up!\n'
        }else{
            content +='\n'
        }
        content += `- most of your time are invested into ${tasks[0].taskName} with \`\`${Time.convertTime(tasks[0].totalTime,'short',true,true)}\`\` work time.\n`

        if(totalSickTicket >= 2) content += `- you took \`\`${totalSickTicket}x \`\`sick day, please take care of yourself & have a decent rest next time.\n`
        else if(totalVacationTicket >= 3) content += `- you took \`\`${totalVacationTicket}\`\` vacation day, i hope you're having a good time!\n`

        content += `\nhave a good week!

please find the all the details below:`

        return {
            content,
            files,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`generateThumbnailAdvanceReport_${UserId}_${dateRange}`,'Generate Thumbnail',ButtonStyle.Secondary).setEmoji('🖼️')
            )]
        }
    }

    static emptyLastWeekReport(UserId){
        return `⚠️ You haven't done any coworking session last week ${userMention(UserId)}
need at least few coworking sessions done to generate the report.`
    }
    static emptyReport(week,UserId){
        let selectedPeriod = 'this week'
        if(week === -1) selectedPeriod = 'last week'
        else selectedPeriod = `on \`\`${AdvanceReportController.getWeekDateRange(week)}\`\``
        return `⚠️ You haven't done any coworking session ${selectedPeriod} ${userMention(UserId)}
need at least few coworking sessions done to generate the report.`
    }
}
module.exports = AdvanceReportMessage
