const Time = require("./time")

class AdvanceReportHelper{
    static getStatsCoworking(days){
        let stats = {
            max:{
                day:'',
                time:0
            },
            min:{
                day:'',
                time:null
            },
            average:0,
            totalTime:0,
            totalDay:0
        }
        for (const day in days) {
            const {totalTime} = days[day]
            stats.totalTime += totalTime
            stats.totalDay ++
            if(totalTime > stats.max.time){
                stats.max.day = day
                stats.max.time = totalTime
            }
            if(stats.min.time === null || totalTime < stats.min.time){
                stats.min.time = totalTime
                stats.min.day = day
            }
        }
        days[stats.max.day].showTime = true
        days[stats.min.day].showTime = true
        stats.average = Math.ceil(stats.totalTime / stats.totalDay)
        return stats
    }

    static generateLeftLabel(totalTime){
        let maxHour = Math.floor(totalTime * 10 / 60)/10

        if(maxHour <= 2) return [0,0.5,1,1.5,2]
        let highestLabel
        if(maxHour % 1 !== 0) maxHour = Math.floor(maxHour) + 1

        if(maxHour % 2 === 0) highestLabel = maxHour 
        else highestLabel = maxHour + 1
        const result = []
        for (let i = 0; i < 5; i++) {
            result.push(i * highestLabel / 4)
        }
        return result
    }

    static getFormattedReportDate(date){
        const [day,dateOfMonth,month,year] = Time.getFormattedDate(date,true).split(/[, ]+/)
        return `${dateOfMonth} ${month}, ${year}`
    }

    static getWeekDateRange(week=0){
        const date = Time.getDate()
        const day = date.getDay() || 7
        const startingDate = Time.getNextDate(-(day-1)+(7*week))
        const endingDate = Time.getNextDate(6,Time.getDateOnly(startingDate))
        return `${AdvanceReportHelper.getFormattedReportDate(startingDate)} — ${AdvanceReportHelper.getFormattedReportDate(endingDate)}`
    }
    static getWeekDateRangeByDate(date){
        const day = date.getDay() || 7
        const startingDate = Time.getNextDate(-(day-1),Time.getDateOnly(date))
        const endingDate = Time.getNextDate(6,Time.getDateOnly(startingDate))
        
        return `${AdvanceReportController.getFormattedReportDate(startingDate)} — ${AdvanceReportController.getFormattedReportDate(endingDate)}`
    }

    static getMostProductiveTime(productiveTime){
        const mostProductiveTime = {
            time:'-',
            total:0
        }
        
        for (const key in productiveTime) {
            const {time,total} = mostProductiveTime
            if(time === '-' || (time > key && total <= productiveTime[key])) {
                mostProductiveTime.time = key
                mostProductiveTime.total = productiveTime[key]
            }
        }
        
        return mostProductiveTime.time
    }
}
module.exports = AdvanceReportHelper